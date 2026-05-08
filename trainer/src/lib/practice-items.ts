import type { RoutableQuestion } from '@/lib/adaptive-router';

export type PracticeItem = {
  routable: RoutableQuestion;
  stem: string;
  choices: { key: string; text: string }[];
  correctKey: string;
  concept: { eli5: string; expert: string };
  breakdown: string;
  timeTargetSec: number;
  skillCode: string;
};

export const PRACTICE_ITEMS: PracticeItem[] = [
  {
    routable: {
      id: 'q-np-001',
      skillIds: ['NUMBER_PROPERTIES'],
      difficulty: 0.5,
      discrimination: 1.1,
      guessing: 0.2,
    },
    stem:
      'If `n` is a positive integer and `3n` is divisible by 5, which of the following must `n` be divisible by?',
    choices: [
      { key: 'A', text: '2' },
      { key: 'B', text: '3' },
      { key: 'C', text: '5' },
      { key: 'D', text: '15' },
      { key: 'E', text: 'Cannot be determined from the given info' },
    ],
    correctKey: 'C',
    concept: {
      eli5:
        'Imagine 3 buckets and 5 guests. If triple your pile groups perfectly into 5s, the leftover "3" part did not bring the 5 — your pile must hide a 5.',
      expert:
        'Prime factorization is unique. Since 5 divides `3n` and 5 does not divide 3, 5 divides `n`. This is the Fundamental Theorem of Arithmetic in motion.',
    },
    breakdown:
      '**Answer C.** `5 | 3n` ⇒ `5 ∤ 3`, so `5 | n`. The factor 5 cannot come from multiplying by 3, so `n` must supply it.',
    timeTargetSec: 90,
    skillCode: 'NUMBER_PROPERTIES',
  },
];
