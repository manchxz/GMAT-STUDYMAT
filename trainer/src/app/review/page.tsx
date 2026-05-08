import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUserId } from '@/lib/auth-session';
import { formatErrorTagLabel } from '@/lib/error-tags';
import { ReviewHubMockCard } from '@/components/review/ReviewHubMockCard';
import { ThemeSwitcher } from '@/components/system/ThemeSwitcher';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { fetchReviewLogForUser } from '@/lib/review-log';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect('/login?next=/review');

  const rows = await fetchReviewLogForUser(userId);

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b bg-[color:var(--bg)]/90 px-4 py-3 backdrop-blur"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/" className="text-[color:var(--muted)] hover:text-[color:var(--ink)]">
              Home
            </Link>
            <Link href="/study" className="font-medium text-[color:var(--accent)]">
              Study
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LogoutButton />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--ink)]">Review</h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">Study misses and your last practice test.</p>

        <div className="mt-8 space-y-10">
          <ReviewHubMockCard />

          <section aria-labelledby="study-misses-heading">
            <h2 id="study-misses-heading" className="text-sm font-semibold text-[color:var(--ink)]">
              Study misses
            </h2>
            {rows.length === 0 ? (
              <p className="mt-3 text-sm text-[color:var(--muted)]">
                Nothing here yet. Wrong answers from the study lab show up after you go to the next question.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {rows.map((r) => {
                  const tag = formatErrorTagLabel(r.errorTag);
                  const when = new Date(r.at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  return (
                    <li
                      key={r.id}
                      className="rounded-xl border p-4"
                      style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--muted)]">
                        <span>{r.sectionLabel}</span>
                        <time dateTime={r.at}>{when}</time>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[color:var(--ink)]">{r.stemPreview}</p>
                      <p className="mt-2 text-xs text-[color:var(--muted)]">
                        Your answer: <span className="text-[color:var(--ink)]">{r.selectedKey ?? '—'}</span>
                        {' · '}
                        Correct: <span className="text-[color:var(--ink)]">{r.correctKey}</span>
                        {tag ? (
                          <>
                            {' · '}
                            <span className="text-[color:var(--ink)]">{tag}</span>
                          </>
                        ) : null}
                        {r.timeMs != null ? (
                          <>
                            {' · '}
                            {(r.timeMs / 1000).toFixed(0)}s
                          </>
                        ) : null}
                      </p>
                      <Link
                        href={r.textbookHref}
                        className="mt-3 inline-block text-sm font-medium text-[color:var(--accent)] hover:underline"
                      >
                        Open in textbook
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
