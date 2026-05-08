'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThemeSwitcher } from '@/components/system/ThemeSwitcher';
import type {
  MockExamPayload,
  MockExamPoolItem,
  MockExamProfile,
  MockPerAnswer,
  MockSectionKey,
} from '@/lib/mock-exam-types';
import {
  MOCK_SECTION_COUNTS,
  MOCK_SECTION_LABELS,
  MOCK_SECTION_ORDER,
  MOCK_SECTION_SECONDS,
  MOCK_STORAGE_PAYLOAD,
  MOCK_STORAGE_PROFILE,
} from '@/lib/mock-exam-types';
import {
  buildMockReportQuestions,
  makeSeededRng,
  mockSectionWeightedSummary,
  pickNextAdaptiveItem,
  sectionScoresToTotal,
  shuffleChoicesForExam,
  thetaToSectionScore,
  updateThetaAfterItem,
} from '@/lib/mock-exam-cat';
import { saveMockLastResult } from '@/lib/mock-exam-history';
import { MockStemMd } from '@/components/mock/MockStemMd';

function formatClock(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

type Phase = 'active' | 'break' | 'results';

export function MockExamRunner() {
  const router = useRouter();
  const [payload, setPayload] = useState<MockExamPayload | null>(null);
  const [profile, setProfile] = useState<MockExamProfile | null>(null);
  const [phase, setPhase] = useState<Phase>('active');
  const [sectionIdx, setSectionIdx] = useState(0);
  const [answersBySection, setAnswersBySection] = useState<Record<MockSectionKey, MockPerAnswer[]>>({
    QUANT: [],
    VERBAL: [],
    DATA_INSIGHTS: [],
  });
  const [theta, setTheta] = useState(0);
  const [usedIds, setUsedIds] = useState<Set<string>>(() => new Set());
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [flagReview, setFlagReview] = useState(false);
  const [sectionDeadline, setSectionDeadline] = useState<number | null>(null);
  const [displayRemaining, setDisplayRemaining] = useState(MOCK_SECTION_SECONDS);
  const [breakRemaining, setBreakRemaining] = useState(60);
  const [finalThetaBySection, setFinalThetaBySection] = useState<Partial<Record<MockSectionKey, number>>>({});
  const questionStartRef = useRef(Date.now());
  const timerFiredRef = useRef(false);
  const lastResultSavedRef = useRef(false);

  const thetaRef = useRef(theta);
  const sectionIdxRef = useRef(sectionIdx);
  const phaseRef = useRef(phase);
  const answersLenRef = useRef(0);

  useEffect(() => {
    thetaRef.current = theta;
  }, [theta]);
  useEffect(() => {
    sectionIdxRef.current = sectionIdx;
  }, [sectionIdx]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    try {
      const p = sessionStorage.getItem(MOCK_STORAGE_PAYLOAD);
      const u = sessionStorage.getItem(MOCK_STORAGE_PROFILE);
      if (!p || !u) {
        router.replace('/mock/prep');
        return;
      }
      setPayload(JSON.parse(p) as MockExamPayload);
      setProfile(JSON.parse(u) as MockExamProfile);
    } catch {
      router.replace('/mock/prep');
    }
  }, [router]);

  const section = MOCK_SECTION_ORDER[sectionIdx]!;
  const pool = payload?.pools[section] ?? [];
  const need = MOCK_SECTION_COUNTS[section];
  const answers = answersBySection[section] ?? [];
  const salt = payload?.salt ?? '';

  useEffect(() => {
    answersLenRef.current = answers.length;
  }, [answers.length]);

  const catRng = useMemo(() => makeSeededRng(`${salt}:cat:${section}`), [salt, section]);

  useEffect(() => {
    if (!payload || phase !== 'active') return;
    const end = Date.now() + MOCK_SECTION_SECONDS * 1000;
    setSectionDeadline(end);
    setDisplayRemaining(MOCK_SECTION_SECONDS);
    timerFiredRef.current = false;
  }, [payload, phase, sectionIdx]);

  useEffect(() => {
    if (!sectionDeadline || phase !== 'active') return;
    const tick = () => {
      const rem = Math.ceil((sectionDeadline - Date.now()) / 1000);
      setDisplayRemaining(Math.max(0, rem));
      if (rem > 0 || timerFiredRef.current) return;
      timerFiredRef.current = true;
      const sec = MOCK_SECTION_ORDER[sectionIdxRef.current]!;
      const n = MOCK_SECTION_COUNTS[sec];
      const len = answersLenRef.current;
      const missed = Math.max(0, n - len);
      const penalized = thetaRef.current - 0.1 * missed - 0.05 * Math.max(0, missed - 1);
      const fin = Math.round(Math.max(-2.4, penalized) * 1000) / 1000;
      setFinalThetaBySection((prev) => ({ ...prev, [sec]: fin }));
      setCurrentItemId(null);
      if (sectionIdxRef.current < MOCK_SECTION_ORDER.length - 1) {
        setPhase('break');
        setBreakRemaining(60);
        setUsedIds(new Set());
        setTheta(0);
      } else {
        setPhase('results');
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [sectionDeadline, phase]);

  useEffect(() => {
    if (!payload || phase !== 'active') return;
    if (answers.length >= need) return;
    if (currentItemId) return;
    const picked = pickNextAdaptiveItem(pool, usedIds, theta, catRng);
    if (!picked) return;
    setCurrentItemId(picked.id);
    setUsedIds((prev) => new Set([...prev, picked.id]));
    setSelectedKey(null);
    setFlagReview(false);
    questionStartRef.current = Date.now();
  }, [payload, phase, pool, usedIds, theta, answers.length, need, currentItemId, catRng]);

  useEffect(() => {
    if (phase !== 'break') return;
    if (breakRemaining <= 0) {
      setSectionIdx((i) => i + 1);
      setTheta(0);
      setUsedIds(new Set());
      setCurrentItemId(null);
      setPhase('active');
      return;
    }
    const id = setTimeout(() => setBreakRemaining((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, breakRemaining]);

  const currentItem: MockExamPoolItem | null = useMemo(() => {
    if (!currentItemId) return null;
    return pool.find((q) => q.id === currentItemId) ?? null;
  }, [pool, currentItemId]);

  const shuffled = useMemo(() => {
    if (!currentItem || !salt) return null;
    const rng = makeSeededRng(`${salt}:sh:${section}:${currentItem.id}:${answers.length}`);
    return shuffleChoicesForExam(currentItem.choices, currentItem.correctText, rng);
  }, [currentItem, salt, section, answers.length]);

  const finalizeSectionBreakOrResults = useCallback(
    (nextAnswers: MockPerAnswer[], nextTheta: number) => {
      setFinalThetaBySection((prev) => ({ ...prev, [section]: nextTheta }));
      setCurrentItemId(null);
      if (sectionIdx < MOCK_SECTION_ORDER.length - 1) {
        setPhase('break');
        setBreakRemaining(60);
        setUsedIds(new Set());
        setTheta(0);
      } else {
        setPhase('results');
      }
    },
    [section, sectionIdx]
  );

  const submitAnswer = useCallback(() => {
    if (!currentItem || !shuffled) return;
    const selected = shuffled.choices.find((c) => c.key === selectedKey);
    const selectedText = selected?.text ?? null;
    const isCorrect = selectedText === currentItem.correctText;
    const timeMs = Math.max(1, Date.now() - questionStartRef.current);
    const row: MockPerAnswer = {
      itemId: currentItem.id,
      correctText: currentItem.correctText,
      selectedText,
      selectedKey: selectedKey,
      isCorrect,
      timeMs,
      flaggedReview: flagReview,
    };
    const nextTheta = updateThetaAfterItem(theta, isCorrect);
    const nextAnswers = [...answers, row];
    setTheta(nextTheta);
    setAnswersBySection((prev) => ({ ...prev, [section]: nextAnswers }));
    setCurrentItemId(null);

    if (nextAnswers.length >= need) {
      finalizeSectionBreakOrResults(nextAnswers, nextTheta);
    }
  }, [
    currentItem,
    shuffled,
    selectedKey,
    flagReview,
    theta,
    answers,
    section,
    need,
    finalizeSectionBreakOrResults,
  ]);

  const skipBreak = useCallback(() => setBreakRemaining(0), []);

  const scores = useMemo(() => {
    if (!payload) return null;
    const out: Record<MockSectionKey, { est: number; wta: number }> = {
      QUANT: { est: 60, wta: 0 },
      VERBAL: { est: 60, wta: 0 },
      DATA_INSIGHTS: { est: 60, wta: 0 },
    };
    for (const sec of MOCK_SECTION_ORDER) {
      const th = finalThetaBySection[sec] ?? 0;
      const poolSec = payload.pools[sec] ?? [];
      const ans = answersBySection[sec] ?? [];
      const { weightedAccPct } = mockSectionWeightedSummary(
        poolSec,
        ans.map((a) => ({ itemId: a.itemId, isCorrect: a.isCorrect }))
      );
      const fromTheta = thetaToSectionScore(th);
      const blended = Math.round(
        Math.min(90, Math.max(60, fromTheta * 0.72 + weightedAccPct * 0.28))
      );
      out[sec] = { est: blended, wta: weightedAccPct };
    }
    const total = sectionScoresToTotal(out.QUANT.est, out.VERBAL.est, out.DATA_INSIGHTS.est);
    return { out, total };
  }, [payload, finalThetaBySection, answersBySection]);

  useEffect(() => {
    if (phase !== 'results' || !scores || !payload || lastResultSavedRef.current) return;
    lastResultSavedRef.current = true;
    const report = buildMockReportQuestions(payload, answersBySection);
    saveMockLastResult({ total: scores.total, sections: scores.out, report });
  }, [phase, scores, payload, answersBySection]);

  if (!payload || !profile) {
    return (
      <div className="theme-vue flex min-h-screen items-center justify-center bg-[color:var(--bg)] text-[color:var(--muted)]">
        Loading your test…
      </div>
    );
  }

  if (phase === 'results' && scores) {
    return (
      <div className="theme-vue min-h-screen bg-[color:var(--bg)] font-sans text-[color:var(--ink)]">
        <header className="border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
          <div className="mx-auto flex max-w-3xl justify-between">
            <Link href="/mock" className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-80">
              ← Practice test home
            </Link>
            <ThemeSwitcher />
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-xl font-semibold">Your practice scores</h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Section scores use a 60–90-style scale; the total uses a 205–805-style band. For prep only—not from GMAC.
          </p>
          <ul className="mt-8 space-y-4">
            {MOCK_SECTION_ORDER.map((sec) => (
              <li
                key={sec}
                className="flex justify-between rounded-lg border px-4 py-3"
                style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
              >
                <span>{MOCK_SECTION_LABELS[sec]}</span>
                <span className="tabular-nums font-semibold">{scores.out[sec].est}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 font-mono text-3xl tabular-nums text-[color:var(--accent)]">
            Total · {scores.total}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/mock/report"
              className="rounded-lg border px-5 py-2.5 text-center text-sm font-semibold"
              style={{ borderColor: 'var(--border)' }}
            >
              Review all questions & answers
            </Link>
          </div>
          <div
            className="mt-10 rounded-lg border p-5 text-sm leading-relaxed"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--muted)]">
              Your notes
            </p>
            <p className="mt-2">
              <strong>Why GMAT:</strong> {profile.whyGmat}
            </p>
            <p className="mt-3">
              <strong>Targets:</strong> {profile.targetSchools}
            </p>
            <p className="mt-3">
              <strong>Goals:</strong> {profile.goals}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (phase === 'break') {
    const nextSec = MOCK_SECTION_ORDER[sectionIdx + 1];
    return (
      <div className="theme-vue flex min-h-screen flex-col items-center justify-center bg-[color:var(--bg)] px-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
          Optional break
        </p>
        <p className="mt-4 text-2xl font-semibold tabular-nums text-[color:var(--accent)]">{breakRemaining}s</p>
        {nextSec && (
          <p className="mt-4 max-w-md text-sm text-[color:var(--muted)]">
            Next: {MOCK_SECTION_LABELS[nextSec]} · {MOCK_SECTION_COUNTS[nextSec]} questions · 45 minutes
          </p>
        )}
        <button
          type="button"
          onClick={skipBreak}
          className="mt-8 rounded-lg bg-[color:var(--accent)] px-8 py-3 text-sm font-semibold text-black"
        >
          Skip break
        </button>
      </div>
    );
  }

  return (
    <div className="theme-vue flex min-h-screen flex-col bg-[color:var(--bg)] font-sans text-[color:var(--ink)]">
      <header
        className="flex flex-wrap items-center justify-between gap-3 border-b bg-[color:var(--panel)] px-4 py-3 sm:px-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
          GMAT™ Focus · practice test
        </div>
        <div className="font-mono text-sm tabular-nums">
          {MOCK_SECTION_LABELS[section]} · {formatClock(displayRemaining)}
        </div>
        <ThemeSwitcher />
      </header>

      <main className="flex flex-1 flex-col">
        <div className="border-b px-4 py-3 sm:px-8" style={{ borderColor: 'var(--border)' }}>
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Question <span className="text-[color:var(--ink)]">{answers.length + 1}</span> / {need}
          </p>
        </div>

        <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
          {currentItem && shuffled ? (
            <>
              <div className="sm:text-lg">
                <MockStemMd md={currentItem.stemMd} />
              </div>
              <fieldset className="mt-10 space-y-3">
                <legend className="sr-only">Answer choices</legend>
                {shuffled.choices.map((c) => (
                  <label
                    key={c.key}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 ${
                      selectedKey === c.key ? 'ring-2 ring-[color:var(--accent)]' : ''
                    }`}
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--panel)',
                    }}
                  >
                    <input
                      type="radio"
                      name="choice"
                      className="mt-1"
                      checked={selectedKey === c.key}
                      onChange={() => setSelectedKey(c.key)}
                    />
                    <span>
                      <span className="font-mono font-semibold tabular-nums">{c.key}.</span> {c.text}
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  type="button"
                  disabled={!selectedKey}
                  onClick={submitAnswer}
                  className="rounded-lg border px-8 py-3 font-semibold disabled:opacity-40"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => setFlagReview((f) => !f)}
                  className={`rounded-lg border px-6 py-3 font-semibold ${
                    flagReview ? 'text-[color:var(--accent)]' : 'text-[color:var(--muted)]'
                  }`}
                  style={{ borderColor: 'var(--border)' }}
                >
                  {flagReview ? 'Review marked' : 'Mark for review'}
                </button>
                <Link
                  href="/mock/prep"
                  className="rounded-lg px-4 py-3 text-sm text-[color:var(--muted)] underline-offset-4 hover:underline"
                >
                  Exit and lose progress
                </Link>
              </div>
            </>
          ) : (
            <p className="text-[color:var(--muted)]">Loading the next question…</p>
          )}
        </div>
      </main>

      <footer
        className="border-t px-4 py-2 text-center text-[10px] text-[color:var(--muted)] sm:text-xs"
        style={{ borderColor: 'var(--border)' }}
      >
        Questions adjust as you go · answers reshuffled each time · practice scores only
      </footer>
    </div>
  );
}
