export function GmatHeroVisual({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-6 ${className}`}
      style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full opacity-[0.07]"
        style={{ background: 'var(--accent)' }}
      />
      <div className="relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
          GMAT Focus Edition · at a glance
        </p>
        <svg viewBox="0 0 440 120" className="mt-4 h-auto w-full max-w-md" role="img">
          <title>Three exam sections and approximate timing</title>
          <line
            x1="0"
            y1="88"
            x2="440"
            y2="88"
            stroke="currentColor"
            className="text-[color:var(--border)]"
            strokeWidth="1"
          />
          <rect x="8" y="28" width="128" height="60" rx="4" fill="currentColor" className="text-[color:var(--accent)] opacity-90" />
          <text
            x="72"
            y="58"
            textAnchor="middle"
            fill="var(--bg)"
            style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', fontWeight: 600 }}
          >
            Q · 21
          </text>
          <text
            x="72"
            y="76"
            textAnchor="middle"
            fill="var(--bg)"
            fillOpacity={0.92}
            style={{ fontSize: '9px', fontFamily: 'var(--font-geist-mono), monospace' }}
          >
            45 min
          </text>
          <rect x="156" y="20" width="132" height="68" rx="4" fill="currentColor" className="text-[color:var(--muted)] opacity-35" />
          <text
            x="222"
            y="52"
            textAnchor="middle"
            fill="var(--ink)"
            style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', fontWeight: 600 }}
          >
            V · 23
          </text>
          <text
            x="222"
            y="70"
            textAnchor="middle"
            fill="var(--ink)"
            fillOpacity={0.85}
            style={{ fontSize: '9px', fontFamily: 'var(--font-geist-mono), monospace' }}
          >
            45 min
          </text>
          <rect x="308" y="36" width="124" height="52" rx="4" fill="currentColor" className="text-[color:var(--accent)] opacity-45" />
          <text
            x="370"
            y="60"
            textAnchor="middle"
            fill="var(--ink)"
            style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', fontWeight: 600 }}
          >
            DI · 20
          </text>
          <text
            x="370"
            y="76"
            textAnchor="middle"
            fill="var(--ink)"
            fillOpacity={0.85}
            style={{ fontSize: '9px', fontFamily: 'var(--font-geist-mono), monospace' }}
          >
            45 min
          </text>
        </svg>
        <div className="mt-2 flex items-center gap-3 border-t pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]" style={{ borderColor: 'var(--border)' }}>
          <span>64 items</span>
          <span className="opacity-40">·</span>
          <span>2h 15m seated</span>
        </div>
      </div>
    </div>
  );
}

export function GmatScoreScaleVisual({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      aria-hidden
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
        Total score scale
      </p>
      <svg viewBox="0 0 360 40" className="mt-3 h-10 w-full">
        <defs>
          <linearGradient id="gmatScoreBand" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--border)" stopOpacity="0.45" />
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--border)" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <rect x="4" y="14" width="352" height="6" rx="3" fill="url(#gmatScoreBand)" />
        <text x="8" y="34" fill="var(--muted)" style={{ fontSize: '10px', fontFamily: 'var(--font-geist-mono), monospace' }}>
          205
        </text>
        <text
          x="180"
          y="34"
          textAnchor="middle"
          fill="var(--muted)"
          style={{ fontSize: '10px', fontFamily: 'var(--font-geist-mono), monospace' }}
        >
          805
        </text>
        <text
          x="352"
          y="34"
          textAnchor="end"
          fill="var(--muted)"
          style={{ fontSize: '10px', fontFamily: 'var(--font-geist-mono), monospace' }}
        >
          Focus total
        </text>
      </svg>
      <p className="mt-2 text-[11px] leading-snug text-[color:var(--muted)]">
        Section scores are reported on a <strong className="text-[color:var(--ink)]">60–90</strong> scale; the total combines all three
        sections.
      </p>
    </div>
  );
}
