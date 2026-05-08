'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeSwitcher } from '@/components/system/ThemeSwitcher';
import type { MockExamPayload, MockExamProfile } from '@/lib/mock-exam-types';
import { MOCK_STORAGE_PAYLOAD, MOCK_STORAGE_PROFILE, MOCK_STORAGE_PROGRESS } from '@/lib/mock-exam-types';
import { getMockCooldownInfo } from '@/lib/mock-exam-history';

function formatElapsed(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function MockPrepClient() {
  const router = useRouter();
  const [whyGmat, setWhyGmat] = useState('');
  const [targetSchools, setTargetSchools] = useState('');
  const [goals, setGoals] = useState('');
  const [started] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [prepStatus, setPrepStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [prepMessage, setPrepMessage] = useState('');
  const [payload, setPayload] = useState<MockExamPayload | null>(null);
  const [serverPrepMs, setServerPrepMs] = useState<number | null>(null);
  const [cooldown] = useState(() => getMockCooldownInfo());
  const cooldownBlocked = !cooldown.canTakeMock;
  const cooldownMessage = cooldown.canTakeMock ? '' : cooldown.message;

  useEffect(() => {
    if (cooldownBlocked) return;
    const id = setInterval(() => setElapsed((Date.now() - started) / 1000), 250);
    return () => clearInterval(id);
  }, [started, cooldownBlocked]);

  useEffect(() => {
    if (cooldownBlocked) return;
    let cancelled = false;
    setPrepStatus('loading');
    setPrepMessage('Putting your test together…');
    (async () => {
      try {
        const r = await fetch('/api/mock/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!r.ok) throw new Error('generate failed');
        const data = (await r.json()) as { ok: boolean; prepMs?: number; payload: MockExamPayload };
        if (cancelled) return;
        setPayload(data.payload);
        setServerPrepMs(typeof data.prepMs === 'number' ? data.prepMs : null);
        setPrepStatus('ready');
        setPrepMessage('Your test is ready. Finish the short intro below, then continue.');
      } catch {
        if (!cancelled) {
          setPrepStatus('error');
          setPrepMessage('We couldn’t prepare your test. Please check your connection and try again.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cooldownBlocked]);

  const formOk = useMemo(() => {
    const w = whyGmat.trim().length >= 24;
    const t = targetSchools.trim().length >= 12;
    const g = goals.trim().length >= 12;
    return w && t && g;
  }, [whyGmat, targetSchools, goals]);

  const canStart = !cooldownBlocked && prepStatus === 'ready' && formOk && payload != null;

  const onBegin = useCallback(() => {
    if (!payload || !canStart) return;
    const profile: MockExamProfile = {
      whyGmat: whyGmat.trim(),
      targetSchools: targetSchools.trim(),
      goals: goals.trim(),
    };
    try {
      sessionStorage.setItem(MOCK_STORAGE_PAYLOAD, JSON.stringify(payload));
      sessionStorage.setItem(MOCK_STORAGE_PROFILE, JSON.stringify(profile));
      sessionStorage.removeItem(MOCK_STORAGE_PROGRESS);
    } catch {
      /* quota */
    }
    router.push('/mock/exam');
  }, [payload, canStart, whyGmat, targetSchools, goals, router]);

  return (
    <div className="theme-vue flex min-h-screen flex-col bg-[color:var(--bg)] font-sans text-[color:var(--ink)]">
      <header
        className="flex flex-wrap items-center justify-between gap-4 border-b bg-[color:var(--panel)] px-4 py-4 sm:px-8"
        style={{ borderColor: 'var(--border)' }}
      >
        <Link href="/mock" className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-80">
          ← Practice test home
        </Link>
        <ThemeSwitcher />
      </header>

      <main className="mx-auto grid w-full max-w-3xl flex-1 gap-10 px-4 py-10 sm:px-6 lg:max-w-5xl lg:grid-cols-[1fr_320px]">
        <div>
          {cooldownBlocked && (
            <div
              className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
              role="alert"
            >
              <p className="font-semibold text-[color:var(--ink)]">Practice test not available right now</p>
              <p className="mt-1 text-[color:var(--muted)]">{cooldownMessage}</p>
              <Link href="/mock" className="mt-3 inline-block text-[color:var(--accent)] hover:underline">
                ← Back to practice test home
              </Link>
            </div>
          )}
          <h1 className="text-xl font-semibold sm:text-2xl">Before you start</h1>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
            While your test is prepared, take a moment to write a few lines below. What you type is saved only in this
            browser for this session unless you use cloud features later.
          </p>

          <label className="mt-8 block">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--muted)]">
              Why the GMAT?
            </span>
            <textarea
              value={whyGmat}
              onChange={(e) => setWhyGmat(e.target.value)}
              rows={4}
              placeholder="Program types, timing, career pivot, scholarship aims…"
              className="mt-2 w-full rounded-lg border bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--ink)]"
              style={{ borderColor: 'var(--border)' }}
            />
          </label>

          <label className="mt-6 block">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--muted)]">
              Target countries & programs
            </span>
            <textarea
              value={targetSchools}
              onChange={(e) => setTargetSchools(e.target.value)}
              rows={3}
              placeholder="e.g. INSEAD / London Business School / Rotman / US M7…"
              className="mt-2 w-full rounded-lg border bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--ink)]"
              style={{ borderColor: 'var(--border)' }}
            />
          </label>

          <label className="mt-6 block">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--muted)]">
              Goals & constraints
            </span>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={3}
              placeholder="Score targets, timeline, work commitments, language context…"
              className="mt-2 w-full rounded-lg border bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--ink)]"
              style={{ borderColor: 'var(--border)' }}
            />
          </label>

          {!formOk && (
            <p className="mt-4 text-xs text-[color:var(--muted)]">
              Please write a bit more: at least a few sentences for “Why the GMAT?” and a short note for each of the
              other two boxes.
            </p>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canStart}
              onClick={onBegin}
              className="rounded-lg bg-[color:var(--accent)] px-8 py-3 text-sm font-semibold text-black disabled:opacity-40"
            >
              Start test
            </button>
            <Link
              href="/mock"
              className="rounded-lg border px-6 py-3 text-center text-sm font-semibold"
              style={{ borderColor: 'var(--border)' }}
            >
              Cancel
            </Link>
          </div>
        </div>

        <aside
          className="h-fit rounded-xl border bg-[color:var(--panel)] p-5 sm:p-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">
            While you wait
          </p>
          <p className="mt-3 font-mono text-3xl tabular-nums text-[color:var(--accent)]">
            {formatElapsed(elapsed)}
          </p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">Time on this page</p>

          <div
            className="mt-6 border-t pt-4 text-sm leading-relaxed"
            style={{ borderColor: 'var(--border)' }}
          >
            {prepStatus === 'loading' && (
              <p className="text-[color:var(--ink)]">Building your questions…</p>
            )}
            {prepStatus === 'ready' && (
              <p className="text-[color:var(--accent)]">{prepMessage}</p>
            )}
            {prepStatus === 'error' && <p className="text-orange-300">{prepMessage}</p>}
            {serverPrepMs != null && prepStatus === 'ready' && (
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                Ready in about {(serverPrepMs / 1000).toFixed(1)} seconds.
              </p>
            )}
          </div>

          <ul className="mt-4 space-y-2 text-xs text-[color:var(--muted)]">
            <li>• Quantitative — 21 questions · 45 minutes</li>
            <li>• Verbal — 23 questions · 45 minutes</li>
            <li>• Data Insights — 20 questions · 45 minutes</li>
          </ul>
        </aside>
      </main>
    </div>
  );
}
