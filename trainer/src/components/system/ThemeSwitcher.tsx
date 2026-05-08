'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function ThemeSwitcher() {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('gmat-focus-theme') as 'dark' | 'light' | null;
    if (stored) {
      setMode(stored);
      document.documentElement.classList.toggle('theme-light', stored === 'light');
    }
  }, []);

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('gmat-focus-theme', next);
    document.documentElement.classList.toggle('theme-light', next === 'light');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border px-5 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em]"
      style={{ borderColor: 'var(--border)' }}
    >
      Theme · {mode}
    </button>
  );
}
