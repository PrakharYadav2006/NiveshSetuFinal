// POST /api/report — behaviour analysis with a personal insight and tip for every habit.
// Body: { profile, orders, day } → { analysis, ai: { headline, summary, saidVsDid, habits: {id: {insight, tip}}, nextTime: [] } | null }
// Scores come from the deterministic model (metrics.js). The AI only interprets them.
import { thinkJSON, hasBrain, whyOf } from '../lib/ai.js';
import { checkFields, rateLimited, baseRules } from '../lib/safety.js';
import { reportState, profileLine } from '../lib/facts.js';

export default async function handler(req, res) {
  const t0 = Date.now();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (rateLimited(req, 20)) return res.status(429).json({ error: 'slow down' });
  const { p, a, facts } = reportState(req.body || {});
  if (!hasBrain()) return res.status(200).json({ analysis: a, ai: null, ok: false, source: 'fallback', why: 'no_key', reason: 'no_key', ms: 0 });
  const ids = a.items.map((i) => i.id);
  const system = [
    'You are the behaviour analyst inside NiveshSetu, a stock-market practice app for first-time investors in India.',
    'The player finished a 20-day game with pretend money. FACTS has their habits, each with a score from fixed rules. Do NOT change or re-score anything; explain what the numbers say about THIS person and what to do differently.',
    'For every habit: "insight" = 1-2 sentences, specific to them, citing their own numbers or decisions (stock names, days, their reasons). "tip" = ONE concrete habit to practise next time (an action like "open the sales chart before every buy", "write your exit plan first"), never a stock pick.',
    'Praise genuinely good habits briefly; be honest and kind about poor ones. No generic advice.',
    '"saidVsDid" compares what they said before the game with what they did in the fall, in 1-2 sentences.',
    '"nextTime" = exactly 3 short personal rules for next time, most important first.',
    '"headline" = max 10 words that capture their style as an investor. "summary" = 2-3 sentences.',
    profileLine(p),
    ...baseRules(p.lang),
    `Return JSON: {"headline":"","summary":"","saidVsDid":"","habits":{${ids.map((id) => `"${id}":{"insight":"","tip":""}`).join(',')}},"nextTime":["","",""]}`,
  ].join('\n');
  try {
    const { data, provider } = await thinkJSON({ system, user: `FACTS:\n${facts}`, temperature: 0.4, maxTokens: 2200 }, (x) => {
      if (!x.headline || !x.summary || !x.habits || typeof x.habits !== 'object') return 'missing field';
      for (const id of ids) if (!x.habits[id]?.insight || !x.habits[id]?.tip) return 'missing habit ' + id;
      if (!Array.isArray(x.nextTime) || x.nextTime.length < 2) return 'missing nextTime';
      return checkFields({ h: x.headline, s: x.summary, v: x.saidVsDid, habits: ids.map((id) => x.habits[id]), n: x.nextTime }, facts, { maxLen: 500 });
    });
    const habits = Object.fromEntries(ids.map((id) => [id, { insight: String(data.habits[id].insight), tip: String(data.habits[id].tip) }]));
    return res.status(200).json({ analysis: a, ai: { headline: data.headline, summary: data.summary, saidVsDid: data.saidVsDid || '', habits, nextTime: data.nextTime.slice(0, 3).map(String) }, provider, ok: true, source: 'ai', ms: Date.now() - t0 });
  } catch (e) {
    const why = whyOf(e);
    console.error(`[report] fallback (${why}) ${Date.now() - t0}ms`, e.message);
    return res.status(200).json({ analysis: a, ai: null, ok: false, source: 'fallback', why, reason: 'ai_error', ms: Date.now() - t0 });
  }
}
