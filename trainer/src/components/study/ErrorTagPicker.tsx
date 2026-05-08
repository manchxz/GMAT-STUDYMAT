'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { ERROR_TAG_OPTIONS, type ErrorTagId } from '@/lib/error-tags';

export type { ErrorTagId };

type Props = {
  open: boolean;
  onSubmit: (tag: ErrorTagId) => void;
  onSkip: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

export function ErrorTagPicker({ open, onSubmit, onSkip, returnFocusRef }: Props) {
  const [sel, setSel] = useState<ErrorTagId | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) setSel(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    const returnEl = returnFocusRef?.current ?? null;
    const t = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
    }, 10);
    return () => {
      window.clearTimeout(t);
      if (returnEl) returnEl.focus();
      else previouslyFocused.current?.focus?.();
    };
  }, [open, returnFocusRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, textarea, select'
      );
      if (!focusables.length) return;
      const list = [...focusables];
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onSkip]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="etag-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 sm:items-center"
    >
      <div ref={dialogRef} className="pane-shell w-full max-w-lg p-6">
        <h2 id="etag-title" className="text-lg font-semibold tracking-tight">
          What tripped you up?
        </h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Pick the closest reason. This builds your personal error log and does{' '}
          <strong className="font-medium text-[color:var(--ink)]">not</strong> change your score.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {ERROR_TAG_OPTIONS.map((t) => (
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
            onClick={() => {
              if (!sel) return;
              onSubmit(sel);
            }}
          >
            Save & next question
          </button>
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm opacity-75"
            style={{ borderColor: 'var(--border)' }}
            onClick={onSkip}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
