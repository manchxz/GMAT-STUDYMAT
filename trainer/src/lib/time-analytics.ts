export type AttemptTimingInput = {
  timeMs: number;
  selectedKey?: string | null;
  correctKey?: string | null;
  timeTargetMs?: number | null;
};

export type PaceLabel = 'panic_like' | 'over_invested' | 'normal';

const PANIC_FRAC = 0.35;
const BLIND_MS = 8500;

const SLOW_FRAC = 2.4;
const SLOW_CAP_MS = 240_000;

export function classifyAttemptPace(t: AttemptTimingInput): PaceLabel {
  const target = t.timeTargetMs && t.timeTargetMs > 5_000 ? t.timeTargetMs : 90_000;

  if (t.timeMs <= BLIND_MS) return 'panic_like';
  if (t.timeMs <= target * PANIC_FRAC) return 'panic_like';
  if (t.timeMs >= Math.min(SLOW_CAP_MS, target * SLOW_FRAC)) return 'over_invested';
  return 'normal';
}

export function shouldFlagPanicGuess(t: AttemptTimingInput & { isCorrect?: boolean }): boolean {
  const pace = classifyAttemptPace(t);
  if (pace !== 'panic_like') return false;
  if (t.isCorrect === true) return false;
  return true;
}

export function shouldFlagOverInvest(t: AttemptTimingInput & { isCorrect?: boolean }): boolean {
  return classifyAttemptPace(t) === 'over_invested';
}

export type SprintRollup = {
  attempts: number;
  correct: number;
  avgTimeMs: number;
  panicGuessRate: number;
  overInvestRate: number;
};

export function summarizeSprintAttempts(
  rows: Array<{
    timeMs: number;
    isCorrect: boolean;
    wasFlaggedGuess?: boolean;
    timeTargetMs?: number | null;
  }>
): SprintRollup {
  const n = rows.length;
  if (!n) {
    return {
      attempts: 0,
      correct: 0,
      avgTimeMs: 0,
      panicGuessRate: 0,
      overInvestRate: 0,
    };
  }

  let sumT = 0;
  let panic = 0;
  let over = 0;
  let correct = 0;

  for (const r of rows) {
    sumT += r.timeMs;
    if (r.isCorrect) correct++;
    const pace = classifyAttemptPace({
      timeMs: r.timeMs,
      timeTargetMs: r.timeTargetMs ?? null,
    });
    const panicHit =
      r.wasFlaggedGuess ||
      (pace === 'panic_like' && !r.isCorrect);
    const overHit = pace === 'over_invested';
    if (panicHit) panic++;
    if (overHit) over++;
  }

  return {
    attempts: n,
    correct,
    avgTimeMs: sumT / n,
    panicGuessRate: panic / n,
    overInvestRate: over / n,
  };
}
