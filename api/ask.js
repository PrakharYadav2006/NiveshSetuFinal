// POST /api/ask { q, profile, app: 'sim'|'demo', day?, orders?, code? }
// Free questions. Grounded in curated facts + (simulator) the player's own game state.
import { KB as DEMO_KB, REFUSAL as DEMO_REFUSAL } from '../public/demo-run/content.js';
import { KB as SIM_KB, REFUSAL as SIM_REFUSAL } from '../public/simulator/data.js';
import { think, hasBrain, whyOf } from '../lib/ai.js';
import { isAdviceRequest, checkAnswer, rateLimited, baseRules } from '../lib/safety.js';
import { cleanProfile, pickLang, profileLine, simState, portfolioFacts, stockFacts } from '../lib/facts.js';

const UNKNOWN = {
  hi: 'इसका पक्का जवाब मेरे पास नहीं है। SEBI की वेबसाइट देखें या किसी SEBI-रजिस्टर्ड सलाहकार से पूछें। धोखाधड़ी में पैसा गया हो तो तुरंत 1930 पर कॉल करें।',
  en: "I don't have a reliable answer to that. Check SEBI's website or ask a SEBI-registered adviser. If you lost money to fraud, call 1930 right away.", mr: 'याचं पक्कं उत्तर माझ्याकडे नाही. SEBI ची वेबसाइट पाहा किंवा SEBI-रजिस्टर्ड सल्लागाराला विचारा. फसवणुकीत पैसे गेले असतील तर लगेच 1930 वर कॉल करा.',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (rateLimited(req)) return res.status(429).json({ error: 'slow down' });
  const b = req.body || {};
  const q = String(b.q || '').slice(0, 300).trim();
  const p = cleanProfile({ ...b.profile, lang: b.lang ?? b.profile?.lang, level: b.level || b.profile?.level });
  const sim = b.app === 'sim';
  const refusal = pickLang(sim ? SIM_REFUSAL : DEMO_REFUSAL, p.lang);
  const kb = (sim ? SIM_KB : DEMO_KB)[p.lang] || (sim ? SIM_KB : DEMO_KB).en; // Marathi answers are written from the English facts
  if (!q) return res.status(400).json({ error: 'empty' });

  // Layer 1: deterministic refusal. Advice questions never reach the model.
  if (isAdviceRequest(q)) return res.status(200).json({ answer: refusal, source: 'rule' });
  if (!hasBrain()) return res.status(200).json({ answer: UNKNOWN[p.lang], source: 'none' });

  let game = '';
  if (sim && Array.isArray(b.orders)) {
    const st = simState({ profile: p, orders: b.orders, day: b.day });
    game = portfolioFacts(st.book, st.d) + (b.code ? '\n' + stockFacts(b.code, st.d) : '');
  }
  const system = [
    'You are the assistant inside NiveshSetu, which helps first-time investors in India learn without losing real money.',
    'Answer using the VERIFIED FACTS and, if given, the GAME STATE (the player\'s own pretend portfolio). You may explain what happened in their game and why.',
    'VERIFIED FACTS:', ...kb.map((k, i) => `${i + 1}. ${k}`),
    game ? 'GAME STATE:\n' + game : '',
    `If the question asks whether to buy, sell or hold anything, about a company's future, or for a price prediction, reply only: "${refusal}"`,
    `If the answer is not in the facts or game state, reply only: "${UNKNOWN[p.lang]}"`,
    'At most 4 short sentences.',
    profileLine(p),
    ...baseRules(p.lang),
  ].filter(Boolean).join('\n');

  try {
    var t0 = Date.now();
    const { text, provider } = await think({ system, user: q, temperature: 0.3, maxTokens: 600 });
    if (checkAnswer(text)) return res.status(200).json({ answer: refusal, source: 'rule' }); // layer 3
    return res.status(200).json({ answer: text, source: 'ai', provider, ok: true, ms: Date.now() - t0 });
  } catch (e) {
    console.error('[ask]', whyOf(e), e.message);
    return res.status(200).json({ answer: UNKNOWN[p.lang], source: 'none', ok: false, why: whyOf(e) });
  }
}
