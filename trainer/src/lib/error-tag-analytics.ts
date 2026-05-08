import type { ErrorBehaviorTag } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatErrorTagLabel } from '@/lib/error-tags';

export type ErrorTagBucket = {
  tag: ErrorBehaviorTag;
  label: string;
  count: number;
};

export type ErrorTagAnalytics = {
  windowStartIso: string;
  buckets: ErrorTagBucket[];
  taggedMissCount: number;
  untaggedMissCount: number;
};

function startOfLocalMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export async function fetchErrorTagAnalytics(
  userId: string,
  opts?: { windowStart?: Date },
): Promise<ErrorTagAnalytics> {
  const windowStart = opts?.windowStart ?? startOfLocalMonth();
  const now = new Date();

  const baseWhere = {
    answeredAt: { not: null, gte: windowStart, lte: now },
    isCorrect: false,
    session: { userId },
  } as const;

  const [grouped, untaggedMissCount] = await Promise.all([
    prisma.questionAttempt.groupBy({
      by: ['errorTag'],
      where: {
        ...baseWhere,
        errorTag: { not: null },
      },
      _count: { _all: true },
    }),
    prisma.questionAttempt.count({
      where: {
        ...baseWhere,
        errorTag: null,
      },
    }),
  ]);

  const buckets: ErrorTagBucket[] = grouped
    .filter((g): g is typeof g & { errorTag: ErrorBehaviorTag } => g.errorTag != null)
    .map((g) => ({
      tag: g.errorTag,
      label: formatErrorTagLabel(g.errorTag) ?? g.errorTag,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const taggedMissCount = buckets.reduce((s, b) => s + b.count, 0);

  return {
    windowStartIso: windowStart.toISOString(),
    buckets,
    taggedMissCount,
    untaggedMissCount,
  };
}
