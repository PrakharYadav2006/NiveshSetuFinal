import { LANGS, QUESTIONS, STOCKS, NEWS, INDICES, SEASON_DAYS, CRASH, BUY_REASONS, SELL_REASONS, CONCEPTS, buildProfile, REFUSAL, orderFlags, companyFlags, hadNews, CAUSE_FLAG } from './data.js';
import { buildMarket, newBook, quote, px, history, changeOver, indexQuote, range, buy, sell, holdings, totals, advance, PRE, volume, avgVolume, sma } from './engine.js';
import { CONDS, condOf, isMet, defaultValue, evaluate, describe, at, MAX_ACTIVE } from './alerts.js';
import { analyse } from './metrics.js';
import { COACH, conceptText, analogy, goalLine } from './coach.js';
import { t, L, setLang, lang, inr, signed, signedInr } from './i18n.js';
import { areaChart, spark, bindScrub } from './chart.js';
import * as voice from './voice.js';
import { isAdviceRequest } from '../shared/safety.js';
import { initTheme, toggleTheme, themeIcon } from '../shared/theme.js';
import { LOGO } from '../shared/brand.js';
import { api, health, listen } from '../shared/listen.js';
import { setPlayerName, getPlayerName, displayName } from '../shared/profile.js';
import { maybeShowTip, markTipSeen, tipHTML } from '../shared/tips.js';
import { pickFlagLessons, lessonHTML } from '../shared/lessons.js';
import { TIP_TEXT } from '../shared/reasoning.js';
import { newGate, runCheck, decided, overriding, record, gateHTML, onGateInput } from '../shared/gate.js';

const PILOT = new URLSearchParams(location.search).has('pilot');
const $app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stockOf = (code) => STOCKS.find((s) => s.code === code);
const initials = (n) => n.split(' ').slice(0, 2).map((w) => w[0]).join('');
const pctCls = (v) => (v >= 0 ? 'up' : 'dn');
const fmtP = (v) => inr(v, 2);
const provName = () => 'Sarvam';
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

const st = {
  screen: 'lang', qi: 0, answers: {}, profile: null,
  M: null, book: null, day: 1,
  tab: 'explore', code: null, stockTab: 'overview', tf: '1M', openedAt: 0,
  sheet: null, coach: null, queue: [], seen: {}, research: {}, watch: {},
  toast: '', search: '', panel: false, aiOk: null,
  ai: {}, coachAI: {}, ask: { q: '', a: '', src: '', loading: false }, report: null,
  tip: null, pendingTip: null,
  alerts: [], alertsPanel: false, alertPop: [],
};
let listener = null;

// ── Helpers ──────────────────────────────────────────────────
function render() {
  const fn = SCREENS[st.screen];
  $app.innerHTML = fn() + overlays();
  st.anim = null;
  // The name is user input: it is set as text, never as HTML.
  const g = $app.querySelector('#greet');
  if (g) { const n = displayName(getPlayerName()); g.textContent = n ? t('greetName', { name: n }) : t('greet'); }
  bindScrub($app, fmtP);
  const inp = $app.querySelector('#search');
  if (inp && st.focusSearch) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
}
function go(screen) { st.screen = screen; st.toast = ''; voice.stop(); render(); window.scrollTo(0, 0); }
function toast(msg) { st.toast = msg; render(); setTimeout(() => { if (st.toast === msg) { st.toast = ''; render(); } }, 1800); }
const research = (code) => (st.research[code] ||= { info: false, news: false, chart: false });
// Sent to the AI: answers that shape the coaching + the order list. Never the name.
const safeProfile = () => { const { name, answers, ...rest } = st.profile; return rest; };
const gameBody = (extra = {}) => ({ profile: safeProfile(), orders: st.book.orders, day: st.day, ...extra });

// Coach: the fixed card shows at once; the AI then writes a note about THIS player's situation.
function showCoach(c) {
  if (!c) return;
  if (st.coach) { st.queue.push(c); return; }
  st.coach = c; st.ai[c.id] = null; st.anim = 'coach'; render();
  if (c.event && st.aiOk) personalise(c);
  else if (st.profile.voiceAuto) voice.speak([c.lead, c.body, c.analogy].filter(Boolean).join(' '));
}
// At most one coach call in flight; the fixed lesson is already on screen, so the player never waits.
let coachBusy = false;
const DEV = ['localhost', '127.0.0.1'].includes(location.hostname) || new URLSearchParams(location.search).has('debug');
async function personalise(c) {
  if (coachBusy) { st.coachAI[c.id] = { failed: true, why: 'busy' }; return; }
  coachBusy = true;
  st.coachAI[c.id] = { loading: true }; render();
  const out = await api('coach', gameBody({ event: c.event, code: c.code }), 45000);
  coachBusy = false;
  st.coachAI[c.id] = out?.source === 'ai' ? out : { failed: true, why: out?.why || 'network_or_timeout' };
  if (DEV) console.info('[coach]', c.event, out?.source || 'no-response', out?.why || '', out?.ms ? out.ms + 'ms' : '');
  if (st.coach?.id === c.id) {
    render();
    const a = st.coachAI[c.id];
    if (st.profile.voiceAuto) voice.speak(a.message ? `${a.title}. ${a.message} ${a.question}` : [c.lead, c.body].filter(Boolean).join(' '));
  }
}
// First-time tab tips: never stacked on top of a coach card or an order sheet.
function openTip(id) {
  if (st.coach || st.sheet) { st.pendingTip = id; return; }
  st.pendingTip = null; st.tip = id; markTipSeen(id); render();
  if (st.profile?.voiceAuto) voice.speak(t('tip_' + id).replace(/\n/g, ' '), 'tip_' + id, { cachedOnly: true });
}
const tipBtn = (id) => `<button class="qhelp" data-a="tipHelp" data-v="${id}" aria-label="${t('tipHelp')}">?</button>`;

function once(key, make) { if (st.seen[key]) return; st.seen[key] = true; showCoach(make()); }

