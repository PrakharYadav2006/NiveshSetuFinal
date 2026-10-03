// The behaviour model. Each habit gets a value, a 0–100 score from explicit thresholds,
// and a band (good ≥ 70, ok 40–69, poor < 40). The overall Resilience Score is a weighted
// average of the habits that apply to this player. Same code runs on the phone and the server,
// so the AI is always given the exact numbers the player sees. No AI decides any score.
import { STOCKS, CRASH, SEASON_DAYS } from './data.js';
import { px, totals, changeOver, metrics as baseMetrics } from './engine.js';

export const WEIGHTS = { research: 0.17, reasoning: 0.17, think: 0.1, fomo: 0.14, concentration: 0.12, crash: 0.15, leverage: 0.07, churn: 0.04, pause: 0.04 };

// Thresholds, written out so they can be shown and defended.
export const MODEL = {
  research: 'Per buy: opened fundamentals ⓘ 35 + read company news 25 + looked at the 3-month chart 15 + kept it on the watchlist from an earlier day 25. Score = average.',
  reasoning: 'Average quality score (0–100) the reasoning check gave your final buy reasons.',
  think: 'Median time from opening a stock to placing the buy. ≤15s = 0, 45s = 50, ≥120s = 100.',
  fomo: 'Share of buys made on a tip, on "price is running", or after a 15%+ rise in 5 days. 0% = 100, ≥50% = 0.',
  concentration: 'Largest share of your money in one company. ≤25% = 100, ≥60% = 0.',
  crash: 'Share of your holdings sold out of fear during the fall (days 8–12). 0% = 100, ≥50% = 0.',
  leverage: 'No margin = 100, margin without a margin call = 45, margin call = 0.',
  churn: 'Orders placed: ≤8 = 100, 24+ = 30, minus 15 for each sell within 2 days of buying the same stock.',
  pause: 'Times you bought even after the reasoning check said your reason was weak. 0 = 100, 1 = 55, 2+ = 15.',
};

const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));
const lerp = (x, x0, x1, y0, y1) => (x <= x0 ? y0 : x >= x1 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0));
export const band = (s) => (s >= 70 ? 'good' : s >= 40 ? 'ok' : 'poor');
const median = (a) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r1 = (x) => Math.round(x * 10) / 10;

export function depthOf(o) {
  const r = o.research || {};
  return Math.min(1, (r.info ? 0.35 : 0) + (r.news ? 0.25 : 0) + (r.chart ? 0.15 : 0) + (r.watched ? 0.25 : 0));
}
export const isFomo = (o, M) =>
  ['tip', 'rising'].includes(o.reason) || (o.gate?.flags || []).some((f) => ['tip', 'fomo', 'hype'].includes(f)) || changeOver(M, o.code, o.day, 5) >= 15;
const isFear = (o) => o.reason === 'fear' || (o.gate?.flags || []).some((f) => ['fear', 'panic'].includes(f));
const nameOf = (code) => STOCKS.find((s) => s.code === code)?.name || code;

