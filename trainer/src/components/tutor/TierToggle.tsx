'use client';

export type Tier = 'ELI5' | 'EXPERT';

interface Props {
  value: Tier;
  onChange: (t: Tier) => void;
}

export default function TierToggle({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      className="inline-flex rounded-md p-0.5 text-xs font-medium"
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
      }}
    >
      {(['ELI5', 'EXPERT'] as const).map((t) => {
        const active = value === t;
        return (
          <button
            key={t}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t)}
            className="rounded px-2.5 py-1 transition"
            style={{
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? '#fff' : 'var(--muted)',
            }}
          >
            {t === 'ELI5' ? 'ELI5' : 'Expert'}
          </button>
        );
      })}
    </div>
  );
}