// ── Actions ──────────────────────────────────────────────────
const A = {
  theme: () => { toggleTheme(); render(); },
  lang: (l) => { setLang(l); st.screen = 'q'; st.qi = 0; render(); speakQ(); },
  opt: (v) => {
    const q = QUESTIONS[st.qi];
    if (q.type === 'multi') {
      const cur = st.answers[q.id] || [];
      const exclusive = ['none', 'nothing'];
      let next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur.filter((x) => !exclusive.includes(x)), v];
      if (exclusive.includes(v) && !cur.includes(v)) next = [v];
      st.answers[q.id] = next; render();
    } else {
      st.answers[q.id] = v; render();
      setTimeout(() => A.qnext(), 220);
    }
  },
  qnext: () => {
    const q = QUESTIONS[st.qi];
    if (q.type === 'text') { const i = $app.querySelector('#qtext'); st.answers.name = setPlayerName(i ? i.value : getPlayerName()); }
    else if (st.answers.name == null) st.answers.name = getPlayerName();
    if (st.qi < QUESTIONS.length - 1) { st.qi++; render(); speakQ(); }
    else { st.profile = buildProfile(lang(), st.answers); voice.setMuted(!st.profile.voiceAuto); go('setup'); }
  },
  qskip: () => { const i = $app.querySelector('#qtext'); if (i) i.value = ''; st.answers.name = setPlayerName(''); A.qnext(); },
  qback: () => { if (st.qi > 0) { st.qi--; render(); } else go('lang'); },
  hearQ: () => { voice.setMuted(false); speakQ(true); },
  start: () => {
    st.M = buildMarket(); st.book = newBook(st.profile.startCash); st.day = 1;
    st.tab = 'explore'; go('app');
    showCoach(COACH.welcome(st.profile));
    if (maybeShowTip('explore')) openTip('explore');
  },
  mute: () => { voice.setMuted(!voice.isMuted()); render(); },
  tab: (v) => { st.tab = v; render(); if (maybeShowTip(v)) openTip(v); },
  tipHelp: (v) => openTip(v),
  tipClose: () => { voice.stop(); st.tip = null; render(); },
  open: (code) => { st.code = code; st.stockTab = 'overview'; st.openedAt = Date.now(); go('stock'); },
  back: () => { st.screen = 'app'; render(); },
  stab: (v) => { st.stockTab = v; if (v === 'news') research(st.code).news = true; render(); },
  tf: (v) => { st.tf = v; if (v === '3M') research(st.code).chart = true; render(); },
  star: () => {
    const c = st.code;
    if (st.watch[c]) { delete st.watch[c]; toast(t('watchRemoved')); } else { st.watch[c] = st.day; toast(t('watchAdded')); }
  },
  info: (concept) => {
    if (st.code && st.screen === 'stock') research(st.code).info = true;
    showCoach({ id: 'info-' + concept, concept, title: L(CONCEPTS[concept].title), lead: '', body: conceptText(concept, st.profile), analogy: analogy(concept, st.profile), tone: 'calm', info: true });
  },
  next: () => {
    if (st.day >= SEASON_DAYS) { openReport(); return; }
    st.day++;
    const events = advance(st.book, st.M, st.day);
    st.screen = 'app'; st.tab = st.tab || 'explore';
    render(); window.scrollTo(0, 0);
    events.filter((e) => e.type === 'margincall').forEach((e) => showCoach(COACH.margincall(st.profile, e)));
    runAlerts();
    if (st.day === 3) once('trending', () => COACH.trending(st.profile));
    if (st.day === CRASH.from) once('crash', () => COACH.crash(st.profile));
    if (st.day === 14 && st.book.pos.VIKISPAT) once('debt', () => COACH.debt(st.profile));
    if (!st.coach) toast(L(NEWS[st.day]?.[0]) || t('day', { d: st.day, t: SEASON_DAYS }));
  },
  sheet: (side) => {
    const held = st.book.pos[st.code];
    // Quantity always starts at 0: a pre-filled number anchors the choice (and a pre-filled "all" would inflate panic sells).
    st.sheet = { side, code: st.code, lev: held?.lev || 1, qty: 0, gate: newGate(side), openedAt: Date.now() };
    st.anim = 'sheet';
    render();
  },
  close: () => { stopListening(); st.sheet = null; render(); if (st.pendingTip) openTip(st.pendingTip); },
  lev: (v) => {
    const s = st.sheet; if (st.book.pos[s.code]) return;
    s.lev = +v;
    if (s.lev > 1) {
      const own = Math.max(1000, Math.round((st.book.cash * 0.2) / 1000) * 1000);
      once('leverage', () => COACH.leverage(st.profile, { own, value: own * 4 }));
    }
    resetGateIfChecked(); render();
  },
  qty: (d) => {
    const s = st.sheet, p = px(st.M, s.code, st.day);
    const maxBuy = Math.floor((st.book.cash * s.lev) / p), held = st.book.pos[s.code]?.qty || 0;
    const max = s.side === 'buy' ? maxBuy : held;
    const frac = { quarter: 0.25, half: 0.5, all: 1 }[d];
    s.qty = d === 'max' ? max : frac ? Math.min(max, Math.max(1, Math.floor(max * frac))) : Math.max(0, Math.min(max, s.qty + +d));
    resetGateIfChecked(); render();
  },
  gateChip: (k) => {
    const g = st.sheet.gate, list = g.side === 'buy' ? BUY_REASONS : SELL_REASONS;
    const label = L(list.find(([v]) => v === k)[1]);
    g.chip = k;
    if (!g.text.includes(label)) g.text = (g.text.trim() ? g.text.trim() + '. ' : '') + label + ({ hi: ', क्योंकि ', mr: ', कारण ' }[lang()] || ', because ');
    render();
    const ta = $app.querySelector('#gate-text'); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  },
  gateCheck: async () => {
    const s = st.sheet; if (!s) return;
    stopListening();
    const g = s.gate;
    const run5 = changeOver(st.M, s.code, st.day, 5);
    const T = totals(st.book, st.M, st.day), price = px(st.M, s.code, st.day);
    const weightAfter = sheetWeight();
    const flagIds = sheetFlags().map((f) => f.id);
    const inCrash = st.day >= CRASH.from && st.day <= CRASH.to;
    const p = runCheck(g, gameBody({ app: 'sim', code: s.code, qty: s.qty, lev: s.lev, ctx: { run5, weightAfter, lev: s.lev, value: s.qty * price, own: (s.qty * price) / s.lev, flagIds, inCrash, news: hadNews(s.code, st.day) } }), lang());
    render();
    await p;
    if (st.sheet?.gate === g) {
      render();
      const r = g.result;
      if (st.profile.voiceAuto && r) voice.speak(r.question && !decided(g) ? r.question : [r.wrong, r.tip].filter(Boolean).join(' '));
    }
  },
  gateMic: async () => {
    const g = st.sheet?.gate; if (!g) return;
    if (g.listening && listener) {
      g.listening = false; render();
      const text = await listener.stop(); listener = null;
      if (text) { if (g.result && g.result.question) g.answer = (g.answer ? g.answer + ' ' : '') + text; else g.text = (g.text ? g.text + ' ' : '') + text; }
      render(); return;
    }
    voice.stop();
    g.listening = true; render();
    listener = await listen(lang());
  },
  place: () => {
    const s = st.sheet;
    if (!s || s.qty <= 0 || !decided(s.gate)) return;
    stopListening();
    const now = Date.now();
    const rec = record(s.gate);
    // What was shown before this order ("Things to know"), and that the player went ahead.
    const flagsSeen = s.side === 'buy' ? [...new Set([...sheetFlags().map((f) => f.id), ...(rec.gate.flagsSeen || [])])] : [];
    Object.assign(rec, { flagsSeen, proceeded: true });
    const thinkMs = Math.min(300000, s.openedAt - st.openedAt) + Math.min(300000, now - s.openedAt);
    if (s.side === 'buy') {
      const run = changeOver(st.M, s.code, st.day, 5);
      const r = research(s.code);
      const out = buy(st.book, st.M, st.day, s.code, s.qty, s.lev, { ...rec, thinkMs, research: { ...r, watched: st.watch[s.code] != null && st.watch[s.code] < st.day } });
      if (out.error) { toast(out.error === 'cash' ? t('notEnough') : t('mixErr')); return; }
      st.sheet = null; toast(t('done'));
      const w = st.book.maxWeight, flags = rec.gate.flags || [];
      if (run > 15) once('chasing', () => ({ ...COACH.chasing(st.profile, { code: s.code, run }), code: s.code }));
      else if (w.w > 0.5) once('concentration', () => ({ ...COACH.concentration(st.profile, w), code: w.code }));
      else if (s.gate.chip === 'tip' || flags.includes('tip')) once('tip', () => ({ ...COACH.tip(st.profile), code: s.code }));
    } else {
      sell(st.book, st.M, st.day, s.code, s.qty, { ...rec, thinkMs });
      st.sheet = null; toast(t('done'));
      const fear = s.gate.chip === 'fear' || (rec.gate.flags || []).includes('fear');
      if (fear && st.day >= CRASH.from && st.day <= CRASH.to + 1) once('panic', () => ({ ...COACH.panic(st.profile), code: s.code }));
    }
  },
  // ── Alerts ──
  alertNew: () => {
    const code = st.code, held = st.book.pos[code];
    st.sheet = { mode: 'alert', code, cond: 'price_above', value: defaultValue('price_above', st.M, code, st.day), kind: 'simple', side: held ? 'sell' : 'buy', qty: 0, lev: 1, gate: newGate(held ? 'sell' : 'buy'), openedAt: Date.now() };
    st.anim = 'sheet'; render();
  },
  alertCond: (v) => { const s = st.sheet; s.cond = v; s.value = defaultValue(v, st.M, s.code, st.day); render(); },
  alertKind: (v) => { const s = st.sheet; s.kind = v; render(); },
  alertSide: (v) => { const s = st.sheet; if (v === 'sell' && !st.book.pos[s.code]) return; s.side = v; s.qty = 0; s.gate = newGate(v); render(); },
  alertSave: async () => {
    const s = st.sheet; if (!s || s.mode !== 'alert') return;
    if (activeAlerts() >= MAX_ACTIVE) { toast(at('tooMany')); return; }
    if (condOf(s.cond).needs && !(s.value > 0)) { toast(at('needValue')); return; }
    const a = { id: 'al' + Date.now(), code: s.code, cond: s.cond, value: condOf(s.cond).needs ? s.value : null, kind: s.kind, createdDay: st.day, status: 'active' };
    if (s.kind === 'ato') {
      if (s.qty <= 0) { toast(at('needQty')); return; }
      if (!decided(s.gate)) { toast(at('needReason')); return; }
      const rec = record(s.gate);
      const flagsSeen = s.side === 'buy' ? [...new Set([...sheetFlags().map((f) => f.id), ...(rec.gate.flagsSeen || [])])] : [];
      const thinkMs = Math.min(300000, s.openedAt - st.openedAt) + Math.min(300000, Date.now() - s.openedAt);
      a.ato = { side: s.side, qty: s.qty, meta: { ...rec, thinkMs, flagsSeen, proceeded: true, ato: true, research: { ...research(s.code), watched: st.watch[s.code] != null && st.watch[s.code] < st.day } } };
    }
    stopListening();
    st.alerts.push(a); st.sheet = null;
    toast(at('saved'));
    // Ask for the phone's notification permission once, from this tap.
    try { if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission(); } catch {}
  },
  alertsPanel: () => { st.alertsPanel = !st.alertsPanel; st.anim = 'panel'; render(); },
  alertCancel: (id) => { const a = st.alerts.find((x) => x.id === id); if (a && a.status === 'active') a.status = 'cancelled'; render(); },
  alertPopOk: () => { st.alertPop = []; voice.stop(); render(); if (!st.coach && st.pendingTip) openTip(st.pendingTip); },
  notifyPerm: async () => { try { await Notification.requestPermission(); } catch {} render(); },
  coachOk: () => {
    voice.stop();
    st.coach = st.queue.shift() || null;
    if (st.coach) {
      st.anim = 'coach';
      const c = st.coach;
      if (c.event && st.aiOk) { render(); personalise(c); return; }
    }
    render();
    if (st.coach && st.profile.voiceAuto) voice.speak([st.coach.lead, st.coach.body, st.coach.analogy].filter(Boolean).join(' '));
    if (!st.coach && st.pendingTip) openTip(st.pendingTip);
  },
  coachHear: () => {
    const c = st.coach, a = st.coachAI[c.id];
    voice.setMuted(false);
    voice.speak(a?.message ? `${a.title}. ${a.message} ${a.question}` : [c.lead, c.body, c.analogy, st.ai[c.id]?.text].filter(Boolean).join(' '));
    render();
  },
  coachAI: async () => {
    const c = st.coach;
    st.ai[c.id] = { loading: true }; render();
    const out = await api('explain', { card: 'sim:' + c.concept, profile: safeProfile(), lang: lang() });
    st.ai[c.id] = out?.text && !out.fallback ? { text: out.text } : { note: t('aiFail') };
    if (st.coach?.id === c.id) render();
  },
  panel: () => { st.panel = !st.panel; st.anim = st.panel ? 'panel' : null; render(); },
  sug: (i) => { st.ask.q = t('askSug')[+i]; askNow(); },
  ask: () => { st.ask.q = $app.querySelector('#askq')?.value || ''; askNow(); },
  replay: () => { location.reload(); },
  copyPilot: () => { navigator.clipboard?.writeText(JSON.stringify(pilotRecord())); toast(t('copied')); },
};

