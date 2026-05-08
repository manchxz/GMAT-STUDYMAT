import { updateThetaAfterAttempt } from '@/lib/theta-calibration';
import type { PracticeItem } from '@/lib/practice-items';

export type SkillSnapshotEntry = {
  theta: number;
  recentAccuracy: number;
};

export type SkillSnapshot = Record<string, SkillSnapshotEntry>;

const EMA_ALPHA = 0.22;

export function defaultSnapshotEntry(): SkillSnapshotEntry {
  return { theta: 0, recentAccuracy: 0.55 };
}

export function ensureSnapshotKeys(snapshot: SkillSnapshot, codes: string[]): SkillSnapshot {
  const next = { ...snapshot };
  for (const c of codes) {
    if (!next[c]) next[c] = defaultSnapshotEntry();
  }
  return next;
}

export function snapshotToSkillTheta(snapshot: SkillSnapshot): Record<string, number> {
  return Object.fromEntries(Object.entries(snapshot).map(([k, v]) => [k, v.theta]));
}

export function averageRecentAccuracyForQuestion(
  snapshot: SkillSnapshot,
  skillCodes: string[]
): number {
  if (!skillCodes.length) return 0.55;
  let s = 0;
  for (const code of skillCodes) {
    s += snapshot[code]?.recentAccuracy ?? 0.55;
  }
  return s / skillCodes.length;
}

export function applyAttemptToSnapshot(
  snapshot: SkillSnapshot,
  item: PracticeItem,
  isCorrect: boolean
): SkillSnapshot {
  const next = ensureSnapshotKeys(snapshot, item.routable.skillIds);
  const out: SkillSnapshot = { ...next };

  for (const code of item.routable.skillIds) {
    const cur = out[code] ?? defaultSnapshotEntry();
    const { nextTheta } = updateThetaAfterAttempt(
      cur.theta,
      item.routable.difficulty,
      isCorrect,
      item.routable.discrimination,
      item.routable.guessing
    );
    const acc = cur.recentAccuracy * (1 - EMA_ALPHA) + (isCorrect ? EMA_ALPHA : 0);
    out[code] = {
      theta: nextTheta,
      recentAccuracy: Math.min(0.99, Math.max(0.04, acc)),
    };
  }
  return out;
}
