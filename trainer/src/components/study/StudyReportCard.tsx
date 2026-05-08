'use client';

import Link from 'next/link';
import type { StudyReportCardPayload } from '@/lib/study-report-scoring';

type Props = {
  data: StudyReportCardPayload;
  onRefresh?: () => void;
};

function Delta({ v }: { v: number }) {
  if (v === 0) return <span className="text-[color:var(--muted)]">·</span>;
  if (v > 0) return <span className="text-teal-300">+{v}</span>;
  return <span className="text-orange-300">{v}</span>;
}

export function StudyReportCard({ data, onRefresh }: Props) {
  const byKey = new Map(data.sections.map((s) => [s.section, s]));
  const ordered = data.studyOrder
    .map((k) => byKey.get(k))
    .filter((s): s is NonNullable<typeof s> => s != null);

  return (
    <section
      className="w-full rounded-2xl border px-4 py-5 sm:px-6 sm:py-6"
      style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      aria-label="Detailed practice report card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Report card · GMAT Focus–style practice scales
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--ink)]">{data.headlineSummary}</p>
          <div
            className="mt-4 rounded-xl border px-4 py-3 text-left"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[color:var(--muted)]">
              Estimated total (practice)
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-[color:var(--accent)]">
              {data.totalScoreEstimate}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-[color:var(--muted)]">
              Official GMAT Focus totals range 205–805 (tens). We average your three unofficial section
              estimates (60–90 each), equally weighted like the live exam structure.
            </p>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--muted)]">{data.scoreFootnote}</p>
          <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
            Item weights use your <strong className="text-[color:var(--ink)]">EASY·MID·HARD</strong> band and each
            question&apos;s <strong className="text-[color:var(--ink)]">difficulty</strong> so misses on harder items
            matter more—similar in spirit to adaptive emphasis, without copying GMAC scoring. Round deltas compare
            your last two completed <strong className="text-[color:var(--ink)]">tri-section</strong> sessions using
            those same weights.
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--accent)] hover:underline"
          >
            Refresh
          </button>
        )}
      </div>

      <ol className="mt-6 space-y-4">
        {ordered.map((s) => (
          <li
            key={s.section}
            className="rounded-xl border px-4 py-4 sm:px-5"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[color:var(--muted)]">
                  {s.label}
                </p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  Study priority{' '}
                  <span className="tabular-nums font-semibold text-[color:var(--ink)]">#{s.priorityRank}</span> of 3
                  {s.priorityRank === 1 && (
                    <span className="ml-2 rounded bg-[color:var(--accent)]/25 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--ink)]">
                      Focus first
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-semibold tabular-nums text-[color:var(--ink)]">{s.sectionScore}</span>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  est. section (60–90)
                </p>
              </div>
            </div>

            <dl className="mt-3 grid gap-2 text-[11px] leading-snug sm:grid-cols-2 lg:grid-cols-3">
              <div
                className="flex justify-between gap-3 rounded-lg border px-2.5 py-2"
                style={{ borderColor: 'var(--border)' }}
              >
                <dt className="text-[color:var(--muted)]">Difficulty-weighted acc.</dt>
                <dd className="tabular-nums font-medium text-[color:var(--ink)]">{s.weightedAccuracyPct}%</dd>
              </div>
              <div
                className="flex justify-between gap-3 rounded-lg border px-2.5 py-2"
                style={{ borderColor: 'var(--border)' }}
              >
                <dt className="text-[color:var(--muted)]">Lifetime (raw)</dt>
                <dd className="tabular-nums font-medium text-[color:var(--ink)]">
                  {s.correctLifetime}/{s.attemptsLifetime}
                </dd>
              </div>
              <div
                className="flex justify-between gap-3 rounded-lg border px-2.5 py-2"
                style={{ borderColor: 'var(--border)' }}
              >
                <dt className="text-[color:var(--muted)]">Lifetime weighted pts</dt>
                <dd className="tabular-nums font-medium text-[color:var(--ink)]">
                  {s.lifetimeWeightedCorrect.toFixed(1)}
                </dd>
              </div>
              <div
                className="flex justify-between gap-3 rounded-lg border px-2.5 py-2"
                style={{ borderColor: 'var(--border)' }}
              >
                <dt className="text-[color:var(--muted)]">Last round weighted pts</dt>
                <dd className="tabular-nums font-medium text-[color:var(--ink)]">{s.lastRoundWeightedCorrect}</dd>
              </div>
              <div
                className="flex justify-between gap-3 rounded-lg border px-2.5 py-2"
                style={{ borderColor: 'var(--border)' }}
              >
                <dt className="text-[color:var(--muted)]">Δ vs prior round</dt>
                <dd className="tabular-nums font-medium">
                  <Delta v={s.deltaVsPriorRound} />
                </dd>
              </div>
              <div
                className="flex justify-between gap-3 rounded-lg border px-2.5 py-2"
                style={{ borderColor: 'var(--border)' }}
              >
                <dt className="text-[color:var(--muted)]">Last round (raw)</dt>
                <dd className="tabular-nums font-medium text-[color:var(--ink)]">
                  {s.lastRoundCorrect}/{s.lastRoundAttempts}
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-xs leading-relaxed text-[color:var(--ink)]">{s.studyFocus}</p>

            <div className="mt-3">
              <Link
                href={s.textbookStartHref}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--accent)] hover:underline"
              >
                Open textbook chapter →
              </Link>
            </div>
          </li>
        ))}
      </ol>

      {(data.lastRoundEndedAt || data.priorRoundEndedAt) && (
        <p className="mt-4 font-mono text-[9px] text-[color:var(--muted)]">
          {data.lastRoundEndedAt && <>Last tri-section session: {new Date(data.lastRoundEndedAt).toLocaleString()}</>}
          {data.priorRoundEndedAt && (
            <>
              {' '}
              · Prior: {new Date(data.priorRoundEndedAt).toLocaleString()}
            </>
          )}
          {data.roundsCompared < 2 && (
            <span className="block pt-1">
              Fewer than two completed rounds on record — Δ vs prior will fill in after your next full round.
            </span>
          )}
        </p>
      )}
    </section>
  );
}

export type { StudyReportCardPayload } from '@/lib/study-report-scoring';