function resetGateIfChecked() {
  const g = st.sheet?.gate;
  if (g?.result) { const fresh = newGate(g.side); fresh.text = g.text; fresh.chip = g.chip; st.sheet.gate = fresh; }
}
function stopListening() {
  if (listener) { listener.stop(); listener = null; }
  if (st.sheet?.gate) st.sheet.gate.listening = false;
}

function speakQ(force) {
  const q = QUESTIONS[st.qi];
  if (!force && voice.isMuted()) return;
  voice.speak(L(q.q), `q_${q.id}`);
}

async function askNow() {
  const q = st.ask.q.trim();
  if (!q) return;
  if (isAdviceRequest(q)) { st.ask = { q, a: L(REFUSAL), src: 'rule', loading: false }; render(); return; }
  st.ask = { q, a: '', src: '', loading: true }; render();
  const out = await api('ask', gameBody({ q, app: 'sim', code: st.screen === 'stock' ? st.code : undefined }));
  st.ask = { q, a: out?.answer || t('aiFail'), src: out?.source || '', provider: out?.provider, loading: false };
  render();
}

async function openReport() {
  st.report = { analysis: analyse(st.book, st.M, st.day, st.profile), ai: null, loading: true };
  go('report');
  const out = await api('report', gameBody(), 45000);
  st.report.loading = false;
  if (out?.ai) { st.report.ai = out.ai; st.report.provider = out.provider; }
  if (st.screen === 'report') render();
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  A[el.dataset.a]?.(el.dataset.v, el);
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'qtext') { st.answers.name = setPlayerName(e.target.value); return; }
  if (e.target.id === 'alertval' && st.sheet?.mode === 'alert') { st.sheet.value = parseFloat(e.target.value) || 0; const h = $app.querySelector('#alerthint'); if (h) h.outerHTML = alertHint(); return; }
  if (onGateInput(e, st.sheet?.gate)) return;
  if (e.target.id === 'search') { st.search = e.target.value; st.focusSearch = true; render(); st.focusSearch = false; }
  if (e.target.id === 'qtyin' && st.sheet) {
    const s = st.sheet, p = px(st.M, s.code, st.day);
    const max = s.side === 'buy' ? Math.floor((st.book.cash * s.lev) / p) : st.book.pos[s.code]?.qty || 0;
    s.qty = Math.max(0, Math.min(max, parseInt(e.target.value || '0', 10) || 0));
    const out = $app.querySelector('.sheet-sum');
    if (out) out.outerHTML = sheetSummary();
  }
});
document.addEventListener('change', (e) => { if (e.target.id === 'qtyin' && st.sheet) { resetGateIfChecked(); render(); } });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'askq') A.ask();
  if ((e.key === 'Enter' || e.keyCode === 13) && e.target.id === 'qtext') { e.preventDefault(); A.qnext(); }
});

// ── Screens ──────────────────────────────────────────────────
const themeBtn = (cls = 'icon-btn') => `<button class="${cls}" data-a="theme" aria-label="${t('theme')}">${themeIcon()}</button>`;
const aiPill = () => (st.aiOk == null ? '' : `<span class="aipill ${st.aiOk ? 'on' : ''}">${st.aiOk ? t('aiOn') : t('aiOff')}</span>`);

const SCREENS = {
  lang: () => `
    <main class="onb lang-screen">
      <div class="corner">${themeBtn()}</div>
      <div class="brandmark">${LOGO}</div>
      <h1>निवेश सेतु <span>NiveshSetu Market</span></h1>
      <p class="muted">नकली पैसे, असली सबक · Pretend money, real lessons</p>
      <h2>अपनी भाषा चुनें<br><small>Choose your language · तुमची भाषा निवडा</small></h2>
      <div class="langs">${LANGS.map((l) => `<button class="langcard" data-a="lang" data-v="${l.id}"><b>${l.label}</b><span>${l.sub}</span></button>`).join('')}</div>
      <p class="fine">कोई लॉग-इन नहीं · No login · 🔒</p>
    </main>`,

  q: () => {
    const q = QUESTIONS[st.qi];
    const val = st.answers[q.id];
    const sel = (v) => (q.type === 'multi' ? (val || []).includes(v) : val === v);
    return `
    <main class="onb">
      <div class="qtop">
        <button class="ghost-btn" data-a="qback">← ${t('back')}</button>
        <span class="muted">${t('qOf', { n: st.qi + 1, t: QUESTIONS.length })}</span>
        <span class="hb">${themeBtn()} <button class="icon-btn" data-a="hearQ" aria-label="listen">🔊</button></span>
      </div>
      <div class="qbar"><i style="width:${((st.qi + 1) / QUESTIONS.length) * 100}%"></i></div>
      <h2 class="qtext">${esc(L(q.q))}</h2>
      ${q.hint ? `<p class="muted">${esc(L(q.hint))}</p>` : ''}
      ${q.type === 'text' ? `
        <input id="qtext" class="qinput" enterkeyhint="next" value="${esc(st.answers.name ?? getPlayerName())}" placeholder="${esc(L(q.placeholder))}" maxlength="24" autocomplete="off">
      ` : `<div class="opts">${q.options.map(([v, label]) => `
        <button class="opt ${sel(v) ? 'on' : ''}" data-a="opt" data-v="${v}">
          <span class="tick">${q.type === 'multi' ? (sel(v) ? '✓' : '') : sel(v) ? '●' : ''}</span>${esc(L(label))}</button>`).join('')}</div>`}
      ${q.why ? `<details class="why"><summary>${t('why')}</summary><p>${esc(L(q.why))}</p></details>` : ''}
      <div class="qnav">
        ${q.type === 'text' ? `<button class="btn ghost" data-a="qskip">${t('skip')}</button>` : ''}
        ${q.type !== 'single' ? `<button class="btn primary" data-a="qnext" ${q.type === 'multi' && !(val || []).length ? 'disabled' : ''}>${t('next')} →</button>` : ''}
      </div>
      <p class="fine center">${t('privacy')}</p>
    </main>`;
  },

  setup: () => {
    const p = st.profile;
    const nm = p.name ? (lang() === 'hi' ? `${p.name} जी, ` : `${p.name}, `) : '';
    const items = [
      t('pLevel_' + p.level), t('pDomain_' + p.domain), t('pCash', { cash: inr(p.startCash) }),
      p.voiceAuto ? t('pVoice') : t('pRead'), p.allowLeverage ? t('pLev') : t('pNoLev'), t('pTip'), t('pGate'),
    ];
    return `
    <main class="onb">
      <div class="brandmark sm">${LOGO}</div>
      <h2>${esc(cap(t('madeForYou', { name: nm })))}</h2>
      <ul class="setup">${items.map((x) => `<li><span>✓</span>${esc(x)}</li>`).join('')}</ul>
      <p class="note">${t('pFair')}</p>
      <button class="btn primary big" data-a="start">${t('start')} →</button>
    </main>`;
  },

  app: () => `
    ${topBar()}
    <nav class="tabs">${['explore', 'watchlist', 'portfolio', 'orders'].map((x) => `<button class="${st.tab === x ? 'on' : ''}" data-a="tab" data-v="${x}">${t(x)}${x === 'watchlist' && Object.keys(st.watch).length ? ` (${Object.keys(st.watch).length})` : ''}</button>`).join('')}</nav>
    <main class="page">${st.tab === 'explore' ? explore() : st.tab === 'watchlist' ? watchlist() : st.tab === 'portfolio' ? portfolio() : ordersList()}</main>
    ${dayBar()}`,

  stock: () => stockPage(),
  report: () => report(),
};

