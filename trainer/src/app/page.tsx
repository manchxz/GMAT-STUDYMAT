import Link from 'next/link';
import { getSessionUserId } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { ThemeSwitcher } from '@/components/system/ThemeSwitcher';
import { GmatFocusFacts } from '@/components/home/GmatFocusFacts';
import { GmatHeroVisual, GmatScoreScaleVisual } from '@/components/home/GmatHeroVisual';
import { HomeLastMockCard } from '@/components/home/HomeLastMockCard';
import { HomeBackdrop } from '@/components/home/HomeBackdrop';
import { StudyJourney } from '@/components/home/StudyJourney';
import { buildStudyAdvice } from '@/lib/study-advice';
import type { BreakdownEntry } from '@/lib/study-advice';

export const dynamic = 'force-dynamic';

type Profile = { name: string | null; email: string | null };

function SidebarColumn() {
  return (
    <div className="flex flex-col gap-6 lg:max-w-sm">
      <HomeLastMockCard />
      <GmatFocusFacts />
      <GmatScoreScaleVisual className="hidden sm:block" />
    </div>
  );
}

export default async function HomePage() {
  const userId = await getSessionUserId();

  let profile: Profile | null = null;
  let profileLoadFailed = false;

  if (userId) {
    try {
      profile = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
    } catch (e) {
      profileLoadFailed = true;
      console.error('[home] prisma.user.findUnique failed', e);
    }
  }

  const coreChapters = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];

  let signedInJourney: {
    hasDiagnostic: boolean;
    modulesCompleted: number;
    totalCoreModules: number;
    studyPlanTeaser?: string | null;
  } | null = null;

  if (userId && profile) {
    try {
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
      signedInJourney = {
        hasDiagnostic: Boolean(latestDiag),
        modulesCompleted: advice.modulesCompleted,
        totalCoreModules: advice.totalCoreModules,
        studyPlanTeaser: advice.headline,
      };
    } catch {
      signedInJourney = {
        hasDiagnostic: false,
        modulesCompleted: 0,
        totalCoreModules: coreChapters.length,
        studyPlanTeaser: null,
      };
    }
  }

  if (userId && profile) {
    return (
      <>
        <HomeBackdrop />
        <main className="relative mx-auto min-h-screen max-w-6xl px-6 py-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-12 lg:items-start">
            <div className="min-w-0">
              <GmatHeroVisual className="mb-10" />
              <div
                className="flex flex-wrap items-center justify-between gap-4 border-b pb-8"
                style={{ borderColor: 'var(--border)' }}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
                  Logic Field Guide · signed in
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/dashboard" className="text-sm font-semibold text-[color:var(--accent)]">
                    Progress dashboard
                  </Link>
                  <Link href="/review" className="text-sm font-semibold text-[color:var(--accent)]">
                    Review hub
                  </Link>
                  <LogoutButton />
                  <ThemeSwitcher />
                </div>
              </div>

              <h1 className="mt-12 text-3xl font-semibold tracking-tight">
                {profile.name ? `Welcome back, ${profile.name}` : 'Welcome back'}
              </h1>
              <p className="mt-2 text-[color:var(--muted)]">{profile.email}</p>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--muted)]">
                Choose how you want to study today.
              </p>

              {signedInJourney ? (
                <div className="mt-10 max-w-2xl">
                  <StudyJourney
                    hasDiagnostic={signedInJourney.hasDiagnostic}
                    modulesCompleted={signedInJourney.modulesCompleted}
                    totalCoreModules={signedInJourney.totalCoreModules}
                    studyPlanTeaser={signedInJourney.studyPlanTeaser}
                  />
                </div>
              ) : null}

              <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <Link
                  href="/study"
                  className="group flex flex-col rounded-2xl border p-8 transition hover:border-[color:var(--accent)]"
                  style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
                    Guided practice
                  </span>
                  <span className="mt-4 text-xl font-semibold text-[color:var(--ink)] group-hover:text-[color:var(--accent)]">
                    Study lab
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
                    Personalized question order, clear explanations when you miss a problem, and simple timing insights
                    so you know what to review next.
                  </span>
                  <span className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
                    Start practicing →
                  </span>
                </Link>

                <Link
                  href="/textbook/index.html"
                  className="group flex flex-col rounded-2xl border p-8 transition hover:border-[color:var(--accent)]"
                  style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
                    Primary
                  </span>
                  <span className="mt-4 text-xl font-semibold text-[color:var(--ink)] group-hover:text-[color:var(--accent)]">
                    Textbook
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
                    Full GMAT Focus course — chapters, diagnostic, flashcards, and print-friendly layout.
                  </span>
                  <span className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
                    Open textbook →
                  </span>
                </Link>

                <Link
                  href="/mock"
                  className="group flex flex-col rounded-2xl border p-8 transition hover:border-[color:var(--accent)]"
                  style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
                    Full exam
                  </span>
                  <span className="mt-4 text-xl font-semibold text-[color:var(--ink)] group-hover:text-[color:var(--accent)]">
                    Full-length practice test
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
                    Same section lengths and timing as the real GMAT™ Focus—Quant, Verbal, and Data Insights in one
                    sitting, with a score overview when you finish.
                  </span>
                  <span className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
                    Start a practice test →
                  </span>
                </Link>
              </div>
            </div>

            <aside className="lg:sticky lg:top-8">
              <SidebarColumn />
            </aside>
          </div>
        </main>
      </>
    );
  }

  const sessionWithoutProfile = Boolean(userId && !profile);

  return (
    <>
      <HomeBackdrop />
      <main className="relative mx-auto min-h-screen max-w-6xl px-6 py-12 text-left lg:py-20">
        {(profileLoadFailed || sessionWithoutProfile) && (
          <div
            className="mb-8 rounded-xl border px-4 py-3 text-sm leading-relaxed"
            style={{
              borderColor: 'rgba(251, 191, 36, 0.35)',
              background: 'rgba(251, 191, 36, 0.08)',
              color: 'var(--ink)',
            }}
            role="status"
          >
            <p className="font-medium text-amber-200">
              {profileLoadFailed
                ? 'Could not load your account from the database.'
                : 'Your session is active, but no profile row was found.'}
            </p>
            <p className="mt-1 text-[color:var(--muted)]">
              Layout and styles are unchanged — this is usually fixed by starting Postgres (for example{' '}
              <code className="rounded bg-[color:var(--panel)] px-1.5 py-0.5 font-mono text-xs">
                docker compose up
              </code>{' '}
              in <code className="font-mono text-xs">trainer</code>) and reloading.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/study" className="font-semibold text-[color:var(--accent)] underline-offset-4 hover:underline">
                Study lab
              </Link>
              <Link
                href="/dashboard"
                className="font-semibold text-[color:var(--accent)] underline-offset-4 hover:underline"
              >
                Dashboard
              </Link>
              <LogoutButton />
              <ThemeSwitcher />
            </div>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-14 lg:items-start">
          <div className="min-w-0">
            <GmatHeroVisual />
            <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.45em] text-[color:var(--muted)]">
              Logic Field Guide
            </p>
            <p className="mt-6 max-w-xl text-xl font-medium leading-relaxed text-[color:var(--ink)] sm:text-2xl">
              GMAT Focus prep without a password: adaptive study lab, full course textbook, and a timed practice test in
              one place.
            </p>

            <div className="mt-10 max-w-2xl">
              <StudyJourney hasDiagnostic={false} modulesCompleted={0} totalCoreModules={coreChapters.length} />
            </div>

            <div className="mt-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/study"
                className="rounded-lg bg-[color:var(--accent)] px-8 py-4 text-center font-semibold text-black"
              >
                Study lab
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border px-8 py-4 text-center font-semibold"
                style={{ borderColor: 'var(--border)' }}
              >
                Dashboard
              </Link>
              <Link
                href="/mock"
                className="rounded-lg border px-8 py-4 text-center font-semibold"
                style={{ borderColor: 'var(--border)' }}
              >
                Practice test
              </Link>
            </div>
            <p className="mt-4 max-w-xl text-sm text-[color:var(--muted)]">
              Accounts and cloud-saved history are on hold.{' '}
              <Link href="/textbook/index.html" className="font-medium text-[color:var(--accent)] underline-offset-4 hover:underline">
                Textbook
              </Link>
              ·{' '}
              <span className="opacity-80">
                Optional: <Link href="/login" className="underline-offset-2 hover:underline">Log in</Link> /{' '}
                <Link href="/register" className="underline-offset-2 hover:underline">Register</Link> for testing only.
              </span>
            </p>

            <div className="mt-14 sm:hidden">
              <GmatScoreScaleVisual />
            </div>
          </div>

          <aside className="lg:sticky lg:top-8">
            <SidebarColumn />
          </aside>
        </div>
      </main>
    </>
  );
}
