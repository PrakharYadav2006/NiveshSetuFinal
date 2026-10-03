// Rule engine + metrics for the Telegram demo. Deterministic and explainable: no AI decides scores.
import { FLAGS, DISTRACTORS } from './content.js';

export function newSession(profile) {
  return { profile, startedAt: Date.now(), runs: { 1: emptyRun(), 2: emptyRun() }, recovery: { action: null, checked: false } };
}
function emptyRun() {
  return {
    tradeOpenedAt: null, decidedAt: null, decision: null, amount: 0,
    checksOpened: [], selected: [], result: null,
    reasonText: '', gate: null,
  };
}

// The quiz gets harder with the reader's level: more "true but harmless" distractors.
export function quizOptions(scenario, level = 'mid') {
  const extra = level === 'fin' ? ['d_logo', 'd_hindi'] : [];
  const dis = level === 'basic' ? scenario.quiz.distractors.slice(0, 1) : [...scenario.quiz.distractors, ...extra];
  const ids = [...scenario.quiz.flags, ...dis];
  let seed = scenario.id === 's1' ? 7 : 13;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids.map((id) => ({ id, title: (FLAGS[id] || DISTRACTORS[id]).title, isFlag: !!FLAGS[id] }));
}

export function scoreQuiz(scenario, selected) {
  const flags = scenario.quiz.flags;
  const hits = flags.filter((f) => selected.includes(f));
  const missed = flags.filter((f) => !selected.includes(f));
  const falseAlarms = selected.filter((s) => !!DISTRACTORS[s]);
  const unseen = flags.filter((f) => !FLAGS[f].taught);
  return {
    hits, missed, falseAlarms, total: flags.length,
    pct: Math.round((hits.length / flags.length) * 100),
    unseenHits: hits.filter((f) => !FLAGS[f].taught).length, unseenTotal: unseen.length,
  };
}

export const latencySec = (run) => (run.tradeOpenedAt && run.decidedAt ? Math.round((run.decidedAt - run.tradeOpenedAt) / 1000) : null);

export function lossAt(amount, buyPrice, nowPrice) {
  const value = Math.round((amount * nowPrice) / buyPrice);
  return { shares: Math.floor(amount / buyPrice), invested: amount, value, loss: amount - value };
}

// The before/after table: "measurable resilience". Row keys are labelled by the app.
export function summary(session) {
  const r1 = session.runs[1], r2 = session.runs[2];
  const s = (r) => r.gate?.score ?? null;
  return [
    { key: 'bought', a: r1.decision === 'buy', b: r2.decision === 'buy', better: r1.decision === 'buy' && r2.decision !== 'buy' },
    { key: 'checked', a: r1.checksOpened.length > 0, b: r2.checksOpened.length > 0, better: r2.checksOpened.length > r1.checksOpened.length },
    { key: 'flags', a: `${r1.result?.hits.length ?? 0}/${r1.result?.total ?? 0}`, b: `${r2.result?.hits.length ?? 0}/${r2.result?.total ?? 0}`, better: (r2.result?.pct ?? 0) > (r1.result?.pct ?? 0) },
    { key: 'unseen', a: '—', b: `${r2.result?.unseenHits ?? 0}/${r2.result?.unseenTotal ?? 0}`, better: (r2.result?.unseenHits ?? 0) > 0 },
    { key: 'reason', a: s(r1) ?? '—', b: s(r2) ?? '—', better: s(r1) != null && s(r2) != null && s(r2) > s(r1) },
    { key: 'time', a: latencySec(r1) ?? '—', b: latencySec(r2) ?? '—', better: (latencySec(r2) ?? 0) > (latencySec(r1) ?? 0) },
  ];
}

export function pilotRecord(session) {
  const r = (n) => {
    const x = session.runs[n];
    return { decision: x.decision, amount: x.amount, checks: x.checksOpened, latency_s: latencySec(x), reason_score: x.gate?.score ?? null,
      hits: x.result?.hits.length, total: x.result?.total, false_alarms: x.result?.falseAlarms.length, unseen_hits: x.result?.unseenHits };
  };
  const p = session.profile;
  return { lang: p.lang, level: p.level, work: p.work, sources: p.sources, experienced: p.experienced, stake: p.stake,
    run1: r(1), run2: r(2), recovery_scam: session.recovery.action, recovery_checked: session.recovery.checked,
    minutes: Math.round((Date.now() - session.startedAt) / 60000) };
}