function topBar() {
  const p = st.profile;
  return `<header class="top">
    <div class="avatar">${p.name ? esc(p.name[0].toUpperCase()) : '₹'}</div>
    <label class="searchbox">🔍<input id="search" value="${esc(st.search)}" placeholder="${t('search')}" autocomplete="off"></label>
    ${aiPill()}
    <button class="icon-btn bell" data-a="alertsPanel" aria-label="${at('alerts')}">🔔${activeAlerts() ? `<i>${activeAlerts()}</i>` : ''}</button>
    ${themeBtn()}
    <button class="icon-btn" data-a="mute" aria-label="sound">${voice.isMuted() ? '🔇' : '🔊'}</button>
  </header>`;
}

function dayBar() {
  const last = st.day >= SEASON_DAYS;
  return `<footer class="daybar">
    <div><b>${t('day', { d: st.day, t: SEASON_DAYS })}</b> <span class="simpill">${t('sim')}</span><div class="dayprog"><i style="width:${(st.day / SEASON_DAYS) * 100}%"></i></div></div>
    <button class="coachfab" data-a="panel" aria-label="${t('coach')}">💬 ${t('coach')}</button>
    <button class="btn primary" data-a="next">${last ? t('endSeason') : t('nextDay') + ' ▶'}</button>
  </footer>`;
}

function stockRow(s, extra = '') {
  const q = quote(st.M, s.code, st.day);
  return `<button class="row" data-a="open" data-v="${s.code}">
    <span class="logo" style="--c:${s.color}">${initials(s.name)}</span>
    <span class="rname"><b>${st.watch[s.code] != null ? '★ ' : ''}${esc(s.name)}</b><small>${extra || esc(L(s.sector))}</small></span>
    ${spark(history(st.M, s.code, st.day, 10))}
    <span class="rpx"><b>${fmtP(q.price)}</b><small class="${pctCls(q.pct)}">${signed(q.pct)}%</small></span>
  </button>`;
}

function explore() {
  const term = st.search.trim().toLowerCase();
  const list = STOCKS.filter((s) => !term || s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term) || L(s.sector).toLowerCase().includes(term));
  const sorted = [...STOCKS].map((s) => ({ s, q: quote(st.M, s.code, st.day) })).sort((a, b) => b.q.pct - a.q.pct);
  const tile = ({ s, q }) => `<button class="tile" data-a="open" data-v="${s.code}">
      <span class="logo" style="--c:${s.color}">${initials(s.name)}</span>
      <b>${esc(s.name.replace(' Ltd', ''))}</b>
      <span>${fmtP(q.price)}</span><small class="${pctCls(q.pct)}">${signed(q.pct)}%</small></button>`;
  const news = NEWS[st.day] || [];
  if (term) return `<section class="sec"><h3>${t('allStocks')}</h3><div class="list">${list.map((s) => stockRow(s)).join('') || '—'}</div></section>`;
  return `
  <div class="greet"><div class="gtxt"><b id="greet"></b><small>${t('greetSub')}</small></div>${tipBtn('explore')}</div>
  <section class="sec">
    <h3>${t('indices')}</h3>
    <div class="idx">${INDICES.map((ix) => { const q = indexQuote(st.M, ix.id, st.day); return `<div class="idxcard"><small>${ix.name}</small><b>${q.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</b><span class="${pctCls(q.pct)}">${signed(q.chg)} (${signed(q.pct)}%)</span></div>`; }).join('')}</div>
  </section>
  ${news.length ? `<section class="sec"><h3>${t('todayNews')}</h3>${news.map((n) => `<button class="newsitem" ${n.stock ? `data-a="open" data-v="${n.stock}"` : ''}><span class="nday">${t('day', { d: st.day, t: SEASON_DAYS })}</span>${esc(L(n))}${n.stock ? ' ›' : ''}</button>`).join('')}</section>` : ''}
  <section class="sec"><h3>${t('gainers')}</h3><div class="tiles">${sorted.slice(0, 4).map(tile).join('')}</div></section>
  <section class="sec"><h3>${t('losers')}</h3><div class="tiles">${sorted.slice(-4).reverse().map(tile).join('')}</div></section>
  <section class="sec"><h3>${t('allStocks')}</h3><div class="list">${list.map((s) => stockRow(s)).join('')}</div></section>`;
}

function watchlist() {
  const codes = Object.keys(st.watch);
  if (!codes.length) return `<p class="empty">☆<br>${t('emptyWatch')}</p>`;
  return `<section class="sec"><div class="list">${codes.map((c) => {
    const since = st.watch[c], chg = ((px(st.M, c, st.day) - px(st.M, c, since)) / px(st.M, c, since)) * 100;
    return stockRow(stockOf(c), `${t('watchSince', { d: since })} · ${t('since')} <span class="${pctCls(chg)}">${signed(chg)}%</span>`);
  }).join('')}</div></section>`;
}

function portfolio() {
  const T = totals(st.book, st.M, st.day);
  const H = holdings(st.book, st.M, st.day).sort((a, b) => b.value - a.value);
  return `
  <div class="tabhead"><h3>${t('portfolio')}</h3>${tipBtn('portfolio')}</div>
  <section class="pfcard">
    <small>${t('netWorth')}</small>
    <div class="big">${inr(T.net)}</div>
    <span class="${pctCls(T.netPct)}">${signedInr(T.net - st.book.start)} (${signed(T.netPct)}%)</span>
    <div class="pfgrid">
      <div><small>${t('invested')}</small><b>${inr(T.cost)}</b></div>
      <div><small>${t('current')}</small><b>${inr(T.value)}</b></div>
      <div><small>${t('totalPnl')}</small><b class="${pctCls(T.pnl)}">${signedInr(T.pnl)}</b></div>
      <div><small>${t('dayPnl')}</small><b class="${pctCls(T.dayChg)}">${signedInr(T.dayChg)}</b></div>
      <div><small>${t('cashLeft')}</small><b>${inr(T.cash)}</b></div>
      ${T.loan > 0 ? `<div><small>${t('loan')}</small><b class="dn">${inr(T.loan)}</b></div>` : ''}
    </div>
  </section>
  <section class="sec">
    ${H.length ? `<div class="list">${H.map((h) => { const s = stockOf(h.code); return `<button class="row" data-a="open" data-v="${h.code}">
      <span class="logo" style="--c:${s.color}">${initials(s.name)}</span>
      <span class="rname"><b>${esc(s.name)} ${h.lev > 1 ? '<em class="tag">MTF</em>' : ''}</b><small>${h.qty} ${t('shares')} · ${t('avg')} ${fmtP(h.avg)}</small></span>
      <span class="rpx"><b class="${pctCls(h.pnl)}">${signedInr(h.pnl)}</b><small class="${pctCls(h.pnl)}">${signed(h.pnlPct)}%</small></span></button>`; }).join('')}</div>` : `<p class="empty">${t('emptyPf')}</p>`}
  </section>`;
}

function verdictTag(o) {
  const v = o.gate?.verdict;
  if (!v || v === 'skipped') return '';
  const cls = v === 'sound' ? 'ok' : v === 'partly' ? 'mid' : '';
  return ` <em class="tag ${cls}">${o.gate.score}${o.gate.overridden ? ' ⚠' : ''}</em>`;
}

