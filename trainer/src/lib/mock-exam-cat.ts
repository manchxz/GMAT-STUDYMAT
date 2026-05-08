import type { MockExamPayload, MockExamPoolItem, MockPerAnswer, MockSectionKey } from '@/lib/mock-exam-types';
import { MOCK_SECTION_ORDER } from '@/lib/mock-exam-types';

export function makeSeededRng(seedStr: string, counter = 0): () => number {
  let h = 2166136261 ^ counter;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

export function updateThetaAfterItem(theta: number, correct: boolean): number {
  const delta = correct ? 0.18 : -0.22;
  return Math.round(Math.max(-2.4, Math.min(2.4, theta + delta)) * 1000) / 1000;
}

export function pickNextAdaptiveItem(
  pool: MockExamPoolItem[],
  usedIds: Set<string>,
  theta: number,
  rng: () => number
): MockExamPoolItem | null {
  const avail = pool.filter((x) => !usedIds.has(x.id));
  if (!avail.length) return null;
  const target = theta + 0.38;
  const scored = avail.map((q) => ({
    q,
    gap: Math.abs(q.difficulty - target),
  }));
  scored.sort((a, b) => a.gap - b.gap);
  const bestGap = scored[0].gap;
  const ties = scored.filter((s) => s.gap <= bestGap + 0.12).map((s) => s.q);
  return ties[Math.floor(rng() * ties.length)]!;
}

export function thetaToSectionScore(theta: number): number {
  const p = 1 / (1 + Math.exp(-theta));
  const raw = 60 + 30 * p;
  return Math.round(Math.min(90, Math.max(60, raw)));
}

export function sectionScoresToTotal(q: number, v: number, di: number): number {
  const avg = (q + v + di) / 3;
  const unrounded = 205 + ((avg - 60) / 30) * 600;
  const bin = Math.round((unrounded - 205) / 10);
  return Math.min(805, Math.max(205, 205 + bin * 10));
}

export function difficultyWeightForMock(difficulty: number): number {
  const d = Math.max(-1.2, Math.min(2.5, difficulty));
  const diffBoost = 1 + d * 0.12;
  return Math.round(diffBoost * 1000) / 1000;
}

export function mockSectionWeightedSummary(
  items: MockExamPoolItem[],
  answers: { itemId: string; isCorrect: boolean }[]
): { weightedAccPct: number; volumeWt: number } {
  const byId = new Map(items.map((x) => [x.id, x]));
  let wAttempt = 0;
  let wCorrect = 0;
  for (const a of answers) {
    const it = byId.get(a.itemId);
    if (!it) continue;
    const w = difficultyWeightForMock(it.difficulty);
    wAttempt += w;
    if (a.isCorrect) wCorrect += w;
  }
  const weightedAccPct =
    wAttempt > 0 ? Math.round((100 * wCorrect) / wAttempt) : 0;
  return { weightedAccPct, volumeWt: wCorrect };
}

export function shuffleChoicesForExam(
  choices: { key: string; text: string }[],
  correctText: string,
  rng: () => number
): { choices: { key: string; text: string }[]; displayCorrectKey: string } {
  const texts = choices.map((c) => c.text);
  const arr = [...texts];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const KEYS = ['A', 'B', 'C', 'D', 'E'];
  const out = arr.map((text, i) => ({ key: KEYS[i]!, text }));
  const displayCorrectKey = out.find((c) => c.text === correctText)?.key ?? 'A';
  return { choices: out, displayCorrectKey };
}

export type MockReportQuestionRow = {
  itemId: string;
  stemMd: string;
  displayChoices: { key: string; text: string }[];
  displayCorrectKey: string;
  selectedKey: string | null;
  selectedText: string | null;
  isCorrect: boolean;
  flaggedReview: boolean;
  timeMs: number;
};

export function buildMockReportQuestions(
  payload: MockExamPayload,
  answersBySection: Record<MockSectionKey, MockPerAnswer[]>
): Record<MockSectionKey, MockReportQuestionRow[]> {
  const salt = payload.salt;
  const out = {} as Record<MockSectionKey, MockReportQuestionRow[]>;
  for (const sec of MOCK_SECTION_ORDER) {
    const pool = payload.pools[sec] ?? [];
    const byId = new Map<string, MockExamPoolItem>(pool.map((x) => [x.id, x]));
    const ans = answersBySection[sec] ?? [];
    out[sec] = ans.map((a, i) => {
      const item = byId.get(a.itemId);
      if (!item) {
        return {
          itemId: a.itemId,
          stemMd: '_Question data is no longer available for this item._',
          displayChoices: [],
          displayCorrectKey: '',
          selectedKey: a.selectedKey,
          selectedText: a.selectedText,
          isCorrect: a.isCorrect,
          flaggedReview: a.flaggedReview,
          timeMs: a.timeMs,
        };
      }
      const rng = makeSeededRng(`${salt}:sh:${sec}:${item.id}:${i}`);
      const shuffled = shuffleChoicesForExam(item.choices, item.correctText, rng);
      return {
        itemId: a.itemId,
        stemMd: item.stemMd,
        displayChoices: shuffled.choices,
        displayCorrectKey: shuffled.displayCorrectKey,
        selectedKey: a.selectedKey,
        selectedText: a.selectedText,
        isCorrect: a.isCorrect,
        flaggedReview: a.flaggedReview,
        timeMs: a.timeMs,
      };
    });
  }
  return out;
}

export function mapBankSection(s: string): MockSectionKey {
  if (s === 'VERBAL') return 'VERBAL';
  if (s === 'DATA_INSIGHTS') return 'DATA_INSIGHTS';
  return 'QUANT';
}
