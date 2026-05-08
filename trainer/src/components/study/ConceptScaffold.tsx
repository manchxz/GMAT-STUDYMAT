'use client';

import { useEffect, useState } from 'react';
import { buildScaffoldSequence, maxVisibleScaffoldLayers } from '@/lib/scaffold-policy';

type Props = {
  eli5: string;
  expert: string;
  recentAccuracy: number;
  userHintCap?: number;
  onLayerOpen?: () => void;
};

export function ConceptScaffold({
  eli5,
  expert,
  recentAccuracy,
  userHintCap = 3,
  onLayerOpen,
}: Props) {
  const steps = maxVisibleScaffoldLayers(recentAccuracy, userHintCap);
  const seq = buildScaffoldSequence({ eli5, expert }, steps);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
  }, [eli5, expert, recentAccuracy]);

  const handleMore = () => {
    setRevealed((r) => Math.min(seq.length - 1, r + 1));
    onLayerOpen?.();
  };

  const visibleLayers = seq.slice(0, Math.min(seq.length, revealed + 1));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-65">
            Contextual help · no answer spoilers
          </p>
          <p className="mt-1 text-[color:var(--muted)] text-sm">
            Mastery fades the fluff: your recent accuracy sits at{' '}
            <strong className="text-[color:var(--ink)]">
              {(recentAccuracy * 100).toFixed(0)}%
            </strong>
            {' — '}max scaffolding depth:{' '}
            <strong>{steps}</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMore}
          disabled={revealed >= seq.length - 1}
          className="shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] disabled:opacity-35"
          style={{ borderColor: 'var(--border)' }}
        >
          Deeper scaffold
        </button>
      </div>

      {visibleLayers.length === 0 ? (
        <p className="text-sm text-[color:var(--muted)]">
          Scaffold locked — mastery is sky-high here. Dive straight into reps.
        </p>
      ) : (
        <div className="space-y-3">
          {visibleLayers.map((layer, idx) => (
            <article
              key={`${layer.layer}-${idx}`}
              className="rounded-xl border px-5 py-4 text-sm leading-relaxed"
              style={{
                borderColor: 'var(--border)',
                background:
                  layer.layer === 'eli5'
                    ? 'rgba(234,179,72,0.08)'
                    : 'rgba(20,184,166,0.08)',
              }}
            >
              <header className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] opacity-65">
                {layer.layer === 'eli5' ? 'ELI5' : 'Expert logic'}
              </header>
              <p className="whitespace-pre-wrap font-study-body text-[color:var(--ink)]">
                {layer.text}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
