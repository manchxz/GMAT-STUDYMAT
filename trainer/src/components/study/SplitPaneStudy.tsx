'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PracticeItem } from '@/lib/practice-items';
import type { StudySectionFilter } from '@/lib/study-section';
import type { ConfidenceSelfRating } from '@/lib/study-routing-meta';
import { formatErrorTagLabel } from '@/lib/error-tags';
import { buildShuffledDisplayChoices } from '@/lib/shuffle-choices';
import { rewriteBankLettersToDisplay } from '@/lib/explanation-display-letters';
import { QuestionTimer } from './QuestionTimer';

function BoldParts({ text }: { text: string }) {
  const parts = text.split(/\*\*/);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-[color:var(--ink)]">
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function SolutionWalkthroughCard({ markdown }: { markdown: string }) {
  const blocks = markdown.trim().split(/\n\n+/);
  return (
    <div
      className="rounded-xl border px-5 py-4 text-sm leading-relaxed shadow-sm"
      style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      role="region"
      aria-label="Step-by-step explanation for the correct answer"
    >
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">
          Step-by-step explanation
        </p>
      <div className="space-y-4 text-[color:var(--ink)]">
        {blocks.filter(Boolean).map((block, i) => (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">
            <BoldParts text={block.trim()} />
          </p>
        ))}
      </div>
    </div>
  );
}

export type SessionAttemptLog = {
  questionId: string;
  skillCode: string;
  section: string;
  timeMs: number;
  isCorrect: boolean;
  selectedKey: string;
  confidence: ConfidenceSelfRating | null;
  errorTag: string | null;
  guessFlag: boolean;
  at: string;
};

export type AttemptFinalizePayload = {
  questionId: string;
  timeMs: number;
  selectedKey: string;
  isCorrect: boolean;
  wasFlaggedGuess: boolean;
  scaffoldStepsUsed: number;
  errorTag: string | null;
  confidence: ConfidenceSelfRating | null;
};

type StudyMeta = {
  sessionOrdinal: number;
  sessionTotal: number;
  sectionFilter: StudySectionFilter;
  routingExplanation: string;
  challengePercent: number;
  routingRank: number;
  textbookHref: string | null;
  sectionLabel: string;
  practiceBlockHint?: string | null;
};

type SprintRollupLite = {
  attempts: number;
  correct: number;
  avgTimeMs: number;
  panicGuessRate: number;
  overInvestRate: number;
};

type Props = {
  question: PracticeItem;
  meta: StudyMeta;
  sessionLog: SessionAttemptLog[];
  lastSprintRollup?: SprintRollupLite | null;
  onAttemptFinalize?: (payload: AttemptFinalizePayload) => Promise<void>;
  onExportSessionJson?: () => void;
};

const LEFT_FR_KEY = 'gmat_study_left_fr_v1';

export function SplitPaneStudy({
  question,
  meta,
  sessionLog,
  lastSprintRollup,
  onAttemptFinalize,
  onExportSessionJson,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [guessFlag, setGuessFlag] = useState(false);
  const elapsedMs = useRef(0);
  const [advancing, setAdvancing] = useState(false);
  const [leftFr, setLeftFr] = useState(58);
  const [lgLayout, setLgLayout] = useState(false);

  const dragRef = useRef<{ active: boolean } | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const displayChoices = useMemo(
    () => buildShuffledDisplayChoices(question.choices),
    [question.choices]
  );

  const breakdownForDisplay = useMemo(
    () => rewriteBankLettersToDisplay(question.breakdown, displayChoices),
    [question.breakdown, displayChoices]
  );

  const walkthroughForDisplay = useMemo(
    () =>
      question.solutionWalkthrough?.trim()
        ? rewriteBankLettersToDisplay(question.solutionWalkthrough, displayChoices)
        : '',
    [question.solutionWalkthrough, displayChoices]
  );

  const selectedBankKey =
    selected == null ? null : displayChoices.find((d) => d.displayKey === selected)?.bankKey ?? null;

  const timerActive = !submitted;
  const isCorrect = selectedBankKey != null && selectedBankKey === question.correctKey;
  const correctRow = displayChoices.find((d) => d.bankKey === question.correctKey);
  const correctAnswerLine = correctRow ? `${correctRow.displayKey} — ${correctRow.text}` : question.correctKey;

  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
    setGuessFlag(false);
    elapsedMs.current = 0;
  }, [question.routable.id]);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(LEFT_FR_KEY));
      if (!Number.isFinite(v)) return;
      setLeftFr(Math.min(78, Math.max(42, v)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LEFT_FR_KEY, String(leftFr));
    } catch {
      /* ignore */
    }
  }, [leftFr]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setLgLayout(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current?.active || !gridRef.current) return;
      const r = gridRef.current.getBoundingClientRect();
      const x = e.clientX - r.left;
      const pct = (x / r.width) * 100;
      setLeftFr(Math.min(78, Math.max(42, pct)));
    };
    const onUp = () => {
      if (dragRef.current) dragRef.current.active = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const scrollToReviewPane = () => {
    document.getElementById('study-context-pane')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleSubmit = () => {
    if (!selected || submitted) return;
    setSubmitted(true);
    queueMicrotask(() => scrollToReviewPane());
  };

  const finalizeAttempt = useCallback(
    async (errorTag: string | null) => {
      if (!submitted || !selected || advancing) return;
      setAdvancing(true);
      try {
        await onAttemptFinalize?.({
          questionId: question.routable.id,
          timeMs: Math.max(1, elapsedMs.current || 1000),
          selectedKey: selectedBankKey ?? selected,
          isCorrect: selectedBankKey === question.correctKey,
          wasFlaggedGuess: guessFlag,
          scaffoldStepsUsed: 0,
          errorTag,
          confidence: null,
        });
      } finally {
        setAdvancing(false);
      }
    },
    [
      advancing,
      guessFlag,
      onAttemptFinalize,
      question.correctKey,
      question.routable.id,
      selected,
      selectedBankKey,
      submitted,
    ]
  );

  const proceedNext = useCallback(() => {
    if (!submitted || !selected || advancing) return;
    void finalizeAttempt(null);
  }, [advancing, finalizeAttempt, selected, submitted]);

  const onTick = useCallback((s: number) => {
    elapsedMs.current = s * 1000;
  }, []);

  useEffect(() => {
    const taggable = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    };
    const onKey = (e: KeyboardEvent) => {
      if (taggable(e.target)) return;
      if (e.altKey && e.key.toLowerCase() === 'b' && submitted) {
        e.preventDefault();
        scrollToReviewPane();
        return;
      }
      if (e.key === 'Enter' && selected && !submitted) {
        e.preventDefault();
        handleSubmit();
        return;
      }
      if ((e.key === 'n' || e.key === 'N') && submitted) {
        e.preventDefault();
        proceedNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers close over fresh state via effect re-run
  }, [selected, submitted, proceedNext]);

  const sectionTitle =
    meta.sectionLabel ||
    (question.section === 'QUANT'
      ? 'Quantitative Reasoning'
      : question.section === 'VERBAL'
        ? 'Verbal Reasoning'
        : 'Data Insights');

  return (
    <div className="relative mx-auto max-w-[1600px] px-2 pb-10 pt-6 sm:px-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
          <span>
            Item <strong className="text-[color:var(--ink)]">{meta.sessionOrdinal}</strong> /{' '}
            <strong className="text-[color:var(--ink)]">{meta.sessionTotal}</strong>
          </span>
          <span className="opacity-40">·</span>
          <span>{sectionTitle}</span>
          {meta.practiceBlockHint ? (
            <>
              <span className="opacity-40 hidden sm:inline">·</span>
              <span className="hidden normal-case tracking-normal text-[color:var(--ink)] sm:inline">
                <BoldParts text={meta.practiceBlockHint} />
              </span>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/review"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)] underline-offset-4 hover:text-[color:var(--accent)] hover:underline"
          >
            Review mistakes →
          </Link>
          <Link
            href="/mock"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)] underline-offset-4 hover:text-[color:var(--accent)] hover:underline"
          >
            Full practice test →
          </Link>
          <Link
            href="/dashboard"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)] underline-offset-4 hover:text-[color:var(--accent)] hover:underline"
          >
            Dashboard →
          </Link>
          {onExportSessionJson && (
            <button
              type="button"
              onClick={onExportSessionJson}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--accent)]"
            >
              Export log JSON
            </button>
          )}
        </div>
      </div>

      {sessionLog.length > 0 && (
        <div
          className="mb-5 flex flex-wrap items-end gap-0.5"
          role="img"
          aria-label="Session pace: each bar is one completed question time"
        >
          {sessionLog.slice(-24).map((row) => {
            const h = Math.min(48, Math.max(4, row.timeMs / 2000));
            const err =
              !row.isCorrect && row.errorTag ? ` · ${formatErrorTagLabel(row.errorTag) ?? ''}` : '';
            return (
              <div
                key={`${row.questionId}-${row.at}`}
                title={`${row.questionId} · ${(row.timeMs / 1000).toFixed(1)}s · ${row.isCorrect ? '✓' : '✗'}${err}`}
                className="w-1.5 rounded-sm motion-reduce:transition-none"
                style={{
                  height: `${h}px`,
                  background: row.isCorrect ? 'rgba(20,184,166,0.75)' : 'rgba(249,115,22,0.6)',
                }}
              />
            );
          })}
        </div>
      )}

      <div
        ref={gridRef}
        className={`min-h-[calc(100vh-200px)] ${lgLayout ? 'grid gap-0' : 'flex flex-col gap-4'}`}
        style={
          lgLayout
            ? { gridTemplateColumns: `minmax(0,${leftFr}fr) 6px minmax(280px,${100 - leftFr}fr)` }
            : undefined
        }
      >
        <section className="pane-shell flex flex-col p-4 sm:p-6 lg:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--border)' }}>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-65">{sectionTitle}</p>
              <h1 className="mt-2 break-words font-semibold text-xl tracking-tight sm:text-2xl">
                {question.skillCode.replace(/_/g, ' ')}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-[color:var(--muted)]">
                <input
                  type="checkbox"
                  checked={guessFlag}
                  onChange={(e) => setGuessFlag(e.target.checked)}
                  className="h-4 w-4 accent-[color:var(--accent)]"
                />
                Timing guess?
              </label>
              <div
                className="flex items-center gap-2 rounded-full border px-3 py-1.5 sm:px-4"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">Time</span>
                <QuestionTimer key={question.routable.id} active={timerActive} onSecondsUpdate={onTick} />
              </div>
            </div>
          </header>

          <div className="mt-5 space-y-2 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Challenge vs your level
              </span>
              <span className="font-mono text-xs tabular-nums text-[color:var(--ink)]">
                {meta.challengePercent}%
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ background: 'var(--border)' }}
              role="meter"
              aria-valuenow={meta.challengePercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Rough sense of how hard this question is for you right now"
            >
              <div
                className="h-full rounded-full motion-reduce:transition-none"
                style={{
                  width: `${meta.challengePercent}%`,
                  background:
                    meta.challengePercent > 72
                      ? 'linear-gradient(90deg, var(--accent), #f97316)'
                      : 'var(--accent)',
                }}
              />
            </div>
            <p className="text-[color:var(--muted)] text-xs leading-relaxed">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] opacity-75">Why this question ·</span> Rank #
              {meta.routingRank + 1} in filtered pool · <BoldParts text={meta.routingExplanation} />
            </p>
            {meta.textbookHref && (
              <p className="text-xs">
                <Link
                  href={meta.textbookHref}
                  className="font-medium text-[color:var(--accent)] underline-offset-2 hover:underline"
                >
                  Open matching textbook chapter →
                </Link>
              </p>
            )}
          </div>

          <p className="mt-3 text-[10px] text-[color:var(--muted)]">
            Shortcuts: <kbd className="rounded border px-1 text-[9px]" style={{ borderColor: 'var(--border)' }}>Enter</kbd>{' '}
            submit · <kbd className="rounded border px-1 text-[9px]" style={{ borderColor: 'var(--border)' }}>Alt+B</kbd>{' '}
            focus review pane · <kbd className="rounded border px-1 text-[9px]" style={{ borderColor: 'var(--border)' }}>N</kbd>{' '}
            next question
          </p>

          <div className="flex flex-1 flex-col gap-6 py-8">
            <div className="font-study-body whitespace-pre-wrap text-[color:var(--ink)]">{question.stem}</div>

            <ol className="space-y-3">
              {displayChoices.map((c, idx) => {
                let border = 'var(--border)';
                if (submitted && c.bankKey === question.correctKey) border = '#14b8a6';
                else if (submitted && selected === c.displayKey && !isCorrect) border = '#f97316';

                return (
                  <li key={c.bankKey}>
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => setSelected(c.displayKey)}
                      className="flex w-full items-start gap-4 rounded-xl border px-4 py-3 text-left transition motion-reduce:transition-none disabled:opacity-95 sm:px-5 sm:py-4"
                      style={{
                        borderColor: selected === c.displayKey ? 'var(--accent)' : border,
                        background: selected === c.displayKey ? 'var(--accent-mute)' : 'transparent',
                      }}
                    >
                      <span className="font-mono text-sm opacity-65">{c.displayKey}.</span>
                      <span className="flex-1 text-[color:var(--ink)]">{c.text}</span>
                      {!submitted && idx < 5 && (
                        <span className="hidden font-mono text-[9px] text-[color:var(--muted)] sm:inline">
                          {idx + 1}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="flex flex-wrap gap-2 lg:hidden">
              <button
                type="button"
                disabled={!submitted}
                onClick={scrollToReviewPane}
                className="rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] disabled:opacity-30"
                style={{ borderColor: 'var(--border)' }}
              >
                Jump to review
              </button>
            </div>

            <div className="mt-auto flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!selected || submitted}
                onClick={handleSubmit}
                className="rounded-lg bg-[color:var(--accent)] px-6 py-3 font-semibold text-black disabled:opacity-35 sm:px-8"
              >
                Submit selection
              </button>
              {submitted ? (
                <button
                  type="button"
                  onClick={() => proceedNext()}
                  disabled={advancing}
                  className="rounded-lg border px-6 py-3 font-semibold disabled:opacity-45 sm:px-8"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {advancing ? 'Saving…' : 'Next item'}
                </button>
              ) : null}
            </div>

            <p className="text-[color:var(--muted)] text-xs leading-relaxed">
              Split view on desktop; after you submit, the review pane shows the correct answer, a short recap, and any
              step-by-step walkthrough.
            </p>
          </div>
        </section>

        {lgLayout && (
        <div
          className="relative z-10 cursor-col-resize select-none"
          onPointerDown={(e) => {
            e.preventDefault();
            dragRef.current = { active: true };
          }}
          style={{ touchAction: 'none' }}
          role="slider"
          aria-label="Resize study panels"
          aria-valuenow={Math.round(leftFr)}
          aria-valuemin={42}
          aria-valuemax={78}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setLeftFr((f) => Math.max(42, f - 2));
            if (e.key === 'ArrowRight') setLeftFr((f) => Math.min(78, f + 2));
          }}
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[color:var(--border)]" />
        </div>
        )}

        <aside
          id="study-context-pane"
          className="pane-shell flex max-h-[min(88vh,900px)] flex-col lg:sticky lg:top-6"
        >
          <div
            className="shrink-0 border-b px-4 py-4 text-center font-mono text-[11px] font-bold uppercase tracking-[0.35em] sm:px-5"
            style={{ borderColor: 'var(--border)', background: 'var(--accent-mute)' }}
          >
            Review
          </div>

          <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden p-0 lg:min-h-0">
            {lastSprintRollup && lastSprintRollup.attempts > 0 && (
              <div
                className="shrink-0 border-b px-4 py-3 text-xs leading-snug"
                style={{ borderColor: 'var(--border)', background: 'var(--accent-mute)' }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--muted)]">
                  Last 15-min window
                </p>
                <p className="mt-1 text-[color:var(--ink)]">
                  {lastSprintRollup.correct}/{lastSprintRollup.attempts} correct · avg{' '}
                  {(lastSprintRollup.avgTimeMs / 1000).toFixed(1)}s · panic-like{' '}
                  {(lastSprintRollup.panicGuessRate * 100).toFixed(0)}% · over-invested{' '}
                  {(lastSprintRollup.overInvestRate * 100).toFixed(0)}%
                </p>
              </div>
            )}
            <div className="custom-scroll min-h-[280px] flex-1 overflow-y-auto p-4 sm:p-6">
              {!submitted ? (
                <p className="text-sm leading-relaxed text-[color:var(--muted)]">
                  Choose an answer and submit to see which choice is correct, why it fits, and a worked explanation when
                  available.
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-65">
                    Answer review
                  </p>
                  <p className="text-sm leading-relaxed text-[color:var(--ink)]">
                    The correct answer is{' '}
                    <strong className={isCorrect ? 'text-teal-300' : 'text-orange-300'}>{correctAnswerLine}</strong>.
                  </p>
                  {walkthroughForDisplay ? (
                    <SolutionWalkthroughCard markdown={walkthroughForDisplay} />
                  ) : null}
                  <div className="whitespace-pre-wrap font-study-body text-[color:var(--ink)]">{breakdownForDisplay}</div>
                  <p className="text-sm text-[color:var(--muted)]">
                    You chose <strong>{selected ?? '—'}</strong>
                    {!isCorrect ? (
                      <>
                        {' '}
                        (correct: <strong>{correctRow?.displayKey ?? question.correctKey}</strong>)
                      </>
                    ) : null}
                    .
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
