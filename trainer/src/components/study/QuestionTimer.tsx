'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  active: boolean;
  onSecondsUpdate?: (secs: number) => void;
  className?: string;
};

export function QuestionTimer({ active, onSecondsUpdate, className }: Props) {
  const started = useRef<number | null>(null);
  const [secs, setSecs] = useState(0);
  const prevActive = useRef(active);

  useEffect(() => {
    let id: ReturnType<typeof setInterval>;

    const tick = () => {
      if (!active || started.current === null) return;
      const s = Math.floor((performance.now() - started.current) / 1000);
      setSecs(s);
      onSecondsUpdate?.(s);
    };

    if (active) {
      started.current = performance.now();
      id = setInterval(tick, 500);
      tick();
    }

    return () => {
      if (id) clearInterval(id);
    };
  }, [active, onSecondsUpdate]);

  useEffect(() => {
    if (prevActive.current && !active && started.current !== null) {
      const s = Math.floor((performance.now() - started.current) / 1000);
      onSecondsUpdate?.(s);
    }
    prevActive.current = active;
  }, [active, onSecondsUpdate]);

  useEffect(() => {
    if (!active) setSecs(0);
  }, [active]);

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <div className={`font-mono text-sm tabular-nums ${className ?? ''}`}>
      {mm}:{ss}
    </div>
  );
}
