import type { PracticeStateV1, PracticeTier, SectionKey } from '@/lib/practice-block';
import { PRACTICE_ITEMS, type PracticeItem } from '@/lib/practice-items';

function tierMatchesStaticDifficulty(tier: PracticeTier, difficulty: number): boolean {
  if (tier === 'EASY') return difficulty < 0.5;
  if (tier === 'MID') return difficulty >= 0.4 && difficulty < 0.72;
  return difficulty >= 0.65;
}

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)]!;
}

export function pickGuestPracticeItem(
  state: PracticeStateV1,
  excludedIds: Set<string>
): PracticeItem | null {
  if (state.roundComplete || state.index < 0 || state.index >= state.queue.length) return null;
  const sec = state.queue[state.index] as SectionKey;
  const tier = state.tiers[sec];
  const pool = PRACTICE_ITEMS.filter(
    (p) =>
      p.section === sec &&
      tierMatchesStaticDifficulty(tier, p.routable.difficulty) &&
      !excludedIds.has(p.routable.id)
  );
  const loose = PRACTICE_ITEMS.filter((p) => p.section === sec && !excludedIds.has(p.routable.id));
  return pickRandom(pool) ?? pickRandom(loose);
}
