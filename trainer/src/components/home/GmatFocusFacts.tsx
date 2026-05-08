const FACTS = [
  { label: 'Format', value: 'Computer-adaptive by question (CAT), 64 questions' },
  { label: 'Sections', value: 'Quantitative · Verbal · Data Insights (3 × 45 min)' },
  { label: 'Total time', value: '2 hours 15 minutes, plus optional breaks' },
  { label: 'Total score', value: '205–805 (GMAT Focus Edition)' },
  { label: 'Section scores', value: '60–90 per section' },
] as const;

export function GmatFocusFacts() {
  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border p-6"
      style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      aria-label="GMAT Focus Edition reference"
    >
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
          Exam reference
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--ink)]">GMAT Focus</h2>
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
          Key numbers candidates see on score reports and in the test driver. Always confirm details on{' '}
          <a
            href="https://www.mba.com/exams/gmat-focus-edition"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[color:var(--accent)] underline-offset-2 hover:underline"
          >
            mba.com
          </a>
          .
        </p>
      </div>
      <dl className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        {FACTS.map((row) => (
          <div key={row.label}>
            <dt className="font-mono text-[9px] uppercase tracking-[0.28em] text-[color:var(--muted)]">{row.label}</dt>
            <dd className="mt-1 text-sm leading-snug text-[color:var(--ink)]">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div
        className="rounded-xl border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[color:var(--muted)]"
        style={{ borderColor: 'var(--border)', background: 'var(--accent-mute)' }}
      >
        <span className="text-[color:var(--ink)]">Q 21</span>
        <span className="mx-2 opacity-40">|</span>
        <span className="text-[color:var(--ink)]">V 23</span>
        <span className="mx-2 opacity-40">|</span>
        <span className="text-[color:var(--ink)]">DI 20</span>
      </div>
    </section>
  );
}
