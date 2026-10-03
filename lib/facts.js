// Builds the FACTS block the AI is allowed to use. Everything is recomputed on the server
// from the fictional market + the player's own order list; the browser cannot inject numbers.
import { STOCKS, NEWS, INDICES, SEASON_DAYS } from '../public/simulator/data.js';
import { buildMarket, replay, totals, holdings, quote, changeOver, range, indexQuote, buy, px, PRE } from '../public/simulator/engine.js';
import { analyse, reportFacts } from '../public/simulator/metrics.js';
import { SCENARIO_1, SCENARIO_2, FLAGS } from '../public/demo-run/content.js';

let M = null;
const market = () => (M ||= buildMarket());
const r1 = (x) => Math.round(x * 10) / 10;
const rs = (x) => '₹' + Math.round(x);
const CASH_OK = [10000, 50000, 100000, 500000];

const DOMAIN = { farm: 'farming', shop: 'running a small shop', job: 'a salaried job and household budget', home: 'running a home', student: 'student life' };
const LEVEL = {
  basic: 'school education up to Class 12 or less: very short simple sentences, no jargon at all, one everyday example',
  mid: 'graduate or diploma, not finance: plain words, and if you use one market term explain it in brackets',
  fin: 'commerce/finance or professional: precise terms are fine, keep it tight',
};

// Supported languages: Hindi (default), English, Marathi.
export const langOf = (l) => (['en', 'mr'].includes(l) ? l : 'hi');
export const pickLang = (o, lang) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.hi);

// Only accept the fields we know; clamp everything.
export function cleanProfile(p = {}) {
  const pick = (v, ok, d) => (ok.includes(v) ? v : d);
  return {
    lang: langOf(p.lang),
    level: pick(p.level, ['basic', 'mid', 'fin'], 'mid'),
    domain: pick(p.domain, Object.keys(DOMAIN), 'shop'),
    work: String(p.work || '').slice(0, 20),
    goal: pick(p.goal, ['family', 'asset', 'old', 'fast', 'learn'], 'learn'),
    stated: pick(p.stated, ['sell', 'wait', 'buy', 'unsure'], 'unsure'),
    startCash: CASH_OK.includes(+p.startCash) ? +p.startCash : 50000,
    allowLeverage: !!p.allowLeverage,
    experienced: !!p.experienced,
    sources: Array.isArray(p.sources) ? p.sources.filter((s) => typeof s === 'string').slice(0, 6) : [],
    age: String(p.age || '').slice(0, 8),
  };
}

export function cleanOrders(orders) {
  if (!Array.isArray(orders)) return [];
  return orders.slice(0, 200).map((o) => ({
    day: +o.day | 0, side: o.side === 'sell' ? 'sell' : 'buy', code: String(o.code || ''), qty: Math.max(0, +o.qty | 0), lev: o.lev === 4 ? 4 : 1,
    forced: !!o.forced,
    reason: typeof o.reason === 'string' ? o.reason.slice(0, 20) : undefined,
    reasonText: typeof o.reasonText === 'string' ? o.reasonText.slice(0, 300) : undefined,
    thinkMs: Math.max(0, Math.min(3_600_000, +o.thinkMs || 0)),
    research: o.research && typeof o.research === 'object' ? { info: !!o.research.info, news: !!o.research.news, chart: !!o.research.chart, watched: !!o.research.watched } : undefined,
    gate: o.gate && typeof o.gate === 'object' ? {
      verdict: ['sound', 'partly', 'weak', 'advice', 'skipped'].includes(o.gate.verdict) ? o.gate.verdict : 'skipped',
      score: Math.max(0, Math.min(100, +o.gate.score || 0)), rounds: Math.min(5, +o.gate.rounds | 0), overridden: !!o.gate.overridden,
      flags: Array.isArray(o.gate.flags) ? o.gate.flags.filter((f) => typeof f === 'string').slice(0, 6) : [],
      source: o.gate.source === 'ai' ? 'ai' : 'offline',
      tipType: typeof o.gate.tipType === 'string' ? o.gate.tipType.slice(0, 30) : null,
    } : undefined,
    flagsSeen: Array.isArray(o.flagsSeen) ? o.flagsSeen.filter((f) => typeof f === 'string').slice(0, 12) : undefined,
    proceeded: o.proceeded === true || undefined,
  })).filter((o) => o.qty > 0); // a 0-share order is never replayed
}

