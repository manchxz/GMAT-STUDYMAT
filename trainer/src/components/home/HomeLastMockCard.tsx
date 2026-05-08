'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { MockLastResult } from '@/lib/mock-exam-history';
import { mockTotalToScaleFraction, readMockLastResult } from '@/lib/mock-exam-history';

export function HomeLastMockCard({ className = '' }: { className?: string }) {
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

  if (!last) {
    return (
      <div
        className={`rounded-2xl border p-5 ${className}`}
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">Your practice test</p>
        <p className="mt-3 text-sm text-[color:var(--muted)]">You haven’t finished a full practice test on this device yet.</p>
        <Link
          href="/mock"
          className="mt-4 inline-block font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)] underline-offset-4 hover:underline"
        >
          Take a practice test →
        </Link>
      </div>
    );
  }

  const frac = mockTotalToScaleFraction(last.total);

  return (
    <Link
      href="/mock/report"
      className={`block rounded-2xl border p-5 transition hover:border-[color:var(--accent)] ${className}`}
      style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">Last practice test</p>
      <p className="mt-2 text-xs text-[color:var(--muted)]">
        Open your full review—every question, what you chose, and the correct answers.
      </p>
      <div className="mt-4">
        <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.15em] text-[color:var(--muted)]">
          <span>205</span>
          <span>805</span>
        </div>
        <div
          className="relative mt-2 h-3 rounded-full border"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[color:var(--accent)]/35"
            style={{ width: `${frac * 100}%` }}
          />
          <div
            className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-[color:var(--accent)]"
            style={{ left: `${frac * 100}%` }}
          />
        </div>
        <p className="mt-3 text-center font-mono text-xl tabular-nums font-semibold text-[color:var(--accent)]">
          {last.total}
        </p>
        {!last.report && (
          <p className="mt-2 text-center text-[10px] text-amber-200/90">Older save: totals only until your next test.</p>
        )}
      </div>
      <span className="mt-4 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
        Open full review →
      </span>
    </Link>
  );
}
