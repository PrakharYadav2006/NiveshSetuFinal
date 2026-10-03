// POST /api/debrief — personal debrief for the Telegram tip demo.
// Body: { profile, stage: 'run1'|'run2'|'final', runs: { 1: {...}, 2: {...} }, recovery }
//   run = { decision: 'buy'|'skip', amount, reasonText, verdict, score, hits: [flagId], missed: [flagId], falseAlarms: [id], checks: [] }
// → { title, message, missed: [{ id, why }], question, nextTime: [] , source: 'ai' } | { fallback: true }
import { thinkJSON, hasBrain, whyOf } from '../lib/ai.js';
import { checkFields, rateLimited, baseRules } from '../lib/safety.js';
import { cleanProfile, profileLine, demoFacts } from '../lib/facts.js';
import { FLAGS, DISTRACTORS } from '../public/demo-run/content.js';

const ids = (a, ok) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string' && ok[x]).slice(0, 10) : []);
function cleanRun(r = {}) {
  return {
    decision: r.decision === 'buy' ? 'buy' : 'skip',
    amount: [5000, 20000, 50000, 100000].includes(+r.amount) ? +r.amount : 0,
    reasonText: String(r.reasonText || '').slice(0, 300),
    verdict: ['sound', 'partly', 'weak', 'advice'].includes(r.verdict) ? r.verdict : null,
    score: Number.isFinite(+r.score) ? Math.max(0, Math.min(100, Math.round(+r.score))) : null,
    hits: ids(r.hits, FLAGS), missed: ids(r.missed, FLAGS), falseAlarms: ids(r.falseAlarms, DISTRACTORS),
    checks: Array.isArray(r.checks) ? r.checks.filter((c) => ['who', 'sebi', 'fall'].includes(c)) : [],
  };
}
const runLine = (n, r) => `RUN ${n}: the player ${r.decision === 'buy' ? `BOUGHT with ₹${r.amount} of pretend money${r.reasonText ? `, reason: "${r.reasonText}"` : ''}${r.verdict ? ` (reasoning check: ${r.verdict}, ${r.score}/100)` : ''}` : 'did NOT buy'}. Opened the "check first" questions: ${r.checks.join(', ') || 'none'}. Red flags they spotted: ${r.hits.map((f) => FLAGS[f].title.en).join('; ') || 'none'}. Red flags they MISSED: ${r.missed.map((f) => `${f} = ${FLAGS[f].title.en}`).join('; ') || 'none'}. Things they wrongly marked as red flags: ${r.falseAlarms.map((d) => DISTRACTORS[d].title.en).join('; ') || 'none'}.`;

export default async function handler(req, res) {
  const t0 = Date.now();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (rateLimited(req, 30)) return res.status(429).json({ error: 'slow down' });
  const b = req.body || {};
  const stage = ['run1', 'run2', 'final'].includes(b.stage) ? b.stage : 'run1';
  if (!hasBrain()) return res.status(200).json({ fallback: true, reason: 'no_key', ok: false, source: 'fallback', why: 'no_key' });
  const p = cleanProfile(b.profile);
  const r1 = cleanRun(b.runs?.[1]), r2 = cleanRun(b.runs?.[2]);
  const facts = [
    profileLine(p),
    stage === 'run2' ? demoFacts(2, r2.amount || 20000) : demoFacts(1, r1.amount || 20000),
    stage === 'run1' ? 'OUTCOME: after the tip the price went from ₹42 up to ₹48.5, then fell to ₹23.9 in 9 days (about 43% down). Lower circuits meant buyers could not sell. The group was deleted.' : '',
    stage === 'run2' ? 'OUTCOME: whoever followed the instructions was asked to send screenshots and then install a fake "VIP app" where profits look real but money can never be withdrawn ("pay 20% tax first").' : '',
    runLine(1, r1), stage !== 'run1' ? runLine(2, r2) : '',
    stage === 'final' ? `RECOVERY SCAM: a fake "SEBI recovery cell" asked for a ₹4,999 fee. The player ${b.recovery === 'pay' ? 'PAID' : b.recovery === 'refuse' ? 'refused and reported it' : 'did not decide'}.` : '',
  ].filter(Boolean).join('\n');
  const missedIds = stage === 'run2' ? r2.missed : r1.missed;
  const system = [
    'You are the coach inside NiveshSetu, which helps first-time investors in India recognise stock-tip scams. This is a scripted practice with pretend money; every name in it is fictional.',
    stage === 'final'
      ? 'Write a short personal closing note: how this player changed from the first message to the second (use their actual choices), and 3 short personal rules for next time.'
      : 'Write a short personal debrief of what THIS player just did: respond to their own reason if they gave one, name what they did well, and explain at most 3 of the red flags they MISSED in a way that fits their life (one everyday comparison from their work).',
    'Be warm, direct and specific. Never shame. Never tell them to buy or sell anything real.',
    ...baseRules(p.lang),
    stage === 'final'
      ? 'Return JSON: {"title":"max 7 words","message":"2-3 sentences","nextTime":["","",""]}'
      : `Return JSON: {"title":"max 7 words","message":"2-3 sentences","missed":[{"id":"one of: ${missedIds.join(', ') || '(none)'}","why":"1-2 sentences"}],"question":"one reflective question"}`,
  ].join('\n');
  try {
    const { data, provider } = await thinkJSON({ system, user: `FACTS:\n${facts}`, temperature: 0.5, maxTokens: 900 }, (x) => {
      if (!x.title || !x.message) return 'missing field';
      if (stage === 'final' && (!Array.isArray(x.nextTime) || x.nextTime.length < 2)) return 'missing nextTime';
      if (stage !== 'final') x.missed = (Array.isArray(x.missed) ? x.missed : []).filter((m) => missedIds.includes(m?.id) && m.why).slice(0, 3);
      return checkFields({ t: x.title, m: x.message, q: x.question || '', w: (x.missed || []).map((m) => m.why), n: x.nextTime || [] }, facts, { maxLen: 500 });
    });
    return res.status(200).json({ title: data.title, message: data.message, question: data.question || '', missed: data.missed || [], nextTime: (data.nextTime || []).slice(0, 3), source: 'ai', provider, ok: true, ms: Date.now() - t0 });
  } catch (e) {
    console.error('[debrief]', whyOf(e), e.message);
    return res.status(200).json({ fallback: true, reason: 'ai_error', ok: false, source: 'fallback', why: whyOf(e), ms: Date.now() - t0 });
  }
}
