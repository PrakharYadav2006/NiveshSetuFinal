// POST /api/reason — the reasoning check before an order.
// Body: { app: 'sim'|'demo', side, code, day, qty, lev, text, thread: [{q,a}], round, profile, orders, scenario, amount }
// → { ok, source: 'ai'|'offline'|'rule', why, ms, verdict: 'sound'|'partly'|'weak'|'advice', score,
//     right, wrong, tip_type, tip, consequence, question, flags, flagIds }
// The AI judges the REASONING, never the stock. One question at most, then a verdict card.
import { thinkJSON, hasBrain, whyOf } from '../lib/ai.js';
import { isAdviceRequest, checkGate, rateLimited, baseRules } from '../lib/safety.js';
import { simState, stockFacts, portfolioFacts, orderFacts, profileLine, demoFacts, cleanProfile } from '../lib/facts.js';
import { offlineEvaluate, allowedTips, covers, TIP_TYPES } from '../public/shared/reasoning.js';
import { changeOver, px, totals, buy } from '../public/simulator/engine.js';
import { CRASH, STOCKS, orderFlags, hadNews } from '../public/simulator/data.js';

const ADVICE = {
  hi: 'यह फ़ैसला आपका है, मैं खरीदने-बेचने की सलाह नहीं देता। आप बताइए: इस कंपनी में आपको ऐसा क्या दिखा जिससे आप यह कर रहे हैं?',
  en: 'This decision is yours; I never advise buying or selling. Tell me: what did you see in this company that makes you want to do this?',
  mr: 'हा निर्णय तुमचा आहे; मी शेअर घेण्याचा किंवा विकण्याचा सल्ला देत नाही. तुम्ही सांगा: या कंपनीत तुम्हाला असं काय दिसलं, ज्यामुळे तुम्ही हे करत आहात?', mr: 'हा निर्णय तुमचा आहे, मी खरेदी-विक्रीचा सल्ला देत नाही. तुम्ही सांगा: या कंपनीत तुम्हाला असं काय दिसलं ज्यामुळे तुम्ही हे करत आहात?',
};
const FLAGS = ['tip', 'fomo', 'no_research', 'concentration', 'leverage', 'fear', 'wrong_fact', 'advice_seeking', 'hype'];
const TIP_MEANING = {
  use_fundamentals: 'open the ⓘ facts (debt, profit) before deciding the amount',
  check_news: 'check the date and source of a news item',
  verify_source: 'find where a tip came from before relying on it',
  watchlist_wait: 'put it on the ★ Watchlist and look again on another day',
  size_small: 'keep any one company a small part of the total money',
  exit_plan: 'write down in advance what fall would make them rethink',
  time_horizon: 'write how long this money can stay untouched',
  no_borrowed_money: 'do not use loans or emergency savings for investing',
  diversify: 'spread money across different businesses',
  compare_stated_reaction: 'compare this with the reaction they stated at the start of the game',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (rateLimited(req)) return res.status(429).json({ error: 'slow down' });
  const b = req.body || {};
  const lang = ['en', 'mr'].includes(b.profile?.lang) ? b.profile.lang : 'hi';
  const side = b.side === 'sell' ? 'sell' : 'buy';
  const text = String(b.text || '').slice(0, 400).trim();
  const thread = (Array.isArray(b.thread) ? b.thread : []).slice(0, 4).map((t) => ({ q: String(t.q || '').slice(0, 300), a: String(t.a || '').slice(0, 300) }));
  const round = Math.min(4, +b.round | 0);
  const t0 = Date.now();

  // Facts + context for the offline check
  let facts, ctx;
  if (b.app === 'demo') {
    const p = cleanProfile(b.profile);
    facts = [profileLine(p), demoFacts(b.scenario, b.amount)].join('\n');
    ctx = { demo: true, run5: 0, weightAfter: 0, lev: 1, flagIds: ['tip_source', 'guaranteed_returns_claim'] };
  } else {
    if (!STOCKS.some((s) => s.code === b.code)) return res.status(400).json({ error: 'unknown stock' });
    const { p, d, book, M } = simState(b);
    const qty = Math.max(1, +b.qty | 0), lev = b.lev === 4 ? 4 : 1;
    facts = [profileLine(p), stockFacts(b.code, d), portfolioFacts(book, d), orderFacts({ book, d, code: b.code, side, qty, lev }),
      d >= CRASH.from && d <= CRASH.to ? 'The whole market is in a sharp fall right now.' : ''].filter(Boolean).join('\n');
    let weightAfter = 0;
    if (side === 'buy') { const c = structuredClone(book); if (!buy(c, M, d, b.code, qty, lev).error) { const T = totals(c, M, d); weightAfter = (c.pos[b.code].qty * px(M, b.code, d)) / (T.cash + T.value); } }
    const run5 = changeOver(M, b.code, d, 5);
    const flagIds = orderFlags({ code: b.code, day: d, side, run5, weightAfter, lev, tipSource: b.profile?.tipSource }).map((f) => f.id);
    ctx = { run5, weightAfter, lev, inCrash: d >= CRASH.from && d <= CRASH.to, flagIds, news: hadNews(b.code, d) };
  }
  const offline = (why) => { const o = offlineEvaluate({ text, thread, lang, side, ctx }); if (round > 0) o.question = ''; return { ...o, ok: false, why, flagIds: ctx.flagIds || [], ms: Date.now() - t0 }; };
  // Which "tip for next time" categories fit this order (decided here, not by the AI).
  const allText = [text, ...thread.map((t) => t.a)].join(' ');
  const has = covers(allText);
  const allowed = allowedTips({ side, ctx, has });

  // Layer 1: asking us what to do is not a reason.
  if (isAdviceRequest(text) && thread.length === 0) return res.status(200).json({ ok: true, verdict: 'advice', score: 0, right: '', wrong: '', tip_type: '', tip: '', consequence: '', question: ADVICE[lang], flags: ['advice_seeking'], flagIds: ctx.flagIds || [], source: 'rule', ms: Date.now() - t0 });
  if (!hasBrain()) return res.status(200).json(offline('no_key'));

  const system = [
    'You are the reasoning coach inside NiveshSetu, a stock-market practice app for first-time investors in India.',
    `The player is about to ${side.toUpperCase()} and has written WHY. Your job is to make them think, not to decide for them. Judge ONLY the quality of their reasoning, never the stock. Never say or imply what to buy, sell or hold, and never call the company good or bad.`,
    'Scoring:',
    '- sound (70-100): they show (1) what the company does or why the price moved, using things they could see (sales, profit, debt, P/E, news), not a tip or a running price; (2) they considered the downside (what if it halves; with MTF a 25% fall wipes out their own money); (3) the size fits them (not too much in one company, fits their goal).',
    '- partly (40-69): some of that is there, OR the reason is fine but the order carries a specific risk they have not addressed: more than 25% of their money in one company, MTF, a loss-making or high-debt company, a price that rose over 15% in 5 days, a rumour that is not confirmed.',
    '- weak (0-39): a tip, hype, "it is rising", "everyone is buying", "just trying", fear of missing out, or no real reason.',
    '- For SELL: sound = a reason about the company, their goal, needing money or rebalancing; weak = panic about a fall with no company reason. Selling is not wrong in itself.',
    'If the reason states something that contradicts FACTS (e.g. "sales are growing" when they are falling), say so gently in "wrong", with the fact.',
    round === 0
      ? 'This is the FIRST check. If the verdict is not sound, ask exactly ONE short, personal question that targets the single most important gap and uses one specific fact from FACTS (a number or a news item). Not a yes/no question. If the verdict is sound, question must be "".'
      : 'This is the FINAL check: the player has answered your one question (see THREAD). Judge everything they said together. Do NOT ask another question: question must be "". The player may now place the order.',
    'The verdict card fields:',
    '"right" = one sentence on what in THEIR OWN WORDS holds up (max 140 characters). If nothing does, acknowledge the effort honestly.',
    '"wrong" = one sentence naming the specific gap in their REASONING (max 160 characters). Criticise the reasoning, never the company. If the reason is sound, name the one thing that would make it stronger. Never say "nothing".',
    `"tip_type" = exactly one of these ALLOWED tip_type values for this order: ${allowed.join(', ')}.`,
    `What each means: ${allowed.map((t) => `${t} = ${TIP_MEANING[t]}`).join('; ')}.`,
    '"tip" = one sentence (max 160 characters) wording that tip for this player, about using the app\'s tools or a general money habit, using one fact from FACTS if it helps. Never about whether to buy, sell or hold.',
    '"consequence" = 1-2 short sentences telling the player plainly what THIS order means for them, using numbers from FACTS: e.g. how much they lose if the price halves (or 25% with MTF), what share of their money sits in one company, what selling now locks in. Not advice; just the consequence.',
    'Speak to the player as "you".',
    ...baseRules(lang),
    'Return JSON: {"verdict":"sound|partly|weak","score":0-100,"right":"","wrong":"","tip_type":"","tip":"","consequence":"","question":"","flags":[]} where flags ⊆ ["tip","fomo","hype","no_research","concentration","leverage","fear","wrong_fact"].',
  ].join('\n');
  const user = `FACTS:\n${facts}\n\nTHE PLAYER'S REASON: "${text}"\n${thread.map((t, i) => `QUESTION ${i + 1}: ${t.q}\nANSWER ${i + 1}: "${t.a}"`).join('\n')}`;
  const allowedFacts = `${facts}\n${text}\n${thread.map((t) => t.q + ' ' + t.a).join('\n')}`;

  try {
    const { data, provider } = await thinkJSON({ system, user, temperature: 0.3, maxTokens: 1200 }, (d) => {
      if (!['sound', 'partly', 'weak'].includes(d.verdict)) return 'bad_verdict';
      if (!Number.isFinite(+d.score)) return 'bad_score';
      for (const k of ['right', 'wrong', 'tip', 'question', 'consequence', 'tip_type']) d[k] = String(d[k] ?? '').trim();
      if (!TIP_TYPES.includes(d.tip_type) || !allowed.includes(d.tip_type)) return 'tip_type_not_allowed';
      if (d.wrong.length < 8 || d.tip.length < 8) return 'missing_card_field';
      if (round > 0) d.question = '';
      else if (d.verdict !== 'sound' && d.question.length < 8) return 'no_question';
      return checkGate({ right: d.right, wrong: d.wrong, tip: d.tip, question: d.question, consequence: d.consequence }, allowedFacts,
        { maxLen: { right: 200, wrong: 220, tip: 220, question: 300, consequence: 400 } });
    });
    let score = Math.max(0, Math.min(100, Math.round(+data.score)));
    if (data.verdict === 'sound') score = Math.max(70, score);
    if (data.verdict === 'partly') score = Math.min(69, Math.max(40, score));
    if (data.verdict === 'weak') score = Math.min(39, score);
    const flags = [...new Set([...(Array.isArray(data.flags) ? data.flags.filter((f) => FLAGS.includes(f)) : []), ...offline().flags])];
    const question = data.verdict === 'sound' ? '' : data.question;
    return res.status(200).json({
      ok: true, source: 'ai', provider, ms: Date.now() - t0,
      verdict: data.verdict, score, right: data.right, wrong: data.wrong, tip_type: data.tip_type, tip: data.tip,
      good: data.right, gap: data.wrong, question, consequence: data.consequence, flags, flagIds: ctx.flagIds || [],
    });
  } catch (e) {
    const why = whyOf(e);
    console.error(`[reason] fallback (${why}) ${Date.now() - t0}ms`, e.message);
    return res.status(200).json({ ...offline(why), aiError: true });
  }
}
