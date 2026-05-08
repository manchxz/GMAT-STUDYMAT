import type { RoutableQuestion, ScoredCandidate } from '@/lib/adaptive-router';

export function challengeMeterPercent(thetaHat: number, itemDifficulty: number): number {
  const raw = 50 + (itemDifficulty - thetaHat) * 38;
  return Math.round(Math.min(96, Math.max(8, raw)));
}

export function buildRoutingExplanation(
  chosen: RoutableQuestion,
  ranked: ScoredCandidate[],
  rankIndex: number
): string {
  const row = ranked.find((r) => r.q.id === chosen.id);
  const thetaHat = row?.thetaHat ?? 0;
  const skills = chosen.skillIds.join(', ').replace(/_/g, ' ');
  const rankLine =
    rankIndex === 0 && ranked.length > 1
      ? 'Picked as the best next question for you from what’s left in this session.'
      : 'Chosen to match your strengths and gaps from what’s left in this session.';
  return (
    `This question focuses on **${skills}**. ` +
    `Your overall level on our practice scale is about **${thetaHat.toFixed(1)}**—we tend to give you problems slightly above that so you keep improving. ${rankLine}`
  );
}

export type ConfidenceSelfRating = 'LOW' | 'MEDIUM' | 'HIGH';
