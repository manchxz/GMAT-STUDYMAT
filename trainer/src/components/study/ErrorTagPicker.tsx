'use client';

import { useEffect, useMemo, useState } from 'react';

const ERROR_TAGS = [
  { id: 'MISREAD_PROMPT', label: 'Misread prompt' },
  { id: 'CARELESS_CALC', label: 'Calculation error' },
  { id: 'CONCEPT_GAP', label: 'Concept gap' },
  { id: 'TRAP_ANSWER', label: 'Trap answer' },
  { id: 'TIME_PRESSURE_GUESS', label: 'Time pressure guess' },
  { id: 'OVERCONFIDENT_SKIP_REVIEW', label: 'Skipped review' },
  { id: 'DS_LOGIC_ERROR', label: 'DS logic error' },
  { id: 'OTHER', label: 'Other' },
] as const;

export type ErrorTagId = (typeof ERROR_TAGS)[number]['id'];

type Props = {
  open: boolean;
  onSubmit: (tag: ErrorTagId | null) => void;
  onSkip: () => void;
};

export function ErrorTagPicker({ open, onSubmit, onSkip }: Props) {
  const [sel, setSel] = useState<ErrorTagId | null>(null);

  useEffect(() => {
    if (open) setSel(null);
  }, [open]);

  const picker = useMemo(() => ERROR_TAGS, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="etag-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 sm:items-center"
    >
      <div className="pane-shell w-full max-w-lg p-6">
        <h2 id="etag-title" className="font-semibold tracking-tight text-lg">
          What happened? <span className="font-normal opacity-75">Required for incorrect tries</span>
        </h2>
        <p className="mt-2 text-[color:var(--muted)] text-sm">
          Behavioral tags power your analytics radar — not punishment.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {picker.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSel(t.id)}
              className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                sel === t.id
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent-mute)]'
                  : 'border-[color:var(--border)] hover:border-[color:var(--accent)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!sel}
            className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onSubmit(sel)}
          >
            Log & continue
          </button>
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm opacity-75"
            style={{ borderColor: 'var(--border)' }}
            onClick={onSkip}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
