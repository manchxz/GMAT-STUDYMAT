import Link from 'next/link';
import { getSessionUserId } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import { buildStudyAdvice, CORE_CHAPTER_IDS, textbookChapterNames } from '@/lib/study-advice';
import type { BreakdownEntry } from '@/lib/study-advice';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { ThemeSwitcher } from '@/components/system/ThemeSwitcher';
import { StudyJourney } from '@/components/home/StudyJourney';
import { StudyPlanSection } from '@/components/dashboard/StudyPlanSection';
import { ErrorTagAnalyticsSection } from '@/components/dashboard/ErrorTagAnalyticsSection';
import { fetchErrorTagAnalytics } from '@/lib/error-tag-analytics';

export const dynamic = 'force-dynamic';

const CHAPTER_LINK: Record<string, string> = {
  '01': '/textbook/chapters/01-quant-number-properties.html',
  '02': '/textbook/chapters/02-quant-algebraic-logic.html',
  '03': '/textbook/chapters/03-quant-word-problems.html',
  '04': '/textbook/chapters/04-verbal-critical-reasoning.html',
  '05': '/textbook/chapters/05-verbal-reading-comp.html',
  '06': '/textbook/chapters/06-di-data-sufficiency.html',
  '07': '/textbook/chapters/07-di-multi-source-reasoning.html',
  '08': '/textbook/chapters/08-di-table-analysis.html',
  '09': '/textbook/chapters/09-di-graphics-interpretation.html',
  '10': '/textbook/chapters/10-strategy-art-of-skip.html',
  appendix: '/textbook/chapters/appendix-trap-library.html',
  diagnostic: '/textbook/extras/diagnostic.html',
};

async function GuestDashboard({ notice }: { notice?: string }) {
  const advice = buildStudyAdvice({ completedIds: [], diagnostic: null });

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b bg-[color:var(--bg)]/90 px-4 py-4 backdrop-blur"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.35em] opacity-70">
              ← Home
            </Link>
            <Link
              href="/review"
              className="font-mono text-[11px] uppercase tracking-[0.35em] text-[color:var(--accent)]"
            >
              Review hub →
            </Link>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {notice ? (
          <p
            className="mb-8 rounded-xl border px-4 py-3 text-sm leading-relaxed text-[color:var(--ink)]"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
            role="status"
          >
            {notice}
          </p>
        ) : null}
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">Your progress</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Study dashboard</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--muted)]">
          You&apos;re using the app without an account. The study lab, textbook, and practice test work fully in this
          mode. Saved misses, diagnostic sync, and chapter completion from the textbook will plug back in when sign-in
          returns.
        </p>

        <div className="mt-8 max-w-2xl">
          <StudyJourney
            hasDiagnostic={false}
            modulesCompleted={advice.modulesCompleted}
            totalCoreModules={advice.totalCoreModules}
            studyPlanTeaser={advice.headline}
          />
        </div>

        <div className="mt-10">
          <StudyPlanSection
            hasDiagnostic={false}
            diagnosticRanking={[]}
            headline={advice.headline}
            completedChapterIds={[]}
            coreChapterIds={CORE_CHAPTER_IDS}
            chapterNames={textbookChapterNames}
            chapterLinks={CHAPTER_LINK}
            appendixHref={CHAPTER_LINK.appendix}
            appendixDone={advice.appendixDone}
            latestDiag={null}
            modulesCompleted={advice.modulesCompleted}
            totalCoreModules={advice.totalCoreModules}
          />
        </div>
      </main>
    </>
  );
}

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) {
    return <GuestDashboard />;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (!user) {
    return (
      <GuestDashboard notice="We couldn’t load your profile for this session. Showing the same guest dashboard until the database is available." />
    );
  }

  const [progressRows, latestDiag] = await Promise.all([
    prisma.learnerChapterProgress.findMany({
      where: { userId },
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
      ? { scorePct: latestDiag.scorePct, breakdown: breakdown ?? {} }
      : null,
  });

  const errorTagAnalytics = await fetchErrorTagAnalytics(userId);

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b bg-[color:var(--bg)]/90 px-4 py-4 backdrop-blur"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.35em] opacity-70">
              ← Home
            </Link>
            <Link href="/review" className="font-mono text-[11px] uppercase tracking-[0.35em] text-[color:var(--accent)]">
              Review hub →
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <LogoutButton />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">Your progress</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {user.name ? `Welcome back, ${user.name}` : 'Welcome back'}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">{user.email}</p>

        <div className="mt-8 max-w-2xl">
          <StudyJourney
            hasDiagnostic={Boolean(latestDiag)}
            modulesCompleted={advice.modulesCompleted}
            totalCoreModules={advice.totalCoreModules}
            studyPlanTeaser={advice.headline}
          />
        </div>

        <div className="mt-10">
          <StudyPlanSection
            hasDiagnostic={Boolean(latestDiag)}
            diagnosticRanking={advice.diagnosticRanking}
            headline={advice.headline}
            completedChapterIds={completedIds}
            coreChapterIds={CORE_CHAPTER_IDS}
            chapterNames={textbookChapterNames}
            chapterLinks={CHAPTER_LINK}
            appendixHref={CHAPTER_LINK.appendix}
            appendixDone={advice.appendixDone}
            latestDiag={
              latestDiag
                ? {
                    correct: latestDiag.correct,
                    total: latestDiag.total,
                    scorePct: latestDiag.scorePct,
                    takenAtIso: latestDiag.createdAt.toISOString(),
                  }
                : null
            }
            modulesCompleted={advice.modulesCompleted}
            totalCoreModules={advice.totalCoreModules}
          />
        </div>

        <ErrorTagAnalyticsSection data={errorTagAnalytics} />
      </main>
    </>
  );
}
