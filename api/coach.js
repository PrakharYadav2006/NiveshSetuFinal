// POST /api/coach — a personal coaching note when something happens in the game.
// Body: { event, profile, orders, day, code, extra }
// → { ok: true, source: 'ai', title, message, question, concept, ms } | { ok: false, source: 'fallback', fallback: true, why, ms }
// The coach looks at what THIS player actually did, in their portfolio, and asks them to think.
import { thinkJSON, hasBrain, whyOf } from '../lib/ai.js';
import { checkCoach, rateLimited, baseRules } from '../lib/safety.js';
import { simState, stockFacts, portfolioFacts, profileLine } from '../lib/facts.js';
import { TRENDING, QUESTIONS, CONCEPTS, COACH_EVENTS, STOCKS } from '../public/simulator/data.js';
import { changeOver } from '../public/simulator/engine.js';

const EVENTS = COACH_EVENTS;

function eventFacts(event, { p, d, book, M }, code, extra) {
  const stated = QUESTIONS.find((q) => q.id === 'react').options.find(([v]) => v === p.stated)?.[1].en;
  const last = [...book.orders].reverse();
  switch (event) {
    case 'welcome': return `EVENT: the game is starting. The player has ₹${p.startCash} of pretend money for 20 days. Welcome them personally (their goal, where they hear about stocks, their experience) and tell them what to watch out for given that profile.`;
    case 'trending': { const tr = TRENDING[p.sources.includes('groups') ? 'groups' : p.sources.includes('social') ? 'social' : p.sources.includes('people') ? 'people' : 'news']; return `EVENT: the player just got this message from ${tr.from.en}: ${tr.text.en} The rumour about Rocket Infra's contract is NOT confirmed by the company.`; }
    case 'chasing': return `EVENT: the player just bought ${code}, which had already risen ${Math.round(changeOver(M, code, d, 5))}% in 5 days. Their reason: "${last.find((o) => o.side === 'buy')?.reasonText || ''}"`;
    case 'concentration': { const mw = book.maxWeight || { w: 0, code: '' }; return `EVENT: after the last buy, ${Math.round(mw.w * 100)}% of the player's money is in one company (${STOCKS.find((s) => s.code === mw.code)?.name || mw.code}).`; }
    case 'tip': return `EVENT: the player just bought on a tip. Their reason: "${last.find((o) => o.side === 'buy')?.reasonText || ''}"`;
    case 'leverage': return 'EVENT: the player just switched the order type to MTF 4x (3 parts borrowed, interest 0.05% a day; a 25% fall wipes out their own money; below 50% of own money the broker sells automatically).';
    case 'crash': return `EVENT: the whole market is falling sharply today (SIM 50 down 4%). Before the game, asked what they would do if ₹10000 became ₹7000, the player said: "${stated}". Remind them of their own words and help them decide calmly. Do not tell them what to do.`;
    case 'panic': return `EVENT: the player just sold during the fall. Their reason: "${last.find((o) => o.side === 'sell')?.reasonText || ''}". Before the game they said: "${stated}".`;
    case 'margincall': { const m = book.marginCalls.at(-1); return m ? `EVENT: MARGIN CALL. The broker sold all of the player's ${m.code} shares on day ${m.day}. They lost ₹${Math.round(m.lost)} of their own money (they had put in ₹${Math.round(m.ownBefore)}).` : 'EVENT: margin call.'; }
    case 'debt': return 'EVENT: news today: Vikram Ispat had trouble repaying a loan instalment and its shares fell 12%. The player holds Vikram Ispat.';
    default: return '';
  }
}

export default async function handler(req, res) {
  const t0 = Date.now();
  const fail = (why, status = 200) => {
    console.error(`[coach] ${req.body?.event || '?'} → fallback (${why}) ${Date.now() - t0}ms`);
    return res.status(status).json({ ok: false, source: 'fallback', fallback: true, why, ms: Date.now() - t0 });
  };
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  // Coach calls are triggered by game events, not typing, so the limit is generous.
  if (rateLimited(req, 120)) return fail('http:429', 429);
  const b = req.body || {};
  if (!EVENTS.includes(b.event)) return fail('bad_event', 400);
  if (!hasBrain()) return fail('no_key');
  let facts, p;
  try {
    const state = simState(b);
    p = state.p;
    const code = typeof b.code === 'string' && STOCKS.some((s) => s.code === b.code) ? b.code : b.event === 'debt' ? 'VIKISPAT' : b.event === 'trending' ? 'ROCKINFR' : null;
    facts = [profileLine(p), portfolioFacts(state.book, state.d), code ? stockFacts(code, state.d) : '', eventFacts(b.event, state, code, b.extra)].filter(Boolean).join('\n');
  } catch (e) { return fail('facts:' + e.message.slice(0, 60)); }

  const system = [
    'You are the coach inside NiveshSetu, a stock-market practice app for first-time investors in India.',
    'Something just happened (EVENT). Write a short, personal coaching note about THIS player\'s actual situation: what happened in their portfolio or decision, and why it matters to someone like them.',
    'Use at least one specific number copied exactly from FACTS (do not calculate new numbers). Do not repeat a textbook definition; connect it to what they did. Be warm and direct, never preachy or scary.',
    'You may describe what the player already did or what a message said, but never tell them what to do next with any share.',
    'Then ask ONE reflective question that makes them think before their next move (not yes/no, not "should you buy/sell").',
    ...baseRules(p.lang),
    `concept = the one lesson most related, from: ${Object.keys(CONCEPTS).join(', ')}.`,
    'Return JSON: {"title":"max 6 words","message":"2-3 short sentences","question":"one question","concept":""}',
  ].join('\n');
  try {
    const { data, provider } = await thinkJSON({ system, user: `FACTS:\n${facts}`, temperature: 0.4, maxTokens: 1200 }, (x) => {
      for (const k of ['title', 'message', 'question']) x[k] = typeof x[k] === 'string' ? x[k].trim() : '';
      if (!x.title || !x.message || !x.question) return 'missing_field';
      if (x.concept && !CONCEPTS[x.concept]) x.concept = null;
      return checkCoach({ title: x.title, message: x.message, question: x.question }, facts, { maxLen: 500 });
    });
    console.log(`[coach] ${b.event} → ai ${Date.now() - t0}ms`);
    return res.status(200).json({ ok: true, source: 'ai', title: data.title, message: data.message, question: data.question, concept: data.concept || null, provider, ms: Date.now() - t0 });
  } catch (e) {
    return fail(whyOf(e));
  }
}
