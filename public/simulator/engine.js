// Market + portfolio + behaviour metrics. Deterministic: same market for every player,
// so behaviour can be compared fairly. Runs fully on the phone; nothing is sent anywhere.
import { STOCKS, MARKET, INDICES, SEASON_DAYS, CRASH } from './data.js';

export const PRE = 60;                 // days of history before the season starts
export const MTF_INTEREST = 0.0005;    // 0.05% per day on borrowed money (~18%/yr)
export const MAINTENANCE = 0.5;        // square-off when equity < 50% of own money

function rng(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
}
function gauss(r) {
  let u = 0, v = 0;
  while (!u) u = r();
  while (!v) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const tick = (p) => Math.max(0.05, Math.round(p * 20) / 20);

export function buildMarket() {
  const series = {};
  STOCKS.forEach((s, k) => {
    const r = rng(1000 + k * 7919);
    const pre = [s.price];
    for (let i = 0; i < PRE; i++) pre.unshift(pre[0] / (1 + (s.drift + gauss(r) * s.sd * 0.9) / 100));
    const close = [...pre];
    for (let d = 1; d <= SEASON_DAYS; d++) {
      const ret = (s.beta * MARKET[d - 1] + gauss(r) * s.sd + (s.ev[d] || 0)) / 100;
      close.push(close[close.length - 1] * (1 + ret));
    }
    const c = close.map(tick);
    const low = [], high = [];
    c.forEach((p, i) => {
      const prev = i ? c[i - 1] : p;
      low.push(tick(Math.min(p, prev) * (1 - Math.abs(gauss(r)) * s.sd * 0.004)));
      high.push(tick(Math.max(p, prev) * (1 + Math.abs(gauss(r)) * s.sd * 0.004)));
    });
    series[s.code] = { close: c, low, high };
  });
  const idx = {};
  INDICES.forEach((ix) => {
    const v = [ix.base];
    MARKET.forEach((m) => v.push(v[v.length - 1] * (1 + (ix.beta * m) / 100)));
    idx[ix.id] = v;
  });
  return { series, idx };
}

// ── Quotes ───────────────────────────────────────────────────
export const px = (M, code, day) => M.series[code].close[PRE + day];
export function quote(M, code, day) {
  const p = px(M, code, day), prev = px(M, code, day - 1);
  return { price: p, chg: p - prev, pct: ((p - prev) / prev) * 100, low: M.series[code].low[PRE + day], high: M.series[code].high[PRE + day] };
}
// Shares traded in a day (deterministic, so prices stay exactly as before). Volume rises with the size of the
// move and on company-news days, so a pumped share (Rocket Infra on rumour days) shows a volume spike.
const hash = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export function volume(M, code, day) {
  const s = STOCKS.find((x) => x.code === code);
  const pct = Math.abs(((px(M, code, day) - px(M, code, day - 1)) / px(M, code, day - 1)) * 100);
  const ev = Math.abs(s.ev?.[day] || 0);
  const x = Math.sin((day + 99) * 12.9898 + hash(code)) * 43758.5453;
  const wobble = 0.85 + 0.3 * (x - Math.floor(x));
  return Math.round(s.f.mcap * 25 * wobble * (1 + 0.35 * pct + 0.2 * ev));
}
export const avgVolume = (M, code, day, n = 20) => { let t = 0; for (let d = day - n; d < day; d++) t += volume(M, code, d); return t / n; };
// Simple average of closing prices over the last n days (including today).
export const sma = (M, code, day, n = 20) => { let t = 0; for (let d = day - n + 1; d <= day; d++) t += px(M, code, d); return t / n; };

export function changeOver(M, code, day, n) {
  const a = px(M, code, Math.max(day - n, -PRE)), b = px(M, code, day);
  return ((b - a) / a) * 100;
}
export function history(M, code, day, n) {
  const c = M.series[code].close;
  return c.slice(Math.max(0, PRE + day - n), PRE + day + 1);
}
export function indexQuote(M, id, day) {
  const v = M.idx[id];
  return { value: v[day], chg: v[day] - v[day - 1], pct: ((v[day] - v[day - 1]) / v[day - 1]) * 100 };
}
export function range(M, code, day, n) {
  const h = history(M, code, day, n);
  return { lo: Math.min(...h), hi: Math.max(...h) };
}

// ── Portfolio ────────────────────────────────────────────────
export function newBook(cash) {
  return { cash, start: cash, pos: {}, orders: [], marginCalls: [], interest: 0, maxWeight: { w: 0, code: null }, preCrash: null };
}

export function buy(book, M, day, code, qty, lev, meta = {}) {
  const p = px(M, code, day);
  const value = qty * p, own = value / lev;
  if (qty <= 0) return { error: 'qty' };
  if (own > book.cash + 0.01) return { error: 'cash' };
  const pos = book.pos[code];
  if (pos && pos.lev !== lev) return { error: 'mix' };
  book.cash -= own;
  if (!pos) book.pos[code] = { qty, avg: p, lev, loan: value - own, own };
  else {
    pos.avg = (pos.avg * pos.qty + value) / (pos.qty + qty);
    pos.qty += qty; pos.loan += value - own; pos.own += own;
  }
  book.orders.push({ day, side: 'buy', code, qty, price: p, lev, ...meta });
  const w = weightOf(book, M, day, code);
  if (w > book.maxWeight.w) book.maxWeight = { w, code };
  return { ok: true, price: p };
}

export function sell(book, M, day, code, qty, meta = {}) {
  const pos = book.pos[code];
  if (!pos) return { error: 'none' };
  if (!(qty > 0)) return { error: 'qty' }; // an order of 0 shares is never recorded
  qty = Math.min(qty, pos.qty);
  const p = px(M, code, day);
  const frac = qty / pos.qty;
  const loanPart = pos.loan * frac, ownPart = pos.own * frac;
  const proceeds = qty * p;
  const pnl = proceeds - qty * pos.avg;
  book.cash += proceeds - loanPart;
  pos.loan -= loanPart; pos.own -= ownPart; pos.qty -= qty;
  if (pos.qty <= 0) delete book.pos[code];
  book.orders.push({ day, side: 'sell', code, qty, price: p, lev: pos.lev, pnl, ...meta });
  return { ok: true, price: p, pnl };
}

export function holdings(book, M, day) {
  return Object.entries(book.pos).map(([code, p]) => {
    const price = px(M, code, day);
    const value = p.qty * price, cost = p.qty * p.avg;
    return { code, ...p, price, value, cost, pnl: value - cost, pnlPct: ((value - cost) / cost) * 100, dayChg: p.qty * (price - px(M, code, day - 1)) };
  });
}

export function totals(book, M, day) {
  const h = holdings(book, M, day);
  const value = h.reduce((s, x) => s + x.value, 0);
  const cost = h.reduce((s, x) => s + x.cost, 0);
  const loan = h.reduce((s, x) => s + x.loan, 0);
  const dayChg = h.reduce((s, x) => s + x.dayChg, 0);
  const net = book.cash + value - loan;
  return { value, cost, loan, pnl: value - cost, pnlPct: cost ? ((value - cost) / cost) * 100 : 0, dayChg, cash: book.cash, net, netPct: ((net - book.start) / book.start) * 100 };
}

// Share of everything you hold (cash + shares at market value) sitting in one company.
function weightOf(book, M, day, code) {
  const t = totals(book, M, day);
  const p = book.pos[code];
  const gross = t.cash + t.value;
  return p && gross > 0 ? (p.qty * px(M, code, day)) / gross : 0;
}

// Move to the next day: interest on loans, margin checks, pre-crash snapshot.
export function advance(book, M, toDay) {
  const events = [];
  if (toDay === CRASH.from) book.preCrash = totals(book, M, toDay - 1).value;
  for (const [code, p] of Object.entries(book.pos)) {
    if (p.lev > 1) {
      const add = p.loan * MTF_INTEREST;
      p.loan += add; book.interest += add;
      const equity = p.qty * px(M, code, toDay) - p.loan;
      if (equity < MAINTENANCE * p.own) {
        const before = book.cash;
        sell(book, M, toDay, code, p.qty, { reason: 'margincall', forced: true });
        const ev = { code, day: toDay, lost: p.own - (book.cash - before), ownBefore: p.own };
        book.marginCalls.push(ev);
        events.push({ type: 'margincall', ...ev });
      }
    }
  }
  return events;
}

// Rebuild a book from its order list (server side: the AI only ever sees numbers we computed).
const ORDER_META = ['reason', 'reasonText', 'gate', 'research', 'thinkMs', 'pageMs', 'sheetMs', 'flagsSeen', 'proceeded', 'ato'];
export function replay(M, start, orders, uptoDay) {
  const book = newBook(start);
  const real = (orders || []).filter((o) => o && !o.forced && STOCKS.some((s) => s.code === o.code) && Number.isInteger(o.day) && o.day >= 1 && o.day <= SEASON_DAYS)
    .map((o, i) => ({ o, i })).sort((a, b) => a.o.day - b.o.day || a.i - b.i).map((x) => x.o);
  let k = 0;
  for (let d = 1; d <= Math.min(uptoDay, SEASON_DAYS); d++) {
    if (d > 1) advance(book, M, d);
    while (k < real.length && real[k].day === d) {
      const o = real[k++];
      const meta = Object.fromEntries(ORDER_META.filter((f) => o[f] != null).map((f) => [f, o[f]]));
      const qty = Math.max(0, Math.min(1e7, Math.floor(+o.qty || 0)));
      if (qty <= 0) continue; // never replay a 0-share order
      if (o.side === 'buy') buy(book, M, d, o.code, qty, o.lev === 4 ? 4 : 1, meta);
      else if (o.side === 'sell') sell(book, M, d, o.code, qty, meta);
    }
  }
  return book;
}

// ── Behaviour metrics for the report (all deterministic) ─────
export function metrics(book, M, day) {
  const t = totals(book, M, day);
  const real = book.orders.filter((o) => !o.forced);
  const buys = real.filter((o) => o.side === 'buy');
  const sells = real.filter((o) => o.side === 'sell');
  const inCrash = (o) => o.day >= CRASH.from && o.day <= CRASH.to;
  const crashSold = sells.filter(inCrash).reduce((s, o) => s + o.qty * o.price, 0);
  const crashBought = buys.filter(inCrash).reduce((s, o) => s + o.qty * o.price, 0);
  const pre = book.preCrash || 0;
  let actual = 'none';
  const fearSold = sells.some((o) => inCrash(o) && o.reason === 'fear');
  if (pre > 0) actual = crashSold > 0.5 * pre ? 'sell' : crashBought > 0.1 * pre ? 'buy' : crashSold > 0 ? (fearSold ? 'partial_fear' : 'partial') : 'wait';
  const equal = STOCKS.reduce((s, st) => s + px(M, st.code, day) / px(M, st.code, 0), 0) / STOCKS.length;
  const reasons = {};
  buys.forEach((b) => { reasons[b.reason] = (reasons[b.reason] || 0) + 1; });
  return {
    final: t.net, pct: t.netPct, start: book.start,
    equalSplit: book.start * equal, cash: book.start,
    buys: buys.length, sells: sells.length, trades: real.length,
    researched: buys.filter((b) => b.looked).length,
    researchPct: buys.length ? Math.round((buys.filter((b) => b.looked).length / buys.length) * 100) : null,
    reasons,
    tipBuys: buys.filter((b) => b.reason === 'tip' || b.reason === 'rising').length,
    chasedHype: buys.some((b) => b.code === 'ROCKINFR' && b.day >= 2 && b.day <= 7),
    maxWeight: book.maxWeight,
    actual, preCrash: pre,
    panicSells: sells.filter((o) => inCrash(o) && o.reason === 'fear').length,
    leverage: real.some((o) => o.lev > 1),
    marginCalls: book.marginCalls.length,
    interest: book.interest,
    avgThinkSec: buys.length ? Math.round(buys.reduce((s, b) => s + (b.thinkMs || 0), 0) / buys.length / 1000) : null,
  };
}