function ordersList() {
  const O = [...st.book.orders].reverse();
  const head = `<div class="tabhead"><h3>${t('orders')}</h3>${tipBtn('orders')}</div>`;
  if (!O.length) return head + `<p class="empty">${t('emptyOrders')}</p>`;
  return head + `<div class="list">${O.map((o) => { const s = stockOf(o.code); return `<div class="row static">
    <span class="side ${o.side}">${o.side === 'buy' ? t('buy') : t('sell')}</span>
    <span class="rname"><b>${esc(s.name)}${o.lev > 1 ? ' <em class="tag">MTF</em>' : ''}${o.ato ? ` <em class="tag">${at('tagAto')}</em>` : ''}${verdictTag(o)}</b><small>${t('day', { d: o.day, t: SEASON_DAYS })} · ${o.qty} × ${fmtP(o.price)}</small><small class="reason">“${esc(o.forced ? t('forced') : o.reasonText || '')}”</small></span>
    <span class="rpx"><b>${inr(o.qty * o.price)}</b>${o.pnl != null ? `<small class="${pctCls(o.pnl)}">${signedInr(o.pnl)}</small>` : ''}</span></div>`; }).join('')}</div>`;
}

function stockPage() {
  const s = stockOf(st.code), q = quote(st.M, s.code, st.day);
  const n = { '1W': 5, '1M': 20, '3M': PRE + st.day }[st.tf];
  const pts = history(st.M, s.code, st.day, n);
  const labels = pts.map((_, i) => { const d = st.day - (pts.length - 1 - i); return d >= 1 ? t('day', { d, t: SEASON_DAYS }) : (lang() === 'hi' ? `${1 - d} दिन पहले` : lang() === 'mr' ? `${1 - d} दिवसांपूर्वी` : `${1 - d}d before`); });
  const r3 = range(st.M, s.code, st.day, PRE + st.day);
  const pos = st.book.pos[s.code];
  const f = s.f;
  const bar = (lo, hi, v) => `<div class="rng"><div class="rbar"><i style="left:${Math.min(100, Math.max(0, ((v - lo) / (hi - lo || 1)) * 100))}%"></i></div><div class="rlab"><span>${fmtP(lo)}</span><span>${fmtP(hi)}</span></div></div>`;
  const myNews = Object.entries(NEWS).filter(([d]) => +d <= st.day).flatMap(([d, arr]) => arr.filter((x) => x.stock === s.code).map((x) => ({ d: +d, x }))).reverse();
  const growth = (((f.sales[2] - f.sales[0]) / f.sales[0]) * 100).toFixed(0);
  const watched = st.watch[s.code] != null;
  return `
  <header class="top sp">
    <button class="icon-btn" data-a="back" aria-label="back">←</button>
    <span class="simpill">${t('sim')}</span>
    <span class="hb">${themeBtn()} <button class="icon-btn" data-a="mute">${voice.isMuted() ? '🔇' : '🔊'}</button></span>
  </header>
  <main class="page stockpage">
    <div class="shead"><span class="logo lg" style="--c:${s.color}">${initials(s.name)}</span>
      <div><h1>${esc(s.name)}</h1><small class="muted">${s.code} · ${esc(L(s.sector))} · ${t('fictional')}</small></div>
      <span class="hb"><button class="icon-btn" data-a="alertNew" aria-label="${at('setAlert')}">🔔</button><button class="icon-btn star ${watched ? 'on' : ''}" data-a="star" aria-label="${t('watchlist')}">${watched ? '★' : '☆'}</button></span></div>
    <div class="sprice">${fmtP(q.price)}</div>
    <div class="${pctCls(q.pct)} schg">${signed(q.chg)} (${signed(q.pct)}%) <span class="muted">1D</span></div>
    ${areaChart(pts, { labels })}
    <div class="tfs">${['1W', '1M', '3M'].map((x) => `<button class="${st.tf === x ? 'on' : ''}" data-a="tf" data-v="${x}">${x}</button>`).join('')}</div>
    ${pos ? `<div class="holdcard"><small>${t('yourHolding')}${pos.lev > 1 ? ' · MTF' : ''}</small><b>${pos.qty} ${t('shares')} · ${t('avg')} ${fmtP(pos.avg)}</b>
      <span class="${pctCls(q.price - pos.avg)}">${signedInr(pos.qty * (q.price - pos.avg))}</span></div>` : ''}
    <nav class="tabs sub">${['overview', 'news'].map((x) => `<button class="${st.stockTab === x ? 'on' : ''}" data-a="stab" data-v="${x}">${t(x)}</button>`).join('')}</nav>
    ${st.stockTab === 'overview' ? `
      <section class="sec"><h3>${t('performance')}</h3>
        <div class="rl"><small>${t('todayLow')}</small><small>${t('todayHigh')}</small></div>${bar(q.low, q.high, q.price)}
        <div class="rl"><small>${t('low3m')}</small><small>${t('high3m')}</small></div>${bar(r3.lo, r3.hi, q.price)}
        <div class="kv small"><span>${at('avg20', { v: fmtP(sma(st.M, s.code, st.day)) })}</span><span>${at('volNow', { v: (volume(st.M, s.code, st.day) / avgVolume(st.M, s.code, st.day)).toFixed(1) })}</span></div>
        <button class="btn alertbtn" data-a="alertNew">${at('setAlert')}</button>
      </section>
      <section class="sec"><h3>${t('fundamentals')} <small class="muted">${t('tapInfo')}</small></h3>
        <div class="fgrid">
          <button data-a="info" data-v="mcap"><small>${t('mcap')} ⓘ</small><b>${inr(f.mcap)} ${t('crore')}</b></button>
          <button data-a="info" data-v="pe"><small>${t('pe')} ⓘ</small><b>${f.pe ?? t('na')}</b></button>
          <button data-a="info" data-v="sales"><small>${t('sales')} ⓘ</small><b class="${growth >= 0 ? 'up' : 'dn'}">${growth >= 0 ? '▲' : '▼'} ${Math.abs(growth)}%</b></button>
          <button data-a="info" data-v="sales"><small>${t('profit')} ⓘ</small><b class="${f.profit === 'up' ? 'up' : 'dn'}">${t('profit_' + f.profit)}</b></button>
          <button data-a="info" data-v="debt"><small>${t('debt')} ⓘ</small><b class="${f.debt === 'high' ? 'dn' : f.debt === 'low' ? 'up' : ''}">${t('debt_' + f.debt)}</b></button>
          <button data-a="info" data-v="volatility"><small>Beta ⓘ</small><b>${s.beta.toFixed(1)}</b></button>
        </div>
        <div class="salesbars">${f.sales.map((v, i) => `<div><i style="height:${(v / Math.max(...f.sales)) * 56}px"></i><small>${['FY24', 'FY25', 'FY26'][i]}</small><small>${inr(v)}</small></div>`).join('')}</div>
      </section>
      <section class="sec"><h3>${t('about')}</h3><p class="about">${esc(L(s.about))}</p></section>
      ${companyFlags(s.code, st.day).length ? `<section class="sec">${thingsToKnow(companyFlags(s.code, st.day))}</section>` : ''}
    ` : `<section class="sec">${myNews.length ? myNews.map(({ d, x }) => `<div class="newsitem"><span class="nday">${t('day', { d, t: SEASON_DAYS })}</span>${esc(L(x))}</div>`).join('') : `<p class="empty">${t('noNews')}</p>`}</section>`}
  </main>
  <footer class="tradebar">
    ${pos ? `<button class="btn sellb" data-a="sheet" data-v="sell">${t('sell')}</button>` : ''}
    <button class="btn buyb" data-a="sheet" data-v="buy">${t('buy')}</button>
  </footer>`;
}

