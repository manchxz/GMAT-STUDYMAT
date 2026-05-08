import type { RoutableQuestion } from '@/lib/adaptive-router';
import type { StudySectionFilter } from '@/lib/study-section';

export type PracticeItem = {
  section: Exclude<StudySectionFilter, 'ALL'>;
  routable: RoutableQuestion;
  stem: string;
  choices: { key: string; text: string }[];
  correctKey: string;
  concept: { eli5: string; expert: string; microHint?: string };
  breakdown: string;
  solutionWalkthrough?: string;
  timeTargetSec: number;
  skillCode: string;
  practiceTier?: 'EASY' | 'MID' | 'HARD' | null;
};

export const PRACTICE_ITEMS: PracticeItem[] = [
  {
    section: 'QUANT',
    routable: {
      id: 'q-np-001',
      skillIds: ['NUMBER_PROPERTIES'],
      difficulty: 0.18,
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
      microHint:
        '5 is prime. It cannot “come from” multiplying by 3 in `3n`, so it must appear in `n` itself.',
      eli5:
        'Imagine 3 buckets and 5 guests. If triple your pile groups perfectly into 5s, the leftover "3" part did not bring the 5 — your pile must hide a 5.',
      expert:
        'Prime factorization is unique. Since 5 divides `3n` and 5 does not divide 3, 5 divides `n`. This is the Fundamental Theorem of Arithmetic in motion.',
    },
    breakdown:
      '**Answer C.** `5 | 3n` ⇒ `5 ∤ 3`, so `5 | n`. The factor 5 cannot come from multiplying by 3, so `n` must supply it.',
    timeTargetSec: 90,
    skillCode: 'NUMBER_PROPERTIES',
    practiceTier: 'MID',
  },
  {
    section: 'QUANT',
    routable: {
      id: 'q-alg-002',
      skillIds: ['ALGEBRAIC_LOGIC'],
      difficulty: 0.52,
      discrimination: 1.0,
      guessing: 0.2,
    },
    stem:
      'For real `x`, if `x² − 5x + 6 = 0`, what is the sum of all distinct solutions for `x`?',
    choices: [
      { key: 'A', text: '2' },
      { key: 'B', text: '3' },
      { key: 'C', text: '5' },
      { key: 'D', text: '6' },
      { key: 'E', text: 'No real solutions' },
    ],
    correctKey: 'C',
    concept: {
      microHint: 'Sum of roots of `x² + bx + c = 0` is `−b`. Here `b = −5`.',
      eli5:
        'You are looking for bridge numbers that multiply to +6 and add to −5. Think (−2) and (−3): they fit, and you just add them for the sum Vieta promised.',
      expert:
        'Factor: `(x−2)(x−3)=0` ⇒ roots 2 and 3. For a monic quadratic `x²+bx+c`, the sum of roots equals `−b`. Here `−b = 5`.',
    },
    breakdown:
      '**Answer C.** Roots are 2 and 3; sum = 5 (Vieta: sum = −(−5) = 5).',
    timeTargetSec: 75,
    skillCode: 'ALGEBRAIC_LOGIC',
    practiceTier: 'HARD',
  },
  {
    section: 'QUANT',
    routable: {
      id: 'q-rate-003',
      skillIds: ['RATES_WORK'],
      difficulty: 0.02,
      discrimination: 1.05,
      guessing: 0.2,
    },
    stem:
      'Machine A makes 40 widgets per hour. Machine B makes 60 widgets per hour. Working together at these constant rates, how many hours do they need to produce 250 widgets?',
    choices: [
      { key: 'A', text: '2.0' },
      { key: 'B', text: '2.25' },
      { key: 'C', text: '2.5' },
      { key: 'D', text: '3.0' },
      { key: 'E', text: '3.5' },
    ],
    correctKey: 'C',
    concept: {
      microHint: 'Combined rate is the sum of the two rates; divide total work by that sum.',
      eli5:
        'Pour both machines into one “super speed”: forty plus sixty every hour. Divide the job (250) by that combined speed.',
      expert:
        'Combined rate `R = 40 + 60 = 100` widgets/hour. Time `T = Work/R = 250/100 = 2.5` hours.',
    },
    breakdown:
      '**Answer C.** Combined rate 100 w/h ⇒ `250/100 = 2.5` hours.',
    timeTargetSec: 95,
    skillCode: 'RATES_WORK',
    practiceTier: 'MID',
  },
  {
    section: 'QUANT',
    routable: {
      id: 'q-pct-004',
      skillIds: ['PERCENT_FRACTION'],
      difficulty: -0.82,
      discrimination: 0.95,
      guessing: 0.2,
    },
    stem: 'After a 25% discount, a jacket costs $120. What was the original price?',
    choices: [
      { key: 'A', text: '$145' },
      { key: 'B', text: '$150' },
      { key: 'C', text: '$155' },
      { key: 'D', text: '$160' },
      { key: 'E', text: '$180' },
    ],
    correctKey: 'D',
    concept: {
      microHint: 'Sale price = (100% − 25%) × original = 0.75 × original. Divide, don’t multiply.',
      eli5:
        'Sale price is three-quarters of the sticker price (you kept 75%). Un-do the chop: divide by 0.75.',
      expert:
        'Let `P` be original. `0.75P = 120` ⇒ `P = 120/0.75 = 160`. Discount was 25%, so paid 75%.',
    },
    breakdown:
      '**Answer D.** `0.75P = 120` ⇒ `P = 160`.',
    timeTargetSec: 60,
    skillCode: 'PERCENT_FRACTION',
    practiceTier: 'EASY',
  },
  {
    section: 'QUANT',
    routable: {
      id: 'q-stats-sd-005',
      skillIds: ['DESCRIPTIVE_STATS'],
      difficulty: 0.28,
      discrimination: 1.0,
      guessing: 0.2,
    },
    stem:
      'The residents of Town X participated in a survey to determine the number of hours per week each resident spent watching television. The distribution of the results of the survey had a mean of 21 hours and a standard deviation of 6 hours. The number of hours that Pat, a resident of Town X, watched television last week was between 1 and 2 standard deviations below the mean. Which of the following could be the number of hours that Pat watched television last week?',
    choices: [
      { key: 'A', text: '30' },
      { key: 'B', text: '20' },
      { key: 'C', text: '18' },
      { key: 'D', text: '12' },
      { key: 'E', text: '6' },
    ],
    correctKey: 'D',
    concept: {
      microHint:
        '"Between 1 and 2 SD below the mean" is the band from (mean − 2·SD) up to (mean − 1·SD), not including the outer tails.',
      eli5:
        'Picture the mean as home base and each standard deviation as one equal step away. "One below" is one step down; "two below" is two steps down. Pat landed strictly between those two step lines — not farther out than the second step, not closer in than the first.',
      expert:
        'For mean μ and SD σ, values **k** SD below the mean equal **μ − kσ**. Between 1 and 2 SD below means **μ − 2σ < x < μ − σ** (strict inequality on a discrete list: pick the integer in the open interval). Here **21 − 12 = 9** and **21 − 6 = 15**, so **9 < x < 15**; only **12** qualifies.',
    },
    breakdown:
      '**Answer D.** Pat’s hours must fall strictly between **9** (2 SD below) and **15** (1 SD below); **12** is the only choice in that range.',
    solutionWalkthrough:
      'Given: mean=21 and SD=6.\n\nThe number of hours that Pat watched television was between 1 and 2 standard deviations below the mean:\n\n1 SD below the mean is **mean−1*SD=15**\n\nand 2 SD below the mean is **mean−2*SD=9**,\n\nso the number of hours that Pat watched television was between 9 and 15 hours.\n\n**Answer: D.**',
    timeTargetSec: 95,
    skillCode: 'DESCRIPTIVE_STATS',
    practiceTier: 'MID',
  },
  {
    section: 'VERBAL',
    routable: {
      id: 'q-v-cr-001',
      skillIds: ['CR_ASSUMPTION'],
      difficulty: 0.25,
      discrimination: 1.0,
      guessing: 0.2,
    },
    stem:
      'Editorial: Our high school should move the first bell 45 minutes later. Studies consistently associate longer sleep with stronger academic performance; therefore, this change will improve average test scores at our school.',
    choices: [
      { key: 'A', text: 'The cited studies used standardized tests as their outcome measure' },
      {
        key: 'B',
        text: 'Students will use the additional morning time primarily to sleep rather than other activities',
      },
      { key: 'C', text: 'Every stakeholder agrees that test scores should rise' },
      { key: 'D', text: 'Later start times never create logistical problems' },
      { key: 'E', text: 'Academic performance depends only on sleep duration' },
    ],
    correctKey: 'B',
    concept: {
      microHint:
        'Find the unstated bridge: “later bell” ⇒ “more sleep” ⇒ “better scores.” Which gap must be true for that chain?',
      eli5:
        'The author jumps from schedule change to performance without proving kids will actually sleep more — they might scroll on phones with the same wake time.',
      expert:
        'Assumption questions look for a necessary premise. Here the argument presumes the policy converts into more sleep; without **B**, later start need not lengthen sleep or improve scores.',
    },
    breakdown:
      '**Answer B.** The conclusion requires that the schedule shift produces more sleep; otherwise the sleep-performance evidence does not apply.',
    timeTargetSec: 120,
    skillCode: 'CR_ASSUMPTION',
    practiceTier: 'MID',
  },
  {
    section: 'DATA_INSIGHTS',
    routable: {
      id: 'q-di-ta-001',
      skillIds: ['TABLE_READING'],
      difficulty: -0.52,
      discrimination: 0.95,
      guessing: 0.2,
    },
    stem:
      'A store’s quarterly revenue (`revenue` in thousands of dollars) is shown below.\n\n| Quarter | Revenue |\n|:--------|--------:|\n| Q1      |      48 |\n| Q2      |      54 |\n\nApproximately what is the percent increase in revenue from Q1 to Q2?',
    choices: [
      { key: 'A', text: '10%' },
      { key: 'B', text: '11%' },
      { key: 'C', text: '12.5%' },
      { key: 'D', text: '14%' },
      { key: 'E', text: '18%' },
    ],
    correctKey: 'C',
    concept: {
      microHint: 'Percent change = `(new − old) / old × 100%`. Use the table values as given.',
      eli5:
        'Compare Q2 to Q1: find how much bigger 54 is than 48 as a fraction of 48, then turn it into a percent.',
      expert:
        '`(54 − 48) / 48 = 6/48 = 1/8 = 0.125`, i.e. **12.5%** increase. Exact rational avoids rounding traps.',
    },
    breakdown:
      '**Answer C.** `(54−48)/48 = 12.5%`.',
    timeTargetSec: 90,
    skillCode: 'TABLE_READING',
    practiceTier: 'EASY',
  },
];

export function getPracticeItemById(id: string): PracticeItem | undefined {
  return PRACTICE_ITEMS.find((q) => q.routable.id === id);
}

export function allPracticeRoutables(): RoutableQuestion[] {
  return PRACTICE_ITEMS.map((q) => q.routable);
}
