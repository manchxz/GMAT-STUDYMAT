import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import { buildStudyAdvice } from '@/lib/study-advice';
import type { BreakdownEntry } from '@/lib/study-advice';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const [progressRows, latestDiag] = await Promise.all([
    prisma.learnerChapterProgress.findMany({
      where: { userId },
      select: { chapterId: true, completedAt: true },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.learnerDiagnostic.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const completedIds = [...new Set(progressRows.map((r) => r.chapterId))];
  let breakdown: Record<string, BreakdownEntry> | null = null;
  if (latestDiag?.breakdown && typeof latestDiag.breakdown === 'object') {
    breakdown = latestDiag.breakdown as Record<string, BreakdownEntry>;
  }

  const advice = buildStudyAdvice({
    completedIds,
    diagnostic: latestDiag
      ? {
          scorePct: latestDiag.scorePct,
          breakdown: breakdown ?? {},
        }
      : null,
  });

  return NextResponse.json({
    completedChapters: progressRows,
    latestDiagnostic: latestDiag,
    advice,
  });
}