// ── Alerts: checked the moment a new day opens ──
const activeAlerts = () => st.alerts.filter((a) => a.status === 'active').length;
async function notifyPhone(title, body) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: 'icon.svg', tag: 'ns-alert-' + Date.now() });
    else new Notification(title, { body });
  } catch {}
}
function runAlerts() {
  const fired = evaluate(st.alerts, st.M, st.day);
  if (!fired.length) return;
  for (const a of fired) {
    a.msg = describe(a);
    if (a.ato) {
      const { side, qty, meta } = a.ato;
      const out = side === 'buy' ? buy(st.book, st.M, st.day, a.code, qty, 1, meta)
        : sell(st.book, st.M, st.day, a.code, Math.min(qty, st.book.pos[a.code]?.qty || 0), meta);
      if (out.error) { a.status = 'failed'; a.result = at('popFail', { why: at({ cash: 'why_cash', none: 'why_none', qty: 'why_none', mix: 'why_mix' }[out.error] || 'why_cash') }); }
      else { const o = st.book.orders.at(-1); a.result = at('popAto', { side: at(side === 'buy' ? 'buyW' : 'sellW'), q: o.qty, p: fmtP(o.price) }); }
    }
    notifyPhone(`${at('popTitle')} · ${at('practice')}`, [a.msg, a.result].filter(Boolean).join(' — '));
  }
  st.alertPop = fired;
  render();
  if (st.profile.voiceAuto && !st.coach) voice.speak(fired.map((a) => [a.msg, a.result].filter(Boolean).join('. ')).join('. '));
}
function alertHint() {
  const s = st.sheet;
  const met = isMet({ code: s.code, cond: s.cond, value: s.value }, st.M, st.day);
  return `<p id="alerthint" class="qtyhint">${met ? '⚠️ ' + at('alreadyTrue') : ''}</p>`;
}
function alertSheet() {
  const s = st.sheet, stx = stockOf(s.code), p = px(st.M, s.code, st.day), held = st.book.pos[s.code];
  const c = condOf(s.cond);
  const groups = ['price', 'change', 'volume', 'tech'];
  const ato = s.kind === 'ato';
  const ready = (!c.needs || s.value > 0) && (!ato || (s.qty > 0 && decided(s.gate)));
  const label = !ato ? at('save') : s.qty <= 0 ? at('needQty') : !decided(s.gate) ? at('needReason') : at('saveAto');
  return `<div class="scrim ${st.anim === 'sheet' ? 'anim' : ''}" data-a="close"></div>
    <section class="sheet ${st.anim === 'sheet' ? 'anim' : ''}" role="dialog">
      <div class="grab"></div>
      <div class="sh-head"><b>${at('setAlert')} · ${esc(stx.name)}</b><button class="icon-btn" data-a="close">✕</button></div>
      <p class="muted small">${at('intro')}</p>
      <h5 class="lbl">${at('when')}</h5>
      ${groups.map((g) => `<p class="glbl">${at('g_' + g)}</p><div class="chips">${CONDS.filter((x) => x.group === g).map((x) => `<button class="chip sm ${s.cond === x.id ? 'on' : ''}" data-a="alertCond" data-v="${x.id}">${at('c_' + x.id)}</button>`).join('')}</div>`).join('')}
      ${c.needs ? `<div class="qtyrow"><label>${at('c_' + s.cond)}</label><div class="stepper"><input id="alertval" inputmode="decimal" value="${s.value ?? ''}"><span class="unit">${at('u_' + c.needs)}</span></div></div>` : ''}
      <p class="muted small">${at('now', { v: fmtP(p) })} · ${at('avg20', { v: fmtP(sma(st.M, s.code, st.day)) })}</p>
      ${alertHint()}
      <h5 class="lbl">${at('type')}</h5>
      <div class="seg two">
        <button class="${!ato ? 'on' : ''}" data-a="alertKind" data-v="simple"><b>${at('simple')}</b><small>${at('simpleSub')}</small></button>
        <button class="${ato ? 'on' : ''}" data-a="alertKind" data-v="ato"><b>${at('ato')}</b><small>${at('atoSub')}</small></button>
      </div>
      ${ato ? `
        <div class="seg">
          <button class="${s.side === 'buy' ? 'on' : ''}" data-a="alertSide" data-v="buy">${at('atoBuy')}</button>
          <button class="${s.side === 'sell' ? 'on' : ''}" data-a="alertSide" data-v="sell" ${held ? '' : 'disabled'}>${at('atoSell')}</button>
        </div>
        <p class="levwarn">ℹ️ ${at('atoNote')}</p>
        <div class="qtyrow"><label>${t('qty')}</label>
          <div class="stepper"><button data-a="qty" data-v="-1">−</button><input id="qtyin" inputmode="numeric" value="${s.qty}"><button data-a="qty" data-v="1">+</button></div></div>
        ${s.side === 'sell'
          ? `<div class="qtychips">${['quarter', 'half', 'all'].map((x) => `<button class="chip" data-a="qty" data-v="${x}">${t('qty' + cap(x))}</button>`).join('')}</div>`
          : `<div class="chips">${['5', '10', '50'].map((x) => `<button class="chip" data-a="qty" data-v="${x}">+${x}</button>`).join('')}</div>`}
        ${s.side === 'buy' ? thingsToKnow(sheetFlags()) : ''}
        ${s.qty > 0 ? `<p class="gnote">${at('atoWhy')}</p>` + gateHTML(s.gate, { lang: lang(), chips: s.side === 'buy' ? BUY_REASONS : SELL_REASONS }) : ''}` : ''}
      ${'Notification' in window && Notification.permission !== 'granted' ? (Notification.permission === 'default' ? `<button class="btn ghost small" data-a="notifyPerm">🔔 ${at('notifyOn')}</button>` : `<p class="muted small">${at('notifyOff')}</p>`) : ''}
      <button class="btn big primary" data-a="alertSave" ${ready ? '' : 'disabled'}>${label}</button>
    </section>`;
}
function alertsPanel() {
  const list = [...st.alerts].reverse();
  const stat = { active: 'active', triggered: 'fired', cancelled: 'cancelled', failed: 'failed' };
  return `<div class="scrim ${st.anim === 'panel' ? 'anim' : ''}" data-a="alertsPanel"></div>
    <section class="sheet ${st.anim === 'panel' ? 'anim' : ''}" role="dialog">
      <div class="grab"></div>
      <div class="sh-head"><b>🔔 ${at('alerts')}</b><button class="icon-btn" data-a="alertsPanel">✕</button></div>
      ${list.length ? `<div class="list">${list.map((a) => `<div class="row static alertrow ${a.status}">
        <span class="rname"><b>${esc(describe(a))}${a.ato ? ` <em class="tag">${at('tagAto')}</em>` : ''}</b>
          <small>${a.ato ? `${at(a.ato.side === 'buy' ? 'atoBuy' : 'atoSell')} ${a.ato.qty} · ` : ''}${a.status === 'active' ? at('setOn', { d: a.createdDay }) : a.triggeredDay ? at('firedOn', { d: a.triggeredDay, p: fmtP(a.triggeredPrice) }) : ''}</small>
          ${a.result ? `<small>${esc(a.result)}</small>` : ''}</span>
        <span class="rpx"><small class="astat ${a.status}">${at(stat[a.status])}</small>${a.status === 'active' ? `<button class="chip sm" data-a="alertCancel" data-v="${a.id}">${at('cancel')}</button>` : ''}</span>
      </div>`).join('')}</div>` : `<p class="empty">${at('none')}</p>`}
    </section>`;
}
function alertPopHTML() {
  return `<div class="scrim anim" data-a="alertPopOk"></div>
    <section class="coachcard calm anim alertpop" role="alertdialog">
      <div class="ch"><span class="cbadge">${at('popTitle')}</span><small class="muted">${at('practice')}</small></div>
      ${st.alertPop.map((a) => `<div class="popitem ${a.status}"><b>${esc(a.msg)}</b>${a.result ? `<p>${esc(a.result)}</p>` : ''}</div>`).join('')}
      <div class="crow"><button class="btn primary" data-a="alertPopOk">${at('ok')}</button></div>
    </section>`;
}

// Share of all money in this company after the order (buy only).
function sheetWeight() {
  const s = st.sheet; if (!s || s.side !== 'buy' || s.qty <= 0) return 0;
  const T = totals(st.book, st.M, st.day), price = px(st.M, s.code, st.day);
  return ((st.book.pos[s.code]?.qty || 0) * price + s.qty * price) / (T.cash + T.value + (s.qty * price * (s.lev - 1)) / s.lev);
}
const sheetFlags = () => { const s = st.sheet; return orderFlags({ code: s.code, day: st.day, side: s.side, run5: changeOver(st.M, s.code, st.day, 5), weightAfter: sheetWeight(), lev: s.lev, tipSource: st.profile.tipSource }); };
function thingsToKnow(flags) {
  if (!flags.length) return '';
  return `<div class="flagbox"><h5>⚑ ${t('thingsToKnow')}</h5><ul>${flags.map((f) => `<li>${esc(L(f))}</li>`).join('')}</ul><small>${t('thingsNote')}</small></div>`;
}

function sheetSummary() {
  const s = st.sheet, p = px(st.M, s.code, st.day);
  const value = s.qty * p, pay = s.side === 'buy' ? value / s.lev : value;
  return `<div class="sheet-sum">
    <div><span>${t('orderValue')}</span><b>${inr(value, 2)}</b></div>
    ${s.side === 'buy' ? `<div><span>${t('youPay')}</span><b>${inr(pay, 2)}</b></div>` : ''}
    ${s.side === 'buy' && s.lev > 1 ? `<div class="dn"><span>${t('borrowed')}</span><b>${inr(value - pay, 2)}</b></div>` : ''}
    ${s.side === 'sell' && s.qty > 0 && st.book.pos[s.code] ? (() => { const pnl = s.qty * (p - st.book.pos[s.code].avg); return `<div class="${pctCls(pnl)}"><span>${t('locksIn')}</span><b>${signedInr(pnl)}</b></div>`; })() : ''}
    <div class="muted"><span>${t('available')}</span><span>${inr(st.book.cash, 2)}</span></div>
  </div>`;
}

