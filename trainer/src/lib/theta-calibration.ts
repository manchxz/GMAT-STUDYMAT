import { probability3pl } from '@/lib/adaptive-router';

/**
 * EAP-like online update for a single skill θ after one item.
 * Simplified Kalman / stochastic gradient step — stable for production routing.
 */
export function updateThetaAfterAttempt(
  theta: number,
  itemTheta: number,
  isCorrect: boolean,
  a = 1.0,
  c = 0.2
): { nextTheta: number; se: number } {
  const P = probability3pl(theta, itemTheta, a, c);
  const y = isCorrect ? 1 : 0;
  const residual = y - P;
  /** Fisher information approximation */
  const info = Math.max(0.05, a ** 2 * P * (1 - P));

  const eta = 1 / (1 + info);
  const delta = eta * a * residual;

  const nextTheta = Math.max(-3, Math.min(3, theta + delta));
  const se = Math.sqrt(Math.max(0.02, 1 / (1 / 0.85 + info)));

  return { nextTheta: nextTheta, se };
}
