import type { SprintRollup } from './time-analytics';

export type SprintSkillSnapshot = Record<string, { theta: number; recentAccuracy: number }>;

export type PredictiveScoreInput = {
  rollup: SprintRollup;
  priorComposite?: number | null;
  skillSnapshot: SprintSkillSnapshot;
};

export function predictCompositeDelta(input: PredictiveScoreInput): number {
  const { rollup } = input;
  if (!rollup.attempts) return 0;

  const acc = rollup.correct / rollup.attempts;

  const skills = Object.values(input.skillSnapshot);
  const avgAcc =
    skills.length > 0
      ? skills.reduce((s, v) => s + v.recentAccuracy, 0) / skills.length
      : acc;

  const pacePenalty =
    rollup.panicGuessRate * -2.8 + rollup.overInvestRate * -1.6;

  const baseLift = acc * 4.8 + avgAcc * 2.8 + pacePenalty;
  const damped =
    baseLift * Math.min(1, rollup.attempts / 12) +
    Math.max(-0.4, Math.min(0.4, (input.priorComposite ?? 54) / 540 - 0.1));

  return Math.round(damped * 10) / 10;
}

export function etaForImprovement(skillTheta: number, targetTheta: number): string {
  const gap = targetTheta - skillTheta;
  if (gap <= 0.08) return 'At target plateau — maintain mixed review.';
  if (gap <= 0.35) return '≈10–14 focused hrs on weak micro-skills (mixed practice)';
  return '≈20–30 hrs before next major inflection — consider targeted drills.';
}
