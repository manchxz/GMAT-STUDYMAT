'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ThemeSwitcher } from '@/components/system/ThemeSwitcher';
import { MockStemMd } from '@/components/mock/MockStemMd';
import {
  MOCK_SECTION_LABELS,
  MOCK_SECTION_ORDER,
} from '@/lib/mock-exam-types';
import type { MockLastResult } from '@/lib/mock-exam-history';
import { readMockLastResult } from '@/lib/mock-exam-history';

function choiceClass(isCorrectChoice: boolean, isUserChoice: boolean): string {
  if (isCorrectChoice) return 'border-emerald-500/60 bg-emerald-500/10';
  if (isUserChoice) return 'border-red-500/50 bg-red-500/10';
  return 'border-[color:var(--border)] bg-[color:var(--panel)]';
}

export function MockReportClient() {
  const [last, setLast] = useState<MockLastResult | null>(null);

  const refresh = useCallback(() => {
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

  const report = last?.report;
  const completed = last ? new Date(last.completedAt).toLocaleString() : '';

  return (
    <div className="theme-vue min-h-screen bg-[color:var(--bg)] font-sans text-[color:var(--ink)]">
      <header
        className="flex flex-wrap items-center justify-between gap-4 border-b bg-[color:var(--panel)] px-4 py-4 sm:px-8"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-80">
            ← Home
          </Link>
          <Link href="/mock" className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-80">
            Practice test home
          </Link>
        </div>
        <ThemeSwitcher />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-semibold">Review your last practice test</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          For practice only. Questions appear the same way you saw them on the test, including how the answers were
          ordered.
        </p>

        {!last && (
          <div
            className="mt-10 rounded-xl border p-6 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
          >
            <p>We don’t have a completed practice test saved on this device yet.</p>
            <Link href="/mock" className="mt-4 inline-block font-semibold text-[color:var(--accent)] hover:underline">
              Go to practice test home →
            </Link>
          </div>
        )}

        {last && !report && (
          <div
            className="mt-10 rounded-xl border border-amber-500/40 bg-amber-500/10 p-6 text-sm"
            role="status"
          >
            <p className="font-medium">Scores only for this attempt</p>
            <p className="mt-2 text-[color:var(--muted)]">
              This result was saved before full question-by-question review was available. Your total was{' '}
              <strong className="text-[color:var(--ink)]">{last.total}</strong> · finished {completed}. Take a new
              practice test to unlock a full walkthrough of every item.
            </p>
            <Link href="/mock" className="mt-4 inline-block font-semibold text-[color:var(--accent)] hover:underline">
              Start a practice test →
            </Link>
          </div>
        )}

        {last && report && (
          <>
            <div
              className="mt-8 rounded-xl border p-5 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Summary</p>
              <p className="mt-2 tabular-nums font-mono text-2xl font-semibold text-[color:var(--accent)]">
                Total score · {last.total}
              </p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">Completed {completed}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                {MOCK_SECTION_ORDER.map((sec) => (
                  <li
                    key={sec}
                    className="flex justify-between rounded-lg border px-3 py-2 text-xs"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span>{MOCK_SECTION_LABELS[sec]}</span>
                    <span className="tabular-nums font-semibold">{last.sections[sec].est}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 space-y-12">
              {MOCK_SECTION_ORDER.map((sec) => {
                const rows = report[sec] ?? [];
                return (
                  <section key={sec}>
                    <h2 className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
                      {MOCK_SECTION_LABELS[sec]}
                    </h2>
                    <ol className="mt-6 space-y-10">
                      {rows.map((q, idx) => (
                        <li
                          key={`${sec}-${q.itemId}-${idx}`}
                          className="rounded-xl border p-5 sm:p-6"
                          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-xs text-[color:var(--muted)]">
                              Q {idx + 1} · {q.isCorrect ? 'Correct' : 'Incorrect'}
                              {q.flaggedReview ? ' · marked for review' : ''}
                            </span>
                            <span className="text-xs text-[color:var(--muted)]">
                              {(q.timeMs / 1000).toFixed(1)}s
                            </span>
                          </div>
                          <div className="mt-4">
                            <MockStemMd md={q.stemMd} />
                          </div>
                          <ul className="mt-4 space-y-2">
                            {q.displayChoices.map((c) => {
                              const isCorrectChoice = c.key === q.displayCorrectKey;
                              const isMine = c.key === q.selectedKey;
                              return (
                                <li
                                  key={c.key}
                                  className={`rounded-lg border px-3 py-2 text-sm ${choiceClass(
                                    isCorrectChoice,
                                    isMine
                                  )}`}
                                >
                                  <span className="font-mono tabular-nums font-semibold">{c.key}.</span>{' '}
                                  <span>{c.text}</span>
                                  {isCorrectChoice && (
                                    <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                      correct
                                    </span>
                                  )}
                                  {isMine && !isCorrectChoice && (
                                    <span className="ml-2 text-xs font-medium text-red-600 dark:text-red-400">
                                      your answer
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                          {q.selectedKey == null && (
                            <p className="mt-3 text-xs text-[color:var(--muted)]">
                              No answer saved—you may have run out of time or skipped this question.
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
