// POST /api/explain { card, level: 'basic'|'mid'|'fin', domain, lang: 'hi'|'en' }
//   card = 'pump' | 'flag:<id>' (Telegram demo) | 'sim:<concept>' (simulator)
// The AI re-explains a FIXED fact card for this reader. The client can never send its own facts.
import { FACT_CARDS, FLAGS } from '../public/demo-run/content.js';
import { CONCEPTS, ANALOGIES } from '../public/simulator/data.js';
import { think, hasBrain, whyOf } from '../lib/ai.js';
import { checkExplain, rateLimited, baseRules } from '../lib/safety.js';
import { pickLang, cleanProfile, profileLine } from '../lib/facts.js';

const OLD = { 8: 'basic', 12: 'mid', grad: 'fin' };

function lookup(card, lang, level, domain) {
  if (card === 'pump') return { facts: pickLang(FACT_CARDS.pump.facts, lang), fallback: pickLang(FACT_CARDS.pump.cached[level], lang) };
  if (card?.startsWith('flag:')) {
    const f = FLAGS[card.slice(5)];
    if (!f) return null;
    const an = pickLang(f.analogies?.[domain], lang) || pickLang(f.analogy, lang) || '';
    return { facts: `${pickLang(f.title, lang)}. ${pickLang(f.explain, lang)} ${an}`.trim(), fallback: `${pickLang(f.explain, lang)} ${an}`.trim() };
  }
  if (card?.startsWith('sim:')) {
    const c = CONCEPTS[card.slice(4)];
    if (!c) return null;
    const an = pickLang(ANALOGIES[card.slice(4)]?.[domain], lang) || '';
    return { facts: `${pickLang(c.title, lang)}. ${pickLang(c.basic, lang)} ${pickLang(c.term, lang)} ${pickLang(c.fin, lang)}`, fallback: `${level === 'fin' ? pickLang(c.fin, lang) : pickLang(c.basic, lang)} ${an}`.trim() };
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (rateLimited(req)) return res.status(429).json({ error: 'slow down' });
  const b = req.body || {};
  const p = cleanProfile({ ...b.profile, lang: b.lang ?? b.profile?.lang, level: OLD[b.level] || b.level || b.profile?.level, domain: b.domain || b.profile?.domain });
  const c = lookup(b.card, p.lang, p.level, p.domain);
  if (!c) return res.status(400).json({ error: 'unknown card' });
  const safe = { text: c.fallback, fallback: true };
  if (!hasBrain()) return res.status(200).json({ ...safe, reason: 'no_key' });

  const system = [
    'You are the teacher inside NiveshSetu, an app that helps first-time investors in India avoid costly mistakes.',
    'Re-explain the FACTS for this one reader, in 3 to 5 short sentences. Start directly, no greeting.',
    'Give one everyday comparison from their own life. Do not add any new number, date or claim.',
    profileLine(p),
    ...baseRules(p.lang),
  ].join('\n');
  try {
    var t0 = Date.now();
    const { text, provider } = await think({ system, user: `FACTS:\n${c.facts}`, temperature: 0.4, maxTokens: 600 });
    const problem = checkExplain(text, c.facts);
    if (problem) { console.error(`[explain] fallback (validation:${problem})`); return res.status(200).json({ ...safe, reason: problem, ok: false, source: 'fallback', why: 'validation:' + problem, ms: Date.now() - t0 }); }
    return res.status(200).json({ text, fallback: false, provider, ok: true, source: 'ai', ms: Date.now() - t0 });
  } catch (e) {
    console.error('[explain]', whyOf(e), e.message);
    return res.status(200).json({ ...safe, reason: 'ai_error', ok: false, source: 'fallback', why: whyOf(e) });
  }
}
