import type { ErrorTagAnalytics } from '@/lib/error-tag-analytics';

type Props = {
  data: ErrorTagAnalytics;
};

export function ErrorTagAnalyticsSection({ data }: Props) {
  const top = data.buckets.slice(0, 5);
  const max = Math.max(1, ...top.map((b) => b.count));
  const monthLabel = new Date(data.windowStartIso).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <section
      className="mt-10 rounded-2xl border p-6 sm:p-8"
      style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      aria-labelledby="error-analytics-heading"
    >
      <h2 id="error-analytics-heading" className="text-sm font-semibold text-[color:var(--ink)]">
        Miss patterns
      </h2>
      <p className="mt-1 text-xs text-[color:var(--muted)]">
        From study misses in <strong className="text-[color:var(--ink)]">{monthLabel}</strong> (after you log what
        tripped you up).
      </p>

      {top.length === 0 ? (
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          No tagged misses this month yet. When you miss a question in the study lab, pick a quick reason—or skip—to
          build this view.
        </p>
      ) : (
        <>
          <ul className="mt-5 space-y-4" aria-label="Top error types">
            {top.map((b) => (
              <li key={b.tag}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-[color:var(--ink)]">{b.label}</span>
                  <span className="tabular-nums text-[color:var(--muted)]">{b.count}</span>
                </div>
                <div
                  className="mt-1.5 h-2 overflow-hidden rounded-full"
                  style={{ background: 'var(--border)' }}
                  role="presentation"
                >
                  <div
                    className="h-full rounded-full bg-[color:var(--accent)]/55"
                    style={{ width: `${Math.round((b.count / max) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-[color:var(--muted)]">
            Tagged misses: <strong className="text-[color:var(--ink)]">{data.taggedMissCount}</strong>
            {data.untaggedMissCount > 0 ? (
              <>
                {' '}
                · Skipped tag: <strong className="text-[color:var(--ink)]">{data.untaggedMissCount}</strong>
              </>
            ) : null}
          </p>
        </>
      )}
    </section>
  );
}
