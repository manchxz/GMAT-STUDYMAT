'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ThemeSwitcher } from '@/components/system/ThemeSwitcher';
import {
  buildMockStudyReferences,
  getMockCooldownInfo,
  mockTotalToScaleFraction,
  readMockLastResult,
  type MockCooldownInfo,
  type MockLastResult,
  type MockStudyRef,
} from '@/lib/mock-exam-history';

function TotalScoreRail({ total }: { total: number }) {
  const frac = mockTotalToScaleFraction(total);
  return (
    <div className="mt-6">
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
        <span>205</span>
        <span className="text-[color:var(--ink)]">Your last total score (practice scale)</span>
        <span>805</span>
      </div>
      <div
        className="relative mt-3 h-4 rounded-full border"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        role="img"
        aria-label={`Your last practice test total was about ${total} on the 205 to 805 scale`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[color:var(--accent)]/35"
          style={{ width: `${frac * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-7 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-[color:var(--accent)] shadow"
          style={{ left: `${frac * 100}%` }}
        />
      </div>
      <p className="mt-3 text-center font-mono text-2xl tabular-nums font-semibold text-[color:var(--accent)]">
        {total}
      </p>
      <p className="mt-1 text-center text-xs text-[color:var(--muted)]">
        For practice only—not an official GMAC score report.
      </p>
    </div>
  );
}

function ExamReferenceSection({ refs }: { refs: MockStudyRef[] }) {
  return (
    <section
      className="mt-12 rounded-xl border bg-[color:var(--panel)] p-6 sm:p-8"
      style={{ borderColor: 'var(--border)' }}
    >
      <h2 className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
        What to study next
      </h2>
      <p className="mt-2 text-sm text-[color:var(--muted)]">
        Based on your{' '}
        <strong className="text-[color:var(--ink)]">section scores from your last practice test</strong> (each section is
        shown on a 60–90 style scale), we suggest an order below—start from the top.
      </p>
      <ol className="mt-6 space-y-6">
        {refs.map((r) => (
          <li key={r.section} className="border-t pt-6 first:border-t-0 first:pt-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold text-[color:var(--ink)]">
                {r.priority}. {r.label}{' '}
                <span className="font-mono text-sm font-normal tabular-nums text-[color:var(--muted)]">
                  · section score {r.est} · accuracy {r.weightedAcc}%
                </span>
              </span>
              <Link
                href={r.textbookHref}
                className="shrink-0 text-sm font-semibold text-[color:var(--accent)] hover:underline"
              >
                Open chapter →
              </Link>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">{r.suggestion}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function MockExamLanding() {
  const [cool, setCool] = useState<MockCooldownInfo | null>(null);
  const [last, setLast] = useState<MockLastResult | null>(null);

  const refresh = useCallback(() => {
    setCool(getMockCooldownInfo());
    setLast(readMockLastResult());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('mock-exam-result-updated', refresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('mock-exam-result-updated', refresh);
    };
  }, [refresh]);

  const refs = last ? buildMockStudyReferences(last.sections) : [];

  return (
    <div className="theme-vue flex min-h-screen flex-col bg-[color:var(--bg)] font-sans text-[color:var(--ink)]">
      <header
        className="flex flex-wrap items-center justify-between gap-4 border-b bg-[color:var(--panel)] px-4 py-4 sm:px-8"
        style={{ borderColor: 'var(--border)' }}
      >
        <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-80">
          ← Home
        </Link>
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
          GMAT™ Focus · practice test
        </div>
        <ThemeSwitcher />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
          Timed, full-length experience
        </p>
        <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">GMAT™ Focus full-length practice test</h1>
        <p className="mt-4 text-sm leading-relaxed text-[color:var(--muted)]">
          Three sections match the real exam:{' '}
          <strong className="text-[color:var(--ink)]">Quantitative</strong> (21 questions),{' '}
          <strong className="text-[color:var(--ink)]">Verbal</strong> (23 questions), and{' '}
          <strong className="text-[color:var(--ink)]">Data Insights</strong> (20 questions)—45 minutes each. You get a
          fresh set of questions for this attempt (not your study question bank). Harder and easier questions adjust as
          you go, like on test day. Answer choices are shuffled so each attempt feels new.
        </p>

        <div
          className="mt-8 rounded-xl border bg-[color:var(--panel)] p-6 sm:p-8"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Your last practice test (on this device)
          </h2>
          {last ? (
            <div>
              <TotalScoreRail total={last.total} />
              <Link
                href="/mock/report"
                className="mt-6 inline-block text-sm font-semibold text-[color:var(--accent)] hover:underline"
              >
                See every question and answer →
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[color:var(--muted)]">
              Finish a practice test to see your total on the score band below and personalized study suggestions.
            </p>
          )}
        </div>

        {last && refs.length > 0 && <ExamReferenceSection refs={refs} />}

        {cool && !cool.canTakeMock && (
          <div
            className="mt-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-[color:var(--ink)]"
            role="status"
          >
            <p className="font-semibold">One practice test per day</p>
            <p className="mt-1 text-[color:var(--muted)]">{cool.message}</p>
          </div>
        )}

        <ul className="mt-8 list-inside list-disc space-y-2 text-sm text-[color:var(--muted)]">
          <li>Scores use GMAT-style scales for practice (60–90 per section, 205–805-style total).</li>
          <li>You can run <strong className="text-[color:var(--ink)]">one full test per calendar day</strong> on this device.</li>
          <li>You’ll answer a few short questions about your goals while your test is being prepared.</li>
          <li>Not affiliated with GMAC, Pearson VUE, or any official GMAT product.</li>
        </ul>

        <div className="mt-10 flex flex-wrap gap-4">
          {cool?.canTakeMock !== false ? (
            <Link
              href="/mock/prep"
              className="rounded-lg bg-[color:var(--accent)] px-8 py-3 text-center text-sm font-semibold text-black"
            >
              Start practice test
            </Link>
          ) : (
            <span className="rounded-lg border px-8 py-3 text-center text-sm font-semibold text-[color:var(--muted)] opacity-60" style={{ borderColor: 'var(--border)' }}>
              Next test available tomorrow
            </span>
          )}
          <Link
            href="/study"
            className="rounded-lg border px-6 py-3 text-center text-sm font-semibold"
            style={{ borderColor: 'var(--border)' }}
          >
            Guided study
          </Link>
        </div>
      </main>
    </div>
  );
}