export function profileLine(p) {
  return `PLAYER: reader level = ${LEVEL[p.level]}; works in ${DOMAIN[p.domain]}; goal: ${p.goal}; ${p.experienced ? 'has traded shares before' : 'new to shares'}; hears about stocks from: ${p.sources.join(', ') || 'nowhere'}. Use an everyday comparison from ${DOMAIN[p.domain]} when it helps.`;
}

export function stockFacts(code, day) {
  const s = STOCKS.find((x) => x.code === code);
  if (!s) return '';
  const Mk = market(), q = quote(Mk, code, day), r3 = range(Mk, code, day, PRE + day), f = s.f;
  const news = Object.entries(NEWS).filter(([d]) => +d <= day).flatMap(([d, arr]) => arr.filter((x) => x.stock === code).map((x) => `day ${d}: ${x.en}`));
  return [
    `STOCK ${s.name} (${code}), sector ${s.sector.en}. ${s.about.en}`,
    `Price today ₹${q.price} (${r1(q.pct)}% today). Change over 5 days: ${r1(changeOver(Mk, code, day, 5))}%. Over 20 days: ${r1(changeOver(Mk, code, day, 20))}%. 3-month low ₹${r3.lo}, high ₹${r3.hi}. Beta ${s.beta}.`,
    `Fundamentals: market cap ₹${f.mcap} crore${f.mcap < 5000 ? ' (small company)' : ''}; P/E ${f.pe ?? 'none because the company makes losses'}; sales ₹${f.sales[0]} cr (FY24), ₹${f.sales[1]} cr (FY25), ₹${f.sales[2]} cr (FY26) = ${r1(((f.sales[2] - f.sales[0]) / f.sales[0]) * 100)}% in 2 years; profit ${f.profit === 'loss' ? 'loss-making' : f.profit === 'up' ? 'growing' : 'falling'}; debt ${f.debt === 'bank' ? 'n/a (bank)' : f.debt}.`,
    news.length ? `News so far: ${news.join(' | ')}` : 'No company news so far.',
  ].join('\n');
}

export function portfolioFacts(book, day) {
  const Mk = market(), T = totals(book, Mk, day), H = holdings(book, Mk, day);
  const gross = T.cash + T.value;
  const lines = H.map((h) => `${STOCKS.find((s) => s.code === h.code)?.name || h.code}: ${h.qty} shares, avg ₹${r1(h.avg)}, now ₹${h.price}, worth ${rs(h.value)}, ${r1(h.pnlPct)}% P&L (${h.pnl >= 0 ? 'up' : 'down'} ${rs(Math.abs(h.pnl ?? (h.value - h.qty * h.avg)))}), ${gross ? Math.round((h.value / gross) * 100) : 0}% of money${h.lev > 1 ? ', bought with MTF 4x (loan ' + rs(h.loan) + ')' : ''}`);
  const ix = indexQuote(Mk, INDICES[0].id, day);
  return [
    `DAY ${day} of ${SEASON_DAYS}. SIM 50 index ${Math.round(ix.value)} (${r1(ix.pct)}% today). Market news today: ${(NEWS[day] || []).map((n) => n.en).join(' | ') || 'none'}.`,
    `PORTFOLIO: started ${rs(book.start)}; now worth ${rs(T.net)} (${r1(T.netPct)}%, ${T.net >= book.start ? 'up' : 'down'} ${rs(Math.abs(T.net - book.start))}); cash ${rs(T.cash)}; ${H.length ? 'holdings: ' + lines.join('; ') : 'no shares held'}.`,
    book.marginCalls.length ? `Margin calls so far: ${book.marginCalls.map((m) => `${m.code} on day ${m.day}, lost ${rs(m.lost)}`).join('; ')}.` : '',
  ].filter(Boolean).join('\n');
}