function coachCard() {
  const c = st.coach, ai = st.ai[c.id], cai = st.coachAI[c.id];
  const aiDone = cai && cai.message;
  const fixed = `${c.lead ? `<p class="lead">${esc(c.lead)}</p>` : ''}<p>${esc(c.body)}</p>${c.analogy ? `<p class="analogy">${esc(c.analogy)}</p>` : ''}`;
  let body;
  if (aiDone) {
    body = `<div class="fadein"><p class="lead">${esc(cai.message)}</p><p class="askq">🤔 ${esc(cai.question)}</p>
      ${c.concept ? `<details class="learn"><summary>${t('learnMore', { t: esc(L(CONCEPTS[c.concept].title)) })}</summary>${fixed}</details>` : ''}
      <small class="ainote">${t('coachAi', { p: provName(cai.provider) })}</small></div>`;
  } else if (cai?.loading) {
    body = `${fixed}<p class="muted small"><span class="dots">${t('personalising')}</span></p>`;
  } else body = fixed + (cai?.failed ? `<small class="offnote">${t('coachOffline')}${DEV && cai.why ? ` · AI note unavailable: ${esc(cai.why)}` : ''}</small>` : '');
  return `<div class="scrim ${st.anim === 'coach' ? 'anim' : ''}" data-a="coachOk"></div>
    <section class="coachcard ${c.tone} ${st.anim === 'coach' ? 'anim' : ''}" role="dialog">
      <div class="ch"><span class="cbadge">💬 ${t('coach')}</span></div>
      <h3>${esc(aiDone ? cai.title : c.title)}</h3>
      ${c.quote ? `<div class="quote"><small>${esc(c.quote.from)}</small><p>${esc(c.quote.text)}</p></div>` : ''}
      ${body}
      ${ai?.loading ? `<p class="aiout"><span class="dots">${t('thinking')}</span></p>` : ai?.text ? `<p class="aiout">${esc(ai.text)}</p><small class="ainote">${t('aiNote')}</small>` : ai?.note ? `<small class="muted">${esc(ai.note)}</small>` : ''}
      <div class="crow">
        <button class="btn" data-a="coachHear">${t('listen')}</button>
        ${c.concept ? `<button class="btn" data-a="coachAI" ${ai?.loading ? 'disabled' : ''}>${t('explainMe')}</button>` : ''}
        <button class="btn primary" data-a="coachOk">${t('ok')}</button>
      </div>
    </section>`;
}

function overlays() {
  let h = '';
  if (st.alertsPanel && !st.sheet) h += alertsPanel();
  if (st.alertPop.length && !st.coach && !st.sheet) h += alertPopHTML();
  if (st.tip && !st.coach && !st.sheet && !st.alertPop.length) h += tipHTML({ title: t('tipT_' + st.tip), text: t('tip_' + st.tip), ok: t('gotIt') });
  if (st.sheet?.mode === 'alert') h += alertSheet();
  else if (st.sheet) {
    const s = st.sheet, stx = stockOf(s.code), p = px(st.M, s.code, st.day);
    const held = st.book.pos[s.code];
    const g = s.gate;
    const afford = s.side === 'sell' || (s.qty * p) / s.lev <= st.book.cash + 0.01;
    const ok = s.qty > 0 && afford && decided(g);
    const amount = inr(s.side === 'buy' ? (s.qty * p) / s.lev : s.qty * p);
    const label = s.qty <= 0 ? t(s.side === 'sell' ? 'chooseQty' : 'chooseQtyBuy') : !decided(g) ? t('needReason') : `${s.side === 'buy' ? t('buy') : t('sell')} ${amount}`;
    h += `<div class="scrim ${st.anim === 'sheet' ? 'anim' : ''}" data-a="close"></div>
    <section class="sheet ${s.side} ${st.anim === 'sheet' ? 'anim' : ''}" role="dialog">
      <div class="grab"></div>
      <div class="sh-head"><b>${s.side === 'buy' ? t('buy') : t('sell')} · ${esc(stx.name)}</b><button class="icon-btn" data-a="close">✕</button></div>
      ${s.side === 'buy' && st.profile.allowLeverage ? `<div class="seg">
        <button class="${s.lev === 1 ? 'on' : ''}" data-a="lev" data-v="1" ${held ? 'disabled' : ''}>${t('delivery')}</button>
        <button class="${s.lev === 4 ? 'on' : ''}" data-a="lev" data-v="4" ${held ? 'disabled' : ''}>${t('mtf')}</button></div>
        ${s.lev > 1 ? `<p class="levwarn">⚠️ ${t('levWarn')} · ${t('interest')}</p>` : ''}` : ''}
      <div class="qtyrow"><label>${t('qty')}</label>
        <div class="stepper"><button data-a="qty" data-v="-1">−</button><input id="qtyin" inputmode="numeric" value="${s.qty}"><button data-a="qty" data-v="1">+</button></div></div>
      ${s.side === 'sell'
        ? `<div class="qtychips">${['quarter', 'half', 'all'].map((x) => `<button class="chip" data-a="qty" data-v="${x}">${t('qty' + cap(x))}</button>`).join('')}</div>`
        : `<div class="chips">${['5', '10', '50'].map((x) => `<button class="chip" data-a="qty" data-v="${x}">+${x}</button>`).join('')}<button class="chip" data-a="qty" data-v="max">${t('max')}</button></div>`}
      <div class="kv"><span>${t('marketPrice')}</span><b>${fmtP(p)}</b></div>
      ${sheetSummary()}
      ${s.side === 'buy' ? thingsToKnow(sheetFlags()) : ''}
      ${s.qty > 0 ? gateHTML(g, { lang: lang(), chips: s.side === 'buy' ? BUY_REASONS : SELL_REASONS }) : `<p class="qtyhint">${t(s.side === 'sell' ? 'chooseQty' : 'chooseQtyBuy')}</p>`}
      <button class="btn big ${s.side === 'buy' ? 'buyb' : 'sellb'}" data-a="place" ${ok ? '' : 'disabled'}>${label}</button>
    </section>`;
  }
  if (st.coach) h += coachCard();
  if (st.panel) {
    const a = st.ask;
    h += `<div class="scrim ${st.anim === 'panel' ? 'anim' : ''}" data-a="panel"></div>
    <section class="sheet ${st.anim === 'panel' ? 'anim' : ''}" role="dialog">
      <div class="grab"></div>
      <div class="sh-head"><b>💬 ${t('coach')} · ${t('ask')}</b><button class="icon-btn" data-a="panel">✕</button></div>
      <div class="chips">${t('askSug').map((x, i) => `<button class="chip" data-a="sug" data-v="${i}">${esc(x)}</button>`).join('')}</div>
      <div class="askrow"><input id="askq" value="${esc(a.q)}" placeholder="${t('askPh')}" autocomplete="off"><button class="btn primary" data-a="ask">➤</button></div>
      ${a.loading ? `<p class="aiout"><span class="dots">${t('thinking')}</span></p>` : a.a ? `<p class="aiout">${esc(a.a)}</p><small class="ainote">${a.src === 'rule' ? t('ruleNote') : a.src === 'ai' ? t('aiNote') : ''}</small>` : ''}
      <h4>${t('lessons')}</h4>
      <div class="chips">${['research', 'diversify', 'volatility', 'pe', 'debt', 'crash'].concat(st.profile.allowLeverage ? ['leverage'] : []).map((c) => `<button class="chip" data-a="info" data-v="${c}">${esc(L(CONCEPTS[c].title))}</button>`).join('')}</div>
    </section>`;
  }
  if (st.toast && !st.coach && !st.panel && !st.sheet && !st.alertPop.length && !st.alertsPanel && (st.screen === 'app' || st.screen === 'stock')) h += `<div class="toast">${esc(st.toast)}</div>`;
  return h;
}

// ── Report ───────────────────────────────────────────────────
function pilotRecord() {
  const a = st.report?.analysis || analyse(st.book, st.M, st.day, st.profile);
  const p = st.profile;
  return { lang: p.lang, edu: p.answers.edu, work: p.answers.work, sources: p.answers.sources, done: p.answers.done, goal: p.goal, stated: p.stated, actual: a.actual,
    final_pct: +a.pct.toFixed(1), trades: a.trades, resilience: a.overall, habits: Object.fromEntries(a.items.map((i) => [i.id, { value: i.value, score: i.score }])) };
}

