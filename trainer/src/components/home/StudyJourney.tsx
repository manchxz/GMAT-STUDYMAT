import Link from 'next/link';
import { STUDY_PLAN_FEATURE_LABELS } from '@/lib/study-plan-features';

export type StudyJourneySnapshot = {
  hasDiagnostic: boolean;
  modulesCompleted: number;
  totalCoreModules: number;
  studyPlanTeaser?: string | null;
};

export function StudyJourney({
  hasDiagnostic,
  modulesCompleted,
  totalCoreModules,
  studyPlanTeaser,
}: StudyJourneySnapshot) {
  const planBodyDefault = `Your progress dashboard lists what to read next, chapter by chapter (${modulesCompleted}/${totalCoreModules} core modules marked done so far).`;
  const planBody = studyPlanTeaser?.trim() ? studyPlanTeaser.trim() : planBodyDefault;

  const steps = [
    {
      key: 'diagnostic',
      n: 1,
      title: 'Take the diagnostic',
      body: 'Get a baseline before you drill—linked from the textbook.',
      href: '/textbook/extras/diagnostic.html',
      done: hasDiagnostic,
      cta: 'Open diagnostic',
      planBullets: null as string[] | null,
    },
    {
      key: 'plan',
      n: 2,
      title: 'Check your study plan',
      body: planBody,
      href: '/dashboard#your-study-plan',
      done: modulesCompleted >= 3,
      cta: 'Open dashboard',
      planBullets: STUDY_PLAN_FEATURE_LABELS,
    },
    {
      key: 'study',
      n: 3,
      title: 'Study lab',
      body: 'Adaptive practice with instant review and error tagging on misses.',
      href: '/study',
      done: false,
      cta: 'Start study lab',
      planBullets: null,
    },
    {
      key: 'mock',
      n: 4,
      title: 'Full practice test',
      body: 'Timed Quant, Verbal, and Data Insights in one sitting.',
      href: '/mock',
      done: false,
      cta: 'Start practice test',
      planBullets: null,
    },
    {
      key: 'review',
      n: 5,
      title: 'Review mistakes',
      body: 'Missed drill items (signed in) and your last practice test on this device.',
      href: '/review',
      done: false,
      cta: 'Open review hub',
      planBullets: null,
    },
  ] as const;

  return (
    <section
      className="rounded-2xl border p-6 sm:p-8"
      style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      aria-labelledby="study-journey-title"
    >
      <h2 id="study-journey-title" className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
        Your study path
      </h2>
      <p className="mt-2 text-sm text-[color:var(--muted)]">
        A simple order that matches how most learners use this course—adjust as you like.
      </p>
      <ol className="mt-6 space-y-4">
        {steps.map((s) => (
          <li
            key={s.key}
            className="flex flex-wrap items-start gap-4 border-t pt-4 first:border-t-0 first:pt-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold"
              style={{
                borderColor: s.done ? 'rgba(45,212,191,0.45)' : 'var(--border)',
                background: s.done ? 'rgba(45,212,191,0.12)' : 'var(--bg)',
                color: 'var(--ink)',
              }}
              aria-hidden
            >
              {s.done ? '✓' : s.n}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[color:var(--ink)]">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted)]">{s.body}</p>
              {s.planBullets && s.planBullets.length > 0 ? (
                <div className="mt-3 rounded-lg border px-3 py-3 sm:px-4" style={{ borderColor: 'var(--border)', background: 'var(--accent-mute)' }}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                    What this step includes
                  </p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-[color:var(--ink)]">
                    {s.planBullets.map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Link
                href={s.href}
                className="mt-2 inline-block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)] underline-offset-4 hover:underline"
              >
                {s.cta} →
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