export function analyse(book, M, day, profile) {
  const base = baseMetrics(book, M, day);
  const real = book.orders.filter((o) => !o.forced);
  const buys = real.filter((o) => o.side === 'buy');
  const sells = real.filter((o) => o.side === 'sell');
  const inCrash = (o) => o.day >= CRASH.from && o.day <= CRASH.to;
  const items = [];
  const add = (id, score, value, detail = {}) => items.push({ id, score: Math.round(clamp(score)), band: band(score), value, detail, weight: WEIGHTS[id] });

  if (buys.length) {
    const depths = buys.map(depthOf);
    const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
    add('research', avgDepth * 100, Math.round(avgDepth * 100), {
      buys: buys.length,
      openedFundamentals: buys.filter((o) => o.research?.info).length,
      readNews: buys.filter((o) => o.research?.news).length,
      watchedFirst: buys.filter((o) => o.research?.watched).length,
    });

    const scored = buys.filter((o) => Number.isFinite(o.gate?.score));
    if (scored.length) {
      const avg = scored.reduce((a, o) => a + o.gate.score, 0) / scored.length;
      add('reasoning', avg, Math.round(avg), {
        sound: scored.filter((o) => o.gate.verdict === 'sound').length, checked: scored.length,
        examples: scored.slice(-3).map((o) => ({ stock: nameOf(o.code), day: o.day, reason: String(o.reasonText || '').slice(0, 140), score: o.gate.score, verdict: o.gate.verdict })),
      });
    }

    const secs = buys.map((o) => Math.min(600, Math.round((o.thinkMs || 0) / 1000)));
    const med = median(secs);
    const thinkScore = med <= 15 ? 0 : med <= 45 ? lerp(med, 15, 45, 0, 50) : lerp(med, 45, 120, 50, 100);
    add('think', thinkScore, Math.round(med), { fastest: Math.min(...secs), slowest: Math.max(...secs), under30s: secs.filter((s) => s < 30).length, buys: secs.length });

    const fomo = buys.filter((o) => isFomo(o, M));
    const share = fomo.length / buys.length;
    add('fomo', 100 * (1 - Math.min(1, share / 0.5)), Math.round(share * 100), {
      count: fomo.length, buys: buys.length,
      cases: fomo.slice(0, 3).map((o) => ({ stock: nameOf(o.code), day: o.day, roseIn5Days: r1(changeOver(M, o.code, o.day, 5)) })),
    });

    const w = book.maxWeight.w;
    add('concentration', lerp(w, 0.25, 0.6, 100, 0), Math.round(w * 100), { stock: book.maxWeight.code ? nameOf(book.maxWeight.code) : null });
  }

  if (base.preCrash > 0) {
    const fearSold = sells.filter((o) => inCrash(o) && isFear(o)).reduce((s, o) => s + o.qty * o.price, 0);
    const share = fearSold / base.preCrash;
    add('crash', 100 * (1 - Math.min(1, share / 0.5)), Math.round(share * 100), { fearSells: sells.filter((o) => inCrash(o) && isFear(o)).length, heldBeforeFall: Math.round(base.preCrash), action: base.actual });
  }

  if (profile?.allowLeverage || base.leverage) {
    const v = base.marginCalls ? 'call' : base.leverage ? 'used' : 'none';
    add('leverage', v === 'none' ? 100 : v === 'used' ? 45 : 0, v, { marginCalls: base.marginCalls, interestPaid: Math.round(base.interest), lostInMarginCalls: Math.round(book.marginCalls.reduce((s, m) => s + m.lost, 0)) });
  }

  if (real.length) {
    const churn = sells.filter((s) => buys.some((b) => b.code === s.code && s.day - b.day >= 0 && s.day - b.day <= 2)).length;
    add('churn', lerp(real.length, 8, 24, 100, 30) - 15 * churn, real.length, { quickFlips: churn });
  }

  const pushedThrough = buys.filter((o) => o.gate?.overridden).length;
  if (buys.some((o) => o.gate && o.gate.verdict !== 'sound')) add('pause', pushedThrough === 0 ? 100 : pushedThrough === 1 ? 55 : 15, pushedThrough, {});

  const wsum = items.reduce((s, i) => s + i.weight, 0);
  const overall = wsum ? Math.round(items.reduce((s, i) => s + i.score * i.weight, 0) / wsum) : null;
  return {
    items, overall, overallBand: overall == null ? null : band(overall),
    final: base.final, pct: base.pct, start: base.start, equalSplit: base.equalSplit,
    trades: base.trades, buys: base.buys, sells: base.sells,
    actual: base.actual, stated: profile?.stated || 'unsure', day, lastDay: SEASON_DAYS,
    marginCalls: base.marginCalls,
  };
}

// The facts block handed to the AI for the report: only our computed numbers.
export function reportFacts(a, profile) {
  const T = (x) => (x == null ? 'n/a' : x);
  return [
    `Player: education level ${profile.level}; work ${profile.work || profile.domain}; goal ${profile.goal}; experience ${profile.experienced ? 'has traded shares before' : 'new to shares'}; hears about stocks from ${(profile.sources || []).join(', ') || 'nowhere'}.`,
    `Started with ₹${Math.round(a.start)}, ended with ₹${Math.round(a.final)} (${r1(a.pct)}%, a ${a.final >= a.start ? 'gain' : 'loss'} of ₹${Math.abs(Math.round(a.final - a.start))}). Keeping cash = ₹${Math.round(a.start)}. Splitting equally across all 8 companies = ₹${Math.round(a.equalSplit)}.`,
    `Orders: ${a.trades} (${a.buys} buys, ${a.sells} sells).`,
    `Before the game they said that if ₹10000 fell to ₹7000 they would: ${a.stated}. During the fall they actually: ${a.actual}.`,
    `Overall resilience score: ${T(a.overall)}/100.`,
    ...a.items.map((i) => `HABIT ${i.id}: score ${i.score}/100 (${i.band}); value ${i.value}; details ${JSON.stringify(i.detail)}. Rule: ${MODEL[i.id]}`),
  ].join('\n');
}
