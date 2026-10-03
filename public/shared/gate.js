// The reasoning check before an order (used by the simulator and the Telegram demo).
// The player writes or speaks WHY. The AI judges the reasoning (never the stock) and asks at most
// ONE follow-up question. Then a verdict card shows: strength, what is right, what is missing,
// one tip for next time, and what the order means for them. Then the order button unlocks.
// A weak reason is still allowed, and noted in their report.
import { api } from './listen.js';
import { offlineEvaluate } from './reasoning.js';

const S = {
  title_buy: { hi: 'खरीदने से पहले: आप क्यों खरीद रहे हैं?', en: 'Before you buy: why are you buying?', mr: 'घेण्याआधी: तुम्ही का घेत आहात?' },
  title_sell: { hi: 'बेचने से पहले: आप क्यों बेच रहे हैं?', en: 'Before you sell: why are you selling?', mr: 'विकण्याआधी: तुम्ही का विकत आहात?' },
  hint: { hi: 'अपने शब्दों में लिखें या 🎤 दबाकर बोलें। AI आपकी सोच परखता है, कंपनी नहीं। सलाह नहीं देता।', en: 'Write in your own words or tap 🎤 to speak. The AI checks your thinking, not the company. It never gives advice.', mr: 'तुमच्या शब्दांत लिहा किंवा 🎤 दाबून बोला. AI तुमचा विचार तपासतो, कंपनी नाही. सल्ला देत नाही.' },
  ph_buy: { hi: 'जैसे: बिक्री 3 साल से बढ़ रही है, कर्ज़ कम है, और मैं अपने पैसे का छोटा हिस्सा लगा रहा हूँ…', en: 'e.g. Sales have grown for 3 years, debt is low, and I am putting in only a small part of my money…', mr: 'उदा.: विक्री 3 वर्षांपासून वाढतेय, कर्ज कमी आहे, आणि मी माझ्या पैशांचा छोटा भाग लावतोय…' },
  ph_sell: { hi: 'जैसे: कंपनी का कर्ज़ बढ़ गया है / मुझे पैसों की ज़रूरत है…', en: 'e.g. The company’s debt has gone up / I need the money…', mr: 'उदा.: कंपनीचं कर्ज वाढलं आहे / मला पैशांची गरज आहे…' },
  starters: { hi: 'शुरुआत के लिए छुएँ:', en: 'Tap to start with:', mr: 'सुरुवातीसाठी दाबा:' },
  check: { hi: 'मेरा कारण जाँचें', en: 'Check my reason', mr: 'माझं कारण तपासा' },
  checking: { hi: 'AI आपका कारण पढ़ रहा है', en: 'The AI is reading your reason', mr: 'AI तुमचं कारण वाचत आहे' },
  reply: { hi: 'जवाब भेजें', en: 'Send answer', mr: 'उत्तर पाठवा' },
  answerPh: { hi: 'अपना जवाब लिखें या बोलें…', en: 'Type or speak your answer…', mr: 'तुमचं उत्तर लिहा किंवा बोला…' },
  v_sound: { hi: 'सोच-समझकर लिया फ़ैसला', en: 'Well thought through', mr: 'विचारपूर्वक घेतलेला निर्णय' },
  v_partly: { hi: 'आधा सोचा हुआ', en: 'Partly thought through', mr: 'अर्धवट विचार केलेला' },
  v_weak: { hi: 'कमज़ोर कारण', en: 'Weak reason', mr: 'कमकुवत कारण' },
  v_advice: { hi: 'यह सलाह माँगना है, कारण नहीं', en: 'That asks for advice; it is not a reason', mr: 'हे सल्ला मागणं आहे, कारण नाही' },
  src_ai: { hi: '✨ {p} AI · सिर्फ़ खेल के तथ्यों से', en: '✨ {p} AI · from the game’s facts only', mr: '✨ {p} AI · फक्त खेळातल्या माहितीवरून' },
  src_offline: { hi: 'ऑफ़लाइन जाँच (AI से अभी नहीं जुड़ पाए)', en: 'Offline check (could not reach the AI)', mr: 'ऑफलाइन तपासणी (AI शी आत्ता जोडता आलं नाही)' },
  src_rule: { hi: '🛡️ नियम: हम खरीदने-बेचने की सलाह नहीं देते', en: '🛡️ Rule: we never advise buying or selling', mr: '🛡️ नियम: आम्ही घेण्या-विकण्याचा सल्ला देत नाही' },
  more: { hi: 'जवाब दें, फिर आप ऑर्डर दे सकेंगे', en: 'Answer it, then you can place the order', mr: 'उत्तर द्या, मग तुम्ही ऑर्डर देऊ शकाल' },
  over: { hi: 'फ़ैसला आपका है। यह आपकी रिपोर्ट में दर्ज होगा।', en: 'The decision is yours. This will be noted in your report.', mr: 'निर्णय तुमचा आहे. हे तुमच्या रिपोर्टमध्ये नोंदवलं जाईल.' },
  means: { hi: '📌 इसका आपके लिए मतलब', en: '📌 What this means for you', mr: '📌 याचा तुमच्यासाठी अर्थ' },
  c_buy: { hi: 'आप {v} लगा रहे हैं। भाव आधा हुआ तो {h} का नुकसान होगा{w}।', en: 'You are putting in {v}. If the price halves, you lose {h}{w}.', mr: 'तुम्ही {v} लावत आहात. भाव निम्मा झाला तर {h} चा तोटा होईल{w}.' },
  c_w: { hi: ' — यह आपके पैसे का {p}% है, एक ही कंपनी में', en: ' — {p}% of your money sits in this one company', mr: ' — हे तुमच्या पैशांच्या {p}% आहे, एकाच कंपनीत' },
  c_lev: { hi: ' उधार (MTF) पर सिर्फ़ 25% गिरावट से आपका अपना {o} पूरा ख़त्म, और रोज़ ब्याज अलग।', en: ' On MTF, just a 25% fall wipes out your own {o}, plus daily interest.', mr: ' उधारीवर (MTF) फक्त 25% घसरणीत तुमचे स्वतःचे {o} पूर्ण संपतील, आणि रोजचं व्याज वेगळं.' },
  c_sell: { hi: 'बेचने के बाद यह नफ़ा या नुकसान पक्का हो जाएगा, और भाव बाद में सँभला तो उसका फ़ायदा आपको नहीं मिलेगा।', en: 'Once you sell, this gain or loss becomes final, and if the price recovers later you will not get that back.', mr: 'विकल्यानंतर हा नफा किंवा तोटा पक्का होईल, आणि भाव नंतर सावरला तर त्याचा फायदा तुम्हाला मिळणार नाही.' },
  okGo: { hi: 'अब आप ऑर्डर दे सकते हैं। फ़ैसला आपका है।', en: 'You can place the order now. The decision is yours.', mr: 'आता तुम्ही ऑर्डर देऊ शकता. निर्णय तुमचा आहे.' },
  listening: { hi: 'बोलिए… फिर ⏹ दबाइए', en: 'Speak… then tap ⏹', mr: 'बोला… मग ⏹ दाबा' },
  you: { hi: 'आप', en: 'You', mr: 'तुम्ही' },
  b_strong: { hi: 'मज़बूत कारण', en: 'Strong reason', mr: 'मजबूत कारण' },
  b_okay: { hi: 'ठीक-ठाक कारण', en: 'Okay reason', mr: 'बरं कारण' },
  b_weak: { hi: 'कमज़ोर कारण', en: 'Weak reason', mr: 'कमकुवत कारण' },
  r_right: { hi: 'क्या सही है', en: 'What is right', mr: 'काय बरोबर आहे' },
  r_wrong: { hi: 'क्या छूटा या ग़लत है', en: 'What is missing or wrong', mr: 'काय राहिलं किंवा चुकलं आहे' },
  r_tip: { hi: 'अगली बार के लिए एक टिप', en: 'One tip for next time', mr: 'पुढच्या वेळेसाठी एक टिप' },
  aiAsks: { hi: 'AI का एक सवाल', en: 'One question from the AI', mr: 'AI चा एक प्रश्न' },
};
// The badge comes from the verdict by a fixed rule; the AI never chooses its text.
export const BADGE = { sound: 'strong', partly: 'okay', weak: 'weak', advice: 'weak' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tx = (k, lang, v = {}) => { let s = S[k][lang] || S[k].hi; for (const [a, b] of Object.entries(v)) s = s.replace(`{${a}}`, b); return s; };

export function newGate(side) {
  return { side, text: '', chip: null, thread: [], answer: '', result: null, rounds: 0, maxFollowUps: 1, status: 'edit', listening: false, provider: null, ctx: {} };
}
export const decided = (g) => !!g.result && (g.result.verdict === 'sound' || g.rounds > g.maxFollowUps || !g.result.question);
export const overriding = (g) => decided(g) && g.result.verdict !== 'sound';

// body: the app-specific payload for /api/reason (+ ctx for the offline check)
export async function runCheck(g, body, lang) {
  if (g.status === 'result' && g.result?.question && g.answer.trim()) { g.thread.push({ q: g.result.question, a: g.answer.trim() }); g.answer = ''; }
  g.status = 'checking';
  g.ctx = body.ctx || {};
  const res = await api('reason', { ...body, side: g.side, text: g.text, thread: g.thread, round: g.rounds, maxRounds: g.maxFollowUps });
  g.result = res && res.verdict ? res : offlineEvaluate({ text: g.text, thread: g.thread, lang, side: g.side, ctx: body.ctx || {} });
  if (g.rounds >= g.maxFollowUps) g.result.question = '';
  g.provider = g.result.provider || null;
  g.rounds++;
  g.status = 'result';
  return g;
}

export function record(g) {
  return {
    reason: g.chip || 'text',
    reasonText: [g.text, ...g.thread.map((t) => t.a)].filter(Boolean).join(' | ').slice(0, 300),
    gate: g.result ? { verdict: g.result.verdict === 'advice' ? 'weak' : g.result.verdict, score: g.result.score ?? 0, rounds: g.rounds, overridden: overriding(g), flags: g.result.flags || [], tipType: g.result.tip_type || null, flagsSeen: g.result.flagIds || [], source: g.result.source === 'ai' ? 'ai' : 'offline' } : { verdict: 'skipped', score: 0, rounds: 0, overridden: true, flags: [], tipType: null, flagsSeen: [], source: 'offline' },
  };
}

// Keep typed text across re-renders. Call from the app's 'input' listener.
export function onGateInput(e, g) {
  if (!g) return false;
  if (e.target.id === 'gate-text') { g.text = e.target.value; const b = document.getElementById('gate-check'); if (b) b.disabled = g.text.trim().length < 6; return true; }
  if (e.target.id === 'gate-ans') { g.answer = e.target.value; const b = document.getElementById('gate-reply'); if (b) b.disabled = g.answer.trim().length < 2; return true; }
  return false;
}

// chips: [[key, {hi,en}]] starter phrases. attrs: how the host app wires clicks.
export function gateHTML(g, { lang, a = 'data-a', v = 'data-v', chips = [] }) {
  const L = (o) => (typeof o === 'string' ? o : o[lang] || o.hi);
  const act = (name, val) => `${a}="${name}"${val != null ? ` ${v}="${esc(val)}"` : ''}`;
  const mic = `<button class="mic ${g.listening ? 'rec' : ''}" ${act('gateMic')} aria-label="mic">${g.listening ? '⏹' : '🎤'}</button>`;
  let h = `<section class="gate"><h4>${tx('title_' + g.side, lang)}</h4>`;

  if (!g.result && g.status !== 'checking') {
    h += `<p class="gnote">${tx('hint', lang)}</p>
      <textarea id="gate-text" maxlength="400" placeholder="${esc(tx('ph_' + g.side, lang))}">${esc(g.text)}</textarea>
      ${chips.length ? `<p class="gnote">${tx('starters', lang)}</p><div class="chips">${chips.map(([k, l]) => `<button class="chip sm ${g.chip === k ? 'on' : ''}" ${act('gateChip', k)}>${esc(L(l))}</button>`).join('')}</div>` : ''}
      ${g.listening ? `<p class="gnote">${tx('listening', lang)}</p>` : ''}
      <div class="gtools">${mic}<button id="gate-check" class="btn primary" ${act('gateCheck')} ${g.text.trim().length < 6 ? 'disabled' : ''}>${tx('check', lang)}</button></div>`;
    return h + '</section>';
  }

  // conversation so far
  h += `<div class="gthread"><div class="me">${esc(g.text)}</div>`;
  g.thread.forEach((t) => { h += `<div class="ai">${esc(t.q)}</div><div class="me">${esc(t.a)}</div>`; });
  if (g.status === 'checking') return h + `<div class="ai"><span class="dots">${tx('checking', lang)}</span></div></div></section>`;
  h += '</div>';

  const r = g.result;
  const left = g.maxFollowUps - g.rounds + 1;
  const final = r.verdict === 'sound' || !(left > 0 && r.question);
  if (!final) {
    // One question first; the verdict card comes after the answer.
    h += `<p class="gnote">${tx('aiAsks', lang)}</p><p class="askq">${esc(r.question)}</p>
      <textarea id="gate-ans" maxlength="300" placeholder="${esc(tx('answerPh', lang))}">${esc(g.answer)}</textarea>
      ${g.listening ? `<p class="gnote">${tx('listening', lang)}</p>` : ''}
      <div class="gtools">${mic}<button id="gate-reply" class="btn primary" ${act('gateCheck')} ${g.answer.trim().length < 2 ? 'disabled' : ''}>${tx('reply', lang)}</button></div>
      <p class="gnote">${tx('more', lang)}</p>`;
  } else {
    const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
    const c = g.ctx || {};
    let cons = r.consequence;
    if (!cons && g.side === 'sell') cons = tx('c_sell', lang);
    if (!cons && c.own) cons = tx('c_buy', lang, { v: inr(c.own), h: inr(c.value / 2), w: c.weightAfter > 0.25 ? tx('c_w', lang, { p: Math.round(c.weightAfter * 100) }) : '' }) + (c.lev > 1 ? tx('c_lev', lang, { o: inr(c.own) }) : '');
    const badge = BADGE[r.verdict] || 'okay';
    const row = (icon, label, text) => (text ? `<div class="vrow"><span>${icon}</span><div><b>${tx(label, lang)}</b>${esc(text)}</div></div>` : '');
    h += `<div class="vcard">
        <span class="badge ${badge}">${tx('b_' + badge, lang)}</span>
        ${row('✓', 'r_right', r.right ?? r.good)}
        ${row('✗', 'r_wrong', r.wrong ?? r.gap)}
        ${row('💡', 'r_tip', r.tip)}
        ${cons ? `<div class="vrow"><span>📌</span><div><b>${tx('means', lang).replace('📌 ', '')}</b>${esc(cons)}</div></div>` : ''}
      </div>
      <p class="gnote">${r.verdict === 'sound' ? '✓ ' + tx('okGo', lang) : tx('over', lang)}</p>`;
  }
  const src = r.source === 'ai' ? tx('src_ai', lang, { p: 'Sarvam' }) : r.source === 'rule' ? tx('src_rule', lang) : tx('src_offline', lang);
  return h + `<p class="${r.source === 'ai' ? 'ainote' : 'offnote'}">${src}</p></section>`;
}