function habitValue(i) {
  if (i.id === 'leverage') return t('v_leverage_' + i.value);
  return t('v_' + i.id, { v: i.value });
}
function habitFallback(i) {
  const d = { ...i.detail, v: i.value };
  if (i.id === 'concentration' && !d.stock) d.stock = '—';
  return { insight: t('f_' + i.id, d), tip: i.band === 'good' ? t('t_good') : t('t_' + i.id) };
}

// ── Flags → lessons (static, no AI) ──
let lessonSizes = {};
fetch('../shared/lessons.sizes.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).then((j) => { lessonSizes = j || {}; }).catch(() => {});

// The holding's outcome for a stock: realised P&L from its sells + what is still held now.
function stockOutcome(code) {
  const sold = st.book.orders.filter((o) => o.code === code && o.side === 'sell').reduce((a, o) => a + (o.pnl || 0), 0);
  const pos = st.book.pos[code];
  return sold + (pos ? pos.qty * (px(st.M, code, st.day) - pos.avg) : 0);
}
// Lessons for flags that were shown before a buy and the player went ahead anyway — win or lose.
function flagLessons() {
  const buys = st.book.orders.filter((o) => o.side === 'buy' && !o.forced && o.proceeded && o.flagsSeen?.length);
  const ids = pickFlagLessons(buys.flatMap((o) => o.flagsSeen), 3);
  return ids.map((id) => {
    const withFlag = buys.filter((o) => o.flagsSeen.includes(id));
    const codes = [...new Set(withFlag.map((o) => o.code))];
    const outcome = codes.reduce((a, c) => a + stockOutcome(c), 0);
    const cause = outcome < 0 && codes.some((c) => CAUSE_FLAG[c]?.flag === id && withFlag.some((o) => o.code === c && o.day < CAUSE_FLAG[c].day));
    return { id, codes, outcome, cause };
  });
}
function lessonCard({ id, codes, outcome, cause }) {
  const top = `${codes.map((c) => esc(stockOf(c).name)).join(', ')} · ${outcome >= 0 ? t('gainLabel') : t('lossLabel')}`;
  return lessonHTML(id, { t, L, esc, lang: lang(), sizes: lessonSizes, top, cause });
}
// "Next time" rules without AI: the tip categories the reasoning check gave on this player's orders.
function fallbackRules() {
  const types = [...new Set(st.book.orders.map((o) => o.gate?.tipType).filter(Boolean))].slice(0, 3);
  return types.map((tt) => L(TIP_TEXT[tt]));
}

function report() {
  const R = st.report, a = R.analysis, ai = R.ai;
  const p = st.profile;
  const nm = p.name ? (lang() === 'hi' ? `${p.name} जी, ` : `${p.name}, `) : '';
  const statedLabel = L(QUESTIONS.find((q) => q.id === 'react').options.find(([v]) => v === p.stated)[1]);
  const calmActs = ['wait', 'partial', 'buy'], fearActs = ['sell', 'partial_fear'];
  const matched = (p.stated === 'sell' && fearActs.includes(a.actual)) || (p.stated === 'wait' && ['wait', 'partial'].includes(a.actual)) || (p.stated === 'buy' && a.actual === 'buy');
  const verdict = a.actual === 'none' ? '' : matched ? t('match')
    : ['sell', 'unsure'].includes(p.stated) && calmActs.includes(a.actual) ? t('calmer')
    : fearActs.includes(a.actual) ? t('fearWon') : t('mismatch');
  const maxBar = Math.max(a.final, a.start, a.equalSplit);
  const bars = [[t('cmpYou'), a.final, 'you'], [t('cmpCash'), a.start, ''], [t('cmpEqual'), a.equalSplit, '']];
  const ringC = a.overallBand === 'good' ? 'var(--up)' : a.overallBand === 'ok' ? 'var(--warn)' : 'var(--down)';
  const icon = { good: '✓', ok: '~', poor: '!' };
  const sk = R.loading ? '<div class="skel w80"></div><div class="skel w60"></div>' : '';
  return `
  <header class="top sp"><span class="brandtxt">${LOGO} ${t('appName')}</span><span class="hb">${themeBtn()} <button class="icon-btn" data-a="mute">${voice.isMuted() ? '🔇' : '🔊'}</button></span></header>
  <main class="page report">
    <h2>${esc(cap(t('reportTitle', { name: nm })))}</h2>
    <section class="scorecard">
      ${a.overall != null ? `<div class="ring" style="--p:${a.overall};--c:${ringC}"><span>${a.overall}<small>/100</small></span></div>` : ''}
      <div><small class="muted">${t('scoreTitle')}</small>
        ${ai ? `<h3>${esc(ai.headline)}</h3><p>${esc(ai.summary)}</p>` : R.loading ? `<p class="muted"><span class="dots">${t('analysing')}</span></p>${sk}` : `<h3>${a.overall == null ? '' : t('band_' + a.overallBand)}</h3>${a.buys === 0 ? `<p>${t('noBuys')}</p>` : ''}`}
      </div>
    </section>
    <section class="pfcard">
      <small>${t('endValue')}</small><div class="big">${inr(a.final)}</div>
      <span class="${pctCls(a.pct)}">${signedInr(a.final - a.start)} (${signed(a.pct)}%)</span>
      <small class="muted">${t('startedWith', { cash: inr(a.start) })}</small>
    </section>
    <section class="sec"><h3>${t('compare')}</h3>
      ${bars.map(([lab, v, cls]) => `<div class="cmprow ${cls}"><span>${esc(lab)}</span><div class="cbar"><i style="width:${(v / maxBar) * 100}%"></i></div><b>${inr(v)}</b></div>`).join('')}
    </section>
    <section class="sec saidvsdid ${matched || verdict === t('calmer') ? 'good' : 'warn'}"><h3>${t('saidVsDid')}</h3>
      <div class="svd"><div><small>${t('youSaid')}</small><b>“${esc(statedLabel)}”</b></div><div><small>${t('youDid')}</small><b>${t('did_' + a.actual)}</b></div></div>
      ${ai?.saidVsDid ? `<p>${esc(ai.saidVsDid)}</p>` : verdict ? `<p>${verdict}</p>` : ''}
    </section>
    <section class="sec"><h3>${t('habits')}</h3>
      <div class="habits">${a.items.map((i) => {
        const txt = ai?.habits?.[i.id] || (R.loading ? null : habitFallback(i));
        return `<div class="habit ${i.band}">
          <div class="hh"><span>${icon[i.band]}</span><p>${t('m_' + i.id)}</p><b>${esc(habitValue(i))}</b></div>
          <div class="hm"><div class="meter ${i.band}"><i style="width:${Math.max(3, i.score)}%"></i></div><span>${i.score}/100 · ${t('band_' + i.band)}</span></div>
          ${txt ? `<p class="ins">${esc(txt.insight)}</p><p class="tip">${t('tipLabel')}: ${esc(txt.tip)}</p>` : sk}
          <details><summary>${t('howMeasured')}</summary>${t('r_' + i.id)}</details>
        </div>`;
      }).join('')}</div>
      ${!R.loading ? `<p class="${ai ? 'ainote' : 'offnote'}">${ai ? t('aiReport', { p: provName(R.provider) }) : t('offReport')}</p>` : ''}
    </section>
    <p class="goalline">${esc(goalLine(p))}</p>
    ${(() => { const ls = flagLessons(); return ls.length ? `<section class="sec"><h3>${t('flagsTitle')}</h3><p class="muted small">${t('flagsIntro')}</p><p class="small">${t('flagWhere')}</p>${ls.map(lessonCard).join('')}</section>` : ''; })()}
    ${(() => { const rules = ai?.nextTime?.length ? ai.nextTime : R.loading ? [] : fallbackRules(); return rules.length ? `<section class="sec"><h3>${t('nextTime')}</h3><ol class="rules">${rules.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>` : ''; })()}
    <section class="setucard"><h3>${t('setuCard')}</h3><ol>${t('setuQs').map((x) => `<li>${esc(x)}</li>`).join('')}</ol><p class="rule">${t('setuRule')}</p></section>
    <button class="btn primary big" data-a="replay">${t('playAgain')}</button>
    <p class="fine center">${t('localOnly')}</p>
    ${PILOT ? `<section class="sec pilot"><h3>${t('pilot')}</h3><pre>${esc(JSON.stringify(pilotRecord(), null, 1))}</pre><button class="btn" data-a="copyPilot">${t('copy')}</button></section>` : ''}
  </main>`;
}

// ── Boot ─────────────────────────────────────────────────────
initTheme();
voice.initVoice();
render();
health().then((h) => { st.aiOk = !!h?.ok; if (st.screen !== 'lang' && st.screen !== 'q') render(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((r) => r.update()).catch(() => {});
window.__sim = { st, A, analyse: () => analyse(st.book, st.M, st.day, st.profile) };
