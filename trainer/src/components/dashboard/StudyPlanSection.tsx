import Link from 'next/link';
import type { ReactNode } from 'react';
import type { DiagnosticChapterRow } from '@/lib/study-advice';

export type StudyPlanSectionProps = {
  hasDiagnostic: boolean;
  diagnosticRanking: DiagnosticChapterRow[];
  headline: string;
  completedChapterIds: string[];
  coreChapterIds: readonly string[];
  chapterNames: Record<string, string>;
  chapterLinks: Record<string, string>;
  appendixHref: string;
  appendixDone: boolean;
  latestDiag: null | {
    correct: number;
    total: number;
    scorePct: number;
    takenAtIso: string;
  };
  modulesCompleted: number;
  totalCoreModules: number;
};

function Subheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">{children}</h3>
  );
}

function Helper({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">{children}</p>;
}

export function StudyPlanSection({
  hasDiagnostic,
  diagnosticRanking,
  headline,
  completedChapterIds,
  coreChapterIds,
  chapterNames,
  chapterLinks,
  appendixHref,
  appendixDone,
  latestDiag,
  modulesCompleted,
  totalCoreModules,
}: StudyPlanSectionProps) {
  const doneSet = new Set(completedChapterIds);

  return (
    <section
      id="your-study-plan"
      className="scroll-mt-28 rounded-2xl border p-6 sm:p-8"
      style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      aria-labelledby="your-study-plan-heading"
    >
      <h2 id="your-study-plan-heading" className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
        Your study plan
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--ink)]">
        Five capabilities in one place: what to study first from your diagnostic, your chapter checklist, your next
        step in plain language, a progress snapshot, and quick links into practice.
      </p>

      <div className="mt-10 border-t pt-8" style={{ borderColor: 'var(--border)' }}>
        <Subheading>1 · Diagnostic-driven priorities</Subheading>
        <Helper>
          Core chapters ranked by your last diagnostic (weakest first). Open the matching textbook lesson to shore up
          gaps.
        </Helper>
        {diagnosticRanking.length > 0 ? (
          <ol className="mt-4 space-y-3">
            {diagnosticRanking.map((row, idx) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: 'var(--border)',
                  background: idx === 0 ? 'var(--accent-mute)' : 'var(--bg)',
                }}
              >
                <div>
                  <span className="font-mono text-[10px] tabular-nums text-[color:var(--muted)]">
                    #{idx + 1} weakest
                  </span>
                  <p className="mt-0.5 font-medium text-[color:var(--ink)]">
                    Ch. {row.id} · {row.name}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    {Math.round(row.pct * 100)}% correct on diagnostic ({row.correct}/{row.total} items)
                  </p>
                </div>
                {chapterLinks[row.id] ? (
                  <Link
                    href={chapterLinks[row.id]}
                    className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-teal-400"
                  >
                    Open chapter →
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <div
            className="mt-4 rounded-xl border px-4 py-5 text-sm leading-relaxed"
            style={{ borderColor: 'var(--border)', background: 'var(--accent-mute)' }}
          >
            {hasDiagnostic ? (
              <p className="text-[color:var(--muted)]">
                Your last diagnostic didn’t include per-chapter detail we can rank. Take a fresh run in the textbook when
                you’re ready, or use the chapter checklist below in numerical order.
              </p>
            ) : (
              <p className="text-[color:var(--muted)]">
                Take the{' '}
                <Link href="/textbook/extras/diagnostic.html" className="font-semibold text-[color:var(--accent)]">
                  full diagnostic
                </Link>{' '}
                while signed in so we can highlight your weakest chapters automatically.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-10 border-t pt-8" style={{ borderColor: 'var(--border)' }}>
        <Subheading>2 · Chapter checklist</Subheading>
        <Helper>All ten core modules plus the trap library appendix—tap Open to study or review that lesson.</Helper>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {coreChapterIds.map((id) => {
            const done = doneSet.has(id);
            const name = chapterNames[id] ?? `Chapter ${id}`;
            return (
              <li
                key={id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm"
                style={{ borderColor: 'var(--border)', opacity: done ? 1 : 0.88 }}
              >
                <span className="min-w-0">
                  <span className="text-[color:var(--muted)]">{done ? '✓' : '○'}</span>{' '}
                  <span className="font-medium text-[color:var(--ink)]">Ch. {id}</span>
                  <span className="text-xs text-[color:var(--muted)]"> · {name}</span>
                </span>
                {chapterLinks[id] ? (
                  <Link href={chapterLinks[id]} className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--accent)]">
                    Open
                  </Link>
                ) : null}
              </li>
            );
          })}
          <li
            className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm sm:col-span-2"
            style={{ borderColor: 'var(--border)', opacity: appendixDone ? 1 : 0.88 }}
          >
            <span>
              <span className="text-[color:var(--muted)]">{appendixDone ? '✓' : '○'}</span>{' '}
              <span className="font-medium text-[color:var(--ink)]">Appendix</span>
              <span className="ml-1 text-xs text-[color:var(--muted)]">Trap library</span>
            </span>
            <Link href={appendixHref} className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--accent)]">
              Open
            </Link>
          </li>
        </ul>
        <div className="mt-4">
          <Link href="/textbook/index.html" className="text-sm font-semibold text-[color:var(--accent)]">
            Full textbook index →
          </Link>
        </div>
      </div>

      <div className="mt-10 border-t pt-8" style={{ borderColor: 'var(--border)' }}>
        <Subheading>3 · Plain-language next step</Subheading>
        <Helper>One coaching line from your progress and diagnostic—your main “do this next” cue.</Helper>
        <p
          className="mt-4 rounded-xl border px-5 py-4 text-[color:var(--ink)] leading-relaxed"
          style={{ borderColor: 'var(--border)', background: 'var(--accent-mute)' }}
        >
          {headline}
        </p>
      </div>

      <div className="mt-10 border-t pt-8" style={{ borderColor: 'var(--border)' }}>
        <Subheading>4 · Progress snapshot</Subheading>
        <Helper>Diagnostic score, chapter completion, and appendix at a glance.</Helper>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Diagnostic</p>
            {latestDiag ? (
              <>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-[color:var(--ink)]">
                  {latestDiag.correct}/{latestDiag.total}
                </p>
                <p className="text-sm text-[color:var(--muted)]">{latestDiag.scorePct}% weighted score</p>
                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  {new Date(latestDiag.takenAtIso).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                No diagnostic on file.{' '}
                <Link href="/textbook/extras/diagnostic.html" className="font-semibold text-[color:var(--accent)]">
                  Take it here →
                </Link>
              </p>
            )}
          </div>
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Core modules</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-[color:var(--ink)]">
              {modulesCompleted}/{totalCoreModules}
            </p>
            <p className="text-sm text-[color:var(--muted)]">chapters marked complete</p>
            <p className="mt-3 text-xs text-[color:var(--muted)]">
              Trap library appendix:{' '}
              <strong className={appendixDone ? 'text-teal-400' : 'text-[color:var(--ink)]'}>
                {appendixDone ? 'Done' : 'Not marked yet'}
              </strong>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t pt-8" style={{ borderColor: 'var(--border)' }}>
        <Subheading>5 · Jump to practice</Subheading>
        <Helper>Same “control room” links—no hunting through menus.</Helper>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/study"
            className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-black"
          >
            Study lab
          </Link>
          <Link
            href="/review"
            className="rounded-lg border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: 'var(--border)' }}
          >
            Review hub
          </Link>
          <Link
            href="/mock"
            className="rounded-lg border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: 'var(--border)' }}
          >
            Practice test
          </Link>
          <Link
            href="/textbook/index.html"
            className="rounded-lg border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: 'var(--border)' }}
          >
            Textbook
          </Link>
        </div>
      </div>
    </section>
  );
}
