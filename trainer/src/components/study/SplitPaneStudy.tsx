'use client';

import { useRef, useState } from 'react';
import type { DemoQuestion } from '@/lib/demo-questions';
import { classifyAttemptPace, shouldFlagPanicGuess, shouldFlagOverInvest } from '@/lib/time-analytics';
import { ConceptChatSidebar } from './ConceptChatSidebar';
import { ConceptScaffold } from './ConceptScaffold';
import { QuestionTimer } from './QuestionTimer';
import { ErrorTagPicker, type ErrorTagId } from './ErrorTagPicker';

type PaneTab = 'concept' | 'breakdown';

type Props = {
  question: DemoQuestion;
  recentAccuracy?: number;
  onAdvance?: () => void;
};

export function SplitPaneStudy({
  question,
  recentAccuracy = 0.62,
  onAdvance,
}: Props) {
  const [paneTab, setPaneTab] = useState<PaneTab>('concept');
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [guessFlag, setGuessFlag] = useState(false);
  const elapsedMs = useRef(0);
  const [scaffoldTouches, setScaffoldTouches] = useState(0);
  const [showErrorTags, setShowErrorTags] = useState(false);
  const [behaviorTagLogged, setBehaviorTagLogged] = useState<string | null>(null);

  const timerActive = !submitted;

  const isCorrect = selected === question.correctKey;

  const handleRevealBreakdown = () => {
    if (!submitted || !selected) return;
    setPaneTab('breakdown');
  };

  const handleSubmit = () => {
    if (!selected || submitted) return;
    setSubmitted(true);
    const tMs = Math.max(500, elapsedMs.current);
    const pace = classifyAttemptPace({
      timeMs: tMs || 1,
      timeTargetMs: question.timeTargetSec * 1000,
    });

    /** Dev console hook — swap for POST /api/attempts */
    console.info('[trainer] attempt', {
      questionId: question.routable.id,
      timeMs: tMs,
      selected,
      pace,
      panicFlag: guessFlag || shouldFlagPanicGuess({ timeMs: tMs || 1, selectedKey: selected, correctKey: question.correctKey, isCorrect }),
      overInvest: shouldFlagOverInvest({ timeMs: tMs || 1 }),
      scaffoldSteps: scaffoldTouches,
    });

    if (!isCorrect) setShowErrorTags(true);
    setPaneTab('breakdown');
  };

  const nextQuestion = () => {
    setSelected(null);
    setSubmitted(false);
    setGuessFlag(false);
    setScaffoldTouches(0);
    setBehaviorTagLogged(null);
    setShowErrorTags(false);
    setPaneTab('concept');
    onAdvance?.();
  };

  const onTick = (s: number) => {
    elapsedMs.current = s * 1000;
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-140px)] max-w-[1480px] gap-6 px-4 pb-10 pt-8 lg:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]">
      {/* ---------- Question column ---------- */}
      <section className="pane-shell flex flex-col p-6 lg:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-6" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-65">
              Zero-struggle pane · QUANT demo
            </p>
            <h1 className="mt-2 font-semibold text-2xl tracking-tight">{question.skillCode}</h1>
          </div>
          <div className="flex items-center gap-4 font-mono text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-[color:var(--muted)]">
              <input
                type="checkbox"
                checked={guessFlag}
                onChange={(e) => setGuessFlag(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--accent)]"
              />
              Timing guess?
            </label>
            <div className="flex items-center gap-2 rounded-full border px-4 py-1.5" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">Time</span>
              <QuestionTimer key={question.routable.id} active={timerActive} onSecondsUpdate={onTick} />
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-8 py-10">
          <div className="font-study-body whitespace-pre-wrap text-[color:var(--ink)]">{question.stem}</div>

          <ol className="space-y-3">
            {question.choices.map((c) => {
              let border = 'var(--border)';
              if (submitted && c.key === question.correctKey) border = '#14b8a6';
              else if (submitted && selected === c.key && !isCorrect) border = '#f97316';

              return (
                <li key={c.key}>
                  <button
                    type="button"
                    disabled={submitted}
                    onClick={() => setSelected(c.key)}
                    className="flex w-full items-start gap-4 rounded-xl border px-5 py-4 text-left transition disabled:opacity-95"
                    style={{
                      borderColor: selected === c.key ? 'var(--accent)' : border,
                      background:
                        selected === c.key ? 'var(--accent-mute)' : 'transparent',
                    }}
                  >
                    <span className="font-mono text-sm opacity-65">{c.key}.</span>
                    <span className="flex-1 text-[color:var(--ink)]">{c.text}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Mobile shortcut tabs — avoids hunting explanations */}
          <div className="flex flex-wrap gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setPaneTab('concept')}
              className="rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ borderColor: 'var(--border)' }}
            >
              Concept
            </button>
            <button
              type="button"
              disabled={!submitted}
              onClick={handleRevealBreakdown}
              className="rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] disabled:opacity-30"
              style={{ borderColor: 'var(--border)' }}
            >
              Breakdown
            </button>
          </div>

          <div className="mt-auto flex flex-wrap gap-4">
            <button
              type="button"
              disabled={!selected || submitted}
              onClick={handleSubmit}
              className="rounded-lg bg-[color:var(--accent)] px-8 py-3 font-semibold text-black disabled:opacity-35"
            >
              Submit selection
            </button>
            {submitted ? (
              <button
                type="button"
                onClick={nextQuestion}
                className="rounded-lg border px-8 py-3 font-semibold"
                style={{ borderColor: 'var(--border)' }}
              >
                Next item
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPaneTab('concept')}
                className="rounded-lg border px-8 py-3 font-semibold"
                style={{ borderColor: 'var(--border)' }}
              >
                Open scaffold →
              </button>
            )}
          </div>

          <p className="text-[color:var(--muted)] text-xs leading-relaxed">
            Desktop splits panes permanently. On narrow screens tap <strong>Concept</strong>
            {!submitted && ' · breakdown unlocks post-submit'}.
          </p>
        </div>
      </section>

      {/* ---------- Context / Explanation column ---------- */}
      <aside
        id="trainer-right-pane"
        className="pane-shell flex max-h-[calc(100vh-120px)] flex-col lg:sticky lg:top-6"
      >
        <div className="flex shrink-0 border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => setPaneTab('concept')}
            data-active={paneTab === 'concept'}
            className="flex-1 px-5 py-4 text-center font-mono text-[11px] font-bold uppercase tracking-[0.35em] data-[active=true]:bg-[color:var(--accent-mute)]"
          >
            Concept
          </button>
          <button
            type="button"
            onClick={() => submitted && setPaneTab('breakdown')}
            disabled={!submitted}
            data-active={paneTab === 'breakdown'}
            className="flex-1 px-5 py-4 text-center font-mono text-[11px] font-bold uppercase tracking-[0.35em] data-[active=true]:bg-[color:var(--accent-mute)] disabled:opacity-30"
          >
            Breakdown
          </button>
        </div>

        <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden p-0 lg:min-h-0">
          {paneTab === 'concept' ? (
            <div className="flex min-h-[min(72vh,620px)] flex-1 flex-col lg:max-h-[calc(100vh-140px)] lg:min-h-[480px] lg:flex-row">
              <div className="custom-scroll min-h-0 flex-1 overflow-y-auto p-6 lg:max-w-[56%]">
                <ConceptScaffold
                  key={question.routable.id}
                  eli5={question.concept.eli5}
                  expert={question.concept.expert}
                  recentAccuracy={recentAccuracy}
                  onLayerOpen={() => setScaffoldTouches((s) => s + 1)}
                />
              </div>
              <ConceptChatSidebar
                key={`chat-${question.routable.id}`}
                questionKey={question.routable.id}
                skillCode={question.skillCode}
                conceptEli5={question.concept.eli5}
                conceptExpert={question.concept.expert}
                submitted={submitted}
                className="min-h-[280px] shrink-0 border-t lg:min-h-0 lg:w-[min(420px,44%)] lg:border-l lg:border-t-0"
              />
            </div>
          ) : (
            <div className="custom-scroll min-h-[320px] flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-65">
                Full solution radar
              </p>
              <div className="whitespace-pre-wrap font-study-body text-[color:var(--ink)]">
                {question.breakdown}
              </div>
              {submitted && (
                <p className="text-sm text-[color:var(--muted)]">
                  You selected{' '}
                  <strong>{selected ?? '—'}</strong>. Correct key:{' '}
                  <strong className={isCorrect ? 'text-teal-300' : 'text-orange-300'}>{question.correctKey}</strong>
                  {behaviorTagLogged && (
                    <>
                      {' '}
                      · Logged behavior:{' '}
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
                        {behaviorTagLogged}
                      </span>
                    </>
                  )}
                </p>
              )}
              </div>
            </div>
          )}
        </div>
      </aside>

      <ErrorTagPicker
        open={showErrorTags && !behaviorTagLogged}
        onSkip={() => setShowErrorTags(false)}
        onSubmit={(tag) => {
          if (tag) setBehaviorTagLogged(tag);
          setShowErrorTags(false);
        }}
      />
    </div>
  );
}
