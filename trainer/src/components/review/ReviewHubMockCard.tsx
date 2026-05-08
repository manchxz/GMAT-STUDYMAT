'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { MockLastResult } from '@/lib/mock-exam-history';
import { mockTotalToScaleFraction, readMockLastResult } from '@/lib/mock-exam-history';

export function ReviewHubMockCard() {
  const [last, setLast] = useState<MockLastResult | null>(null);

  const refresh = useCallback(() => setLast(readMockLastResult()), []);

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

  return (
    <section
      className="rounded-xl border p-4 sm:p-5"
      style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      aria-labelledby="mock-review-title"
    >
      <h2 id="mock-review-title" className="text-sm font-semibold text-[color:var(--ink)]">
        Practice test
      </h2>
      <p className="mt-0.5 text-xs text-[color:var(--muted)]">Saved on this device only.</p>

      {!last ? (
        <div className="mt-4">
          <p className="text-sm text-[color:var(--muted)]">No finished test yet.</p>
          <Link
            href="/mock"
            className="mt-3 inline-flex rounded-lg bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-black"
          >
            Start a test
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs text-[color:var(--muted)]">Estimated score</p>
              <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-[color:var(--accent)]">
                {last.total}
              </p>
            </div>
            <div
              className="h-1.5 min-w-[100px] flex-1 max-w-[200px] rounded-full border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              role="presentation"
            >
              <div
                className="h-full rounded-full bg-[color:var(--accent)]/50"
                style={{ width: `${mockTotalToScaleFraction(last.total) * 100}%` }}
              />
            </div>
          </div>
          <p className="mt-3 text-[10px] text-[color:var(--muted)]">Practice only · not an official score.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/mock/report"
              className="inline-flex rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-black"
            >
              View questions
            </Link>
            <Link
              href="/mock"
              className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium"
              style={{ borderColor: 'var(--border)' }}
            >
              New test
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