export function simState({ profile, orders, day }) {
  const p = cleanProfile(profile);
  const d = Math.max(1, Math.min(SEASON_DAYS, +day | 0));
  const book = replay(market(), p.startCash, cleanOrders(orders), d);
  return { p, d, book, M: market() };
}

// What this order would do to the portfolio (computed on a copy).
export function orderFacts({ book, d, code, side, qty, lev }) {
  const Mk = market();
  const s = STOCKS.find((x) => x.code === code);
  if (!s) return '';
  const price = px(Mk, code, d), value = qty * price;
  if (side === 'sell') {
    const pos = book.pos[code];
    if (!pos) return `ORDER: sell ${qty} ${s.name}, but no shares held.`;
    return `ORDER: SELL ${Math.min(qty, pos.qty)} of ${pos.qty} shares of ${s.name} at ₹${price} (bought at avg ₹${r1(pos.avg)}; ${r1(((price - pos.avg) / pos.avg) * 100)}% from cost). Proceeds ${rs(Math.min(qty, pos.qty) * price)}.`;
  }
  const copy = structuredClone(book);
  const res = buy(copy, Mk, d, code, qty, lev);
  if (res.error) return `ORDER: BUY ${qty} ${s.name} at ₹${price} — not possible (${res.error}).`;
  const T = totals(copy, Mk, d), w = (copy.pos[code].qty * price) / (T.cash + T.value);
  return `ORDER: BUY ${qty} shares of ${s.name} at ₹${price} = ${rs(value)}${lev > 1 ? `, using MTF 4x: own money ${rs(value / lev)}, borrowed ${rs(value - value / lev)}, interest 0.05% a day, a 25% fall wipes out the own money` : ''}. After this order ${Math.round(w * 100)}% of all the player's money would be in ${s.name}; cash left ${rs(T.cash)}. If the price halved, this order would lose ${rs(value / 2)}; a 25% fall would lose ${rs(value / 4)}.`;
}

export function reportState({ profile, orders, day }) {
  const { p, d, book, M: Mk } = simState({ profile, orders, day });
  const a = analyse(book, Mk, d, p);
  return { p, a, facts: reportFacts(a, { ...p, work: p.work }) };
}

// ── Telegram demo (scripted) ──
export function demoFacts(scenario, amount) {
  const S = +scenario === 2 ? SCENARIO_2 : SCENARIO_1;
  const st = S.stock;
  const msgs = S.chat.messages.filter((m) => m.text).map((m) => `${m.from.en}: ${m.text.en.replace(/\n+/g, ' ')}`);
  const amt = [5000, 10000, 20000, 50000, 100000, 500000].includes(+amount) ? +amount : 20000;
  return [
    `SCENARIO: a ${S.chat.style === 'tg' ? 'Telegram group' : 'WhatsApp group'} called "${S.chat.title.en}" (${S.chat.subtitle.en}). Messages: ${msgs.join(' || ')}`,
    `STOCK ${st.name} (${st.code}): price ₹${st.price} (${st.changeToday} today). Price over the last 30 days: ₹${st.history[0]} → ₹${st.history.at(-1)}. Yearly sales: ${st.sales.map((x) => `${x.y} ₹${x.v} crore`).join(', ')}. ${st.volumeNote.en}.`,
    `WHO SENT IT: ${S.check.who.en} SEBI: ${S.check.sebi.en}`,
    `The player is about to put ${rs(amt)} of pretend money in. If the price halves, ${rs(amt / 2)} would be left.`,
    `Red flags present: ${S.quiz.flags.map((f) => FLAGS[f].title.en).join('; ')}.`,
  ].join('\n');
}
