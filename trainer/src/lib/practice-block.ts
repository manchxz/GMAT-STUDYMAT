import type { PracticeTier as PrismaPracticeTier, Section } from '@prisma/client';
import type { StudySectionFilter } from '@/lib/study-section';

export type PracticeTier = 'EASY' | 'MID' | 'HARD';

export type SectionKey = 'QUANT' | 'VERBAL' | 'DATA_INSIGHTS';

export const TRI_SECTION_ROUND_COOLDOWN_MS = 5 * 60 * 1000;

export type PracticeStateV1 = {
  v: 1;
  sectionFilter: StudySectionFilter;
  queue: SectionKey[];
  index: number;
  tiers: Record<SectionKey, PracticeTier>;
  blockNumber: number;
  streakWrong: Record<SectionKey, number>;
  roundComplete?: boolean;
};

export function prismaSectionToKey(s: Section): SectionKey {
  if (s === 'DATA_INSIGHTS') return 'DATA_INSIGHTS';
  if (s === 'VERBAL') return 'VERBAL';
  return 'QUANT';
}

function emptyStreakWrong(): Record<SectionKey, number> {
  return { QUANT: 0, VERBAL: 0, DATA_INSIGHTS: 0 };
}

export function parsePracticeState(raw: unknown): PracticeStateV1 | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) return null;
  if (
    o.sectionFilter !== 'ALL' &&
    o.sectionFilter !== 'QUANT' &&
    o.sectionFilter !== 'VERBAL' &&
    o.sectionFilter !== 'DATA_INSIGHTS'
  ) {
    return null;
  }
  if (!Array.isArray(o.queue)) return null;
  const q = o.queue.filter(
    (x): x is SectionKey => x === 'QUANT' || x === 'VERBAL' || x === 'DATA_INSIGHTS'
  );
  if (q.length !== o.queue.length) return null;
  const tiers = o.tiers as Record<string, unknown>;
  if (!tiers || typeof tiers !== 'object') return null;
  const tk: Record<SectionKey, PracticeTier> = {
    QUANT: 'EASY',
    VERBAL: 'EASY',
    DATA_INSIGHTS: 'EASY',
  };
  for (const key of ['QUANT', 'VERBAL', 'DATA_INSIGHTS'] as const) {
    const t = tiers[key];
    if (t === 'EASY' || t === 'MID' || t === 'HARD') tk[key] = t;
  }
  const index = typeof o.index === 'number' && o.index >= 0 ? Math.floor(o.index) : 0;
  const blockNumber =
    typeof o.blockNumber === 'number' && o.blockNumber >= 0 ? Math.floor(o.blockNumber) : 0;
  const streakWrong = emptyStreakWrong();
  const sw = o.streakWrong;
  if (sw && typeof sw === 'object') {
    for (const key of ['QUANT', 'VERBAL', 'DATA_INSIGHTS'] as const) {
      const n = (sw as Record<string, unknown>)[key];
      if (typeof n === 'number' && n >= 0) streakWrong[key] = Math.floor(n);
    }
  }
  const roundComplete = o.roundComplete === true;
  return {
    v: 1,
    sectionFilter: o.sectionFilter as StudySectionFilter,
    queue: q,
    index,
    tiers: tk,
    blockNumber,
    streakWrong,
    roundComplete,
  };
}

export function shuffleQueue<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildSectionQueue(filter: StudySectionFilter): SectionKey[] {
  const n = 5;
  if (filter === 'ALL') {
    const parts: SectionKey[] = [
      ...Array(n).fill('QUANT'),
      ...Array(n).fill('VERBAL'),
      ...Array(n).fill('DATA_INSIGHTS'),
    ] as SectionKey[];
    return shuffleQueue(parts);
  }
  return Array(n).fill(filter) as SectionKey[];
}

export function initialTiers(): Record<SectionKey, PracticeTier> {
  return { QUANT: 'EASY', VERBAL: 'EASY', DATA_INSIGHTS: 'EASY' };
}

const TIER_ORDER: PracticeTier[] = ['EASY', 'MID', 'HARD'];

function stepTierHarder(tier: PracticeTier): PracticeTier {
  const i = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[Math.min(TIER_ORDER.length - 1, i + 1)]!;
}

function stepTierEasier(tier: PracticeTier): PracticeTier {
  const i = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[Math.max(0, i - 1)]!;
}

export function buildFreshPracticeState(filter: StudySectionFilter): PracticeStateV1 {
  return {
    v: 1,
    sectionFilter: filter,
    queue: buildSectionQueue(filter),
    index: 0,
    tiers: initialTiers(),
    blockNumber: 0,
    streakWrong: emptyStreakWrong(),
    roundComplete: false,
  };
}

export function advancePracticeStateAfterAttempt(
  prev: PracticeStateV1,
  answeredSection: SectionKey,
  isCorrect: boolean
): PracticeStateV1 {
  const tiers = { ...prev.tiers };
  const streakWrong = { ...prev.streakWrong };

  if (isCorrect) {
    streakWrong[answeredSection] = 0;
    tiers[answeredSection] = stepTierHarder(tiers[answeredSection]);
  } else {
    const sw = (streakWrong[answeredSection] ?? 0) + 1;
    if (sw >= 2) {
      tiers[answeredSection] = stepTierEasier(tiers[answeredSection]);
      streakWrong[answeredSection] = 0;
    } else {
      streakWrong[answeredSection] = sw;
    }
  }

  const index = prev.index + 1;
  const queue = prev.queue;

  if (index >= queue.length) {
    return {
      ...prev,
      queue,
      index: queue.length,
      tiers,
      streakWrong,
      blockNumber: prev.blockNumber + 1,
      roundComplete: true,
    };
  }

  return {
    ...prev,
    queue,
    index,
    tiers,
    streakWrong,
    blockNumber: prev.blockNumber,
    roundComplete: false,
  };
}

export function tierPrisma(t: PracticeTier): PrismaPracticeTier {
  return t as PrismaPracticeTier;
}

export function metaFromPracticeState(state: PracticeStateV1): {
  blockSize: number;
  blockIndex: number;
  blockNumber: number;
  currentSection: SectionKey;
  currentTier: PracticeTier;
  roundComplete?: boolean;
} {
  const qLen = state.queue.length;
  const atEnd = state.roundComplete || state.index >= qLen;
  const safeIdx = qLen > 0 ? Math.min(state.roundComplete ? qLen - 1 : state.index, qLen - 1) : 0;
  const currentSection = state.queue[safeIdx] ?? 'QUANT';
  return {
    blockSize: qLen,
    blockIndex: atEnd && qLen > 0 ? qLen - 1 : Math.max(0, safeIdx),
    blockNumber: state.blockNumber,
    currentSection,
    currentTier: state.tiers[currentSection],
    roundComplete: state.roundComplete,
  };
}

export function tierFallbackOrder(preferred: PracticeTier): PracticeTier[] {
  const map: Record<PracticeTier, PracticeTier[]> = {
    EASY: ['EASY', 'MID', 'HARD'],
    MID: ['MID', 'EASY', 'HARD'],
    HARD: ['HARD', 'MID', 'EASY'],
  };
  return map[preferred];
}
