/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient, Section, QuestionType, PracticeTier } = require('@prisma/client');
const { buildBankRows } = require('./generated-practice-bank');

const prisma = new PrismaClient();

function legacyPracticeTier(difficulty) {
  if (difficulty < -0.35) return PracticeTier.EASY;
  if (difficulty < 0.45) return PracticeTier.MID;
  return PracticeTier.HARD;
}

const BANK = [
  {
    externalKey: 'q-np-001',
    section: Section.QUANT,
    skillCode: 'NUMBER_PROPERTIES',
    slug: 'number-properties-core',
    title: 'Divisibility chain',
    difficulty: 0.18,
    discrimination: 1.1,
    guessing: 0.2,
    timeTargetSec: 90,
    stemMd:
      'If `n` is a positive integer and `3n` is divisible by 5, which of the following must `n` be divisible by?',
    choicesJson: [
      { key: 'A', text: '2' },
      { key: 'B', text: '3' },
      { key: 'C', text: '5' },
      { key: 'D', text: '15' },
      { key: 'E', text: 'Cannot be determined from the given info' },
    ],
    correctKey: 'C',
    eli5:
      'Imagine 3 buckets and 5 guests. If triple your pile groups perfectly into 5s, the leftover "3" part did not bring the 5 — your pile must hide a 5.',
    expert:
      'Prime factorization is unique. Since 5 divides `3n` and 5 does not divide 3, 5 divides `n`.',
  },
  {
    externalKey: 'q-alg-002',
    section: Section.QUANT,
    skillCode: 'ALGEBRAIC_LOGIC',
    slug: 'algebraic-vieta',
    title: 'Quadratic roots',
    difficulty: 0.52,
    discrimination: 1.0,
    guessing: 0.2,
    timeTargetSec: 75,
    stemMd:
      'For real `x`, if `x² − 5x + 6 = 0`, what is the sum of all distinct solutions for `x`?',
    choicesJson: [
      { key: 'A', text: '2' },
      { key: 'B', text: '3' },
      { key: 'C', text: '5' },
      { key: 'D', text: '6' },
      { key: 'E', text: 'No real solutions' },
    ],
    correctKey: 'C',
    eli5:
      'You are looking for bridge numbers that multiply to +6 and add to −5. Think (−2) and (−3): they fit, and you just add them for the sum Vieta promised.',
    expert:
      'Factor: `(x−2)(x−3)=0` ⇒ roots 2 and 3. For a monic quadratic `x²+bx+c`, the sum of roots equals `−b`.',
  },
  {
    externalKey: 'q-rate-003',
    section: Section.QUANT,
    skillCode: 'RATES_WORK',
    slug: 'combined-work-rates',
    title: 'Combined rates',
    difficulty: 0.02,
    discrimination: 1.05,
    guessing: 0.2,
    timeTargetSec: 95,
    stemMd:
      'Machine A makes 40 widgets per hour. Machine B makes 60 widgets per hour. Working together at these constant rates, how many hours do they need to produce 250 widgets?',
    choicesJson: [
      { key: 'A', text: '2.0' },
      { key: 'B', text: '2.25' },
      { key: 'C', text: '2.5' },
      { key: 'D', text: '3.0' },
      { key: 'E', text: '3.5' },
    ],
    correctKey: 'C',
    eli5: 'Pour both machines into one “super speed”: forty plus sixty every hour. Divide the job (250) by that combined speed.',
    expert: 'Combined rate `R = 40 + 60 = 100` widgets/hour. Time `T = Work/R = 250/100 = 2.5` hours.',
  },
  {
    externalKey: 'q-pct-004',
    section: Section.QUANT,
    skillCode: 'PERCENT_FRACTION',
    slug: 'percent-discount-reverse',
    title: 'Reverse discount',
    difficulty: -0.82,
    discrimination: 0.95,
    guessing: 0.2,
    timeTargetSec: 60,
    stemMd: 'After a 25% discount, a jacket costs $120. What was the original price?',
    choicesJson: [
      { key: 'A', text: '$145' },
      { key: 'B', text: '$150' },
      { key: 'C', text: '$155' },
      { key: 'D', text: '$160' },
      { key: 'E', text: '$180' },
    ],
    correctKey: 'D',
    eli5: 'Sale price is three-quarters of the sticker price (you kept 75%). Un-do the chop: divide by 0.75.',
    expert: 'Let `P` be original. `0.75P = 120` ⇒ `P = 120/0.75 = 160`.',
  },
  {
    externalKey: 'q-v-cr-001',
    section: Section.VERBAL,
    skillCode: 'CR_ASSUMPTION',
    slug: 'cr-assumption-sleep',
    title: 'Later start assumption',
    difficulty: 0.25,
    discrimination: 1.0,
    guessing: 0.2,
    timeTargetSec: 120,
    stemMd:
      'Editorial: Our high school should move the first bell 45 minutes later. Studies consistently associate longer sleep with stronger academic performance; therefore, this change will improve average test scores at our school.',
    choicesJson: [
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
    eli5:
      'The author jumps from schedule change to performance without proving kids will actually sleep more.',
    expert:
      'Assumption: the policy converts into more sleep. **B** is necessary; otherwise the sleep–performance evidence does not apply.',
  },
  {
    externalKey: 'q-di-ta-001',
    section: Section.DATA_INSIGHTS,
    skillCode: 'TABLE_READING',
    slug: 'table-pct-change',
    title: 'Quarterly percent change',
    difficulty: -0.52,
    discrimination: 0.95,
    guessing: 0.2,
    timeTargetSec: 90,
    stemMd:
      '| Quarter | Revenue |\n|:--------|--------:|\n| Q1      |      48 |\n| Q2      |      54 |\n\nApproximate percent increase Q1→Q2?',
    choicesJson: [
      { key: 'A', text: '10%' },
      { key: 'B', text: '11%' },
      { key: 'C', text: '12.5%' },
      { key: 'D', text: '14%' },
      { key: 'E', text: '18%' },
    ],
    correctKey: 'C',
    eli5: 'Compare Q2 to Q1 as a fraction of Q1, then percent.',
    expert: '`(54−48)/48 = 12.5%` increase.',
  },
];

async function seedOne(row, sortOrder) {
  const skill = await prisma.skill.upsert({
    where: { code: row.skillCode },
    create: {
      code: row.skillCode,
      name: row.skillCode.replace(/_/g, ' '),
      section: row.section,
      sortOrder,
    },
    update: {},
  });

  const concept = await prisma.concept.upsert({
    where: { slug: row.slug },
    create: {
      skillId: skill.id,
      slug: row.slug,
      title: row.title,
      eli5Md: row.eli5,
      expertMd: row.expert,
      sortOrder: 0,
    },
    update: {
      eli5Md: row.eli5,
      expertMd: row.expert,
      title: row.title,
    },
  });

  const q = await prisma.question.upsert({
    where: { externalKey: row.externalKey },
    create: {
      externalKey: row.externalKey,
      section: row.section,
      type: QuestionType.MULTIPLE_CHOICE,
      stemMd: row.stemMd,
      choicesJson: row.choicesJson,
      correctKey: row.correctKey,
      difficulty: row.difficulty,
      discrimination: row.discrimination,
      guessing: row.guessing,
      practiceTier: row.practiceTier,
      conceptId: concept.id,
      timeTargetSec: row.timeTargetSec,
      isActive: true,
    },
    update: {
      stemMd: row.stemMd,
      choicesJson: row.choicesJson,
      correctKey: row.correctKey,
      difficulty: row.difficulty,
      discrimination: row.discrimination,
      guessing: row.guessing,
      practiceTier: row.practiceTier,
      conceptId: concept.id,
      timeTargetSec: row.timeTargetSec,
    },
  });

  await prisma.questionSkill.upsert({
    where: { questionId_skillId: { questionId: q.id, skillId: skill.id } },
    create: { questionId: q.id, skillId: skill.id, weight: 1 },
    update: { weight: 1 },
  });
}

async function main() {
  const legacy = BANK.map((r) => ({ ...r, practiceTier: legacyPracticeTier(r.difficulty) }));
  const generated = buildBankRows();
  const all = [...legacy, ...generated];
  let i = 0;
  for (const row of all) {
    await seedOne(row, i + 1);
    i += 1;
  }
  console.log('Seeded', all.length, 'questions (legacy + generated bank)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
