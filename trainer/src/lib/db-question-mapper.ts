import type { Concept, Question, Section } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { PracticeItem } from '@/lib/practice-items';
import { prismaSectionToKey } from '@/lib/practice-block';

type QWithConcept = Question & { concept: Concept | null; skills: { skill: { code: string } }[] };

function buildDbBreakdown(
  correctKey: string,
  walkthroughMd: string | null | undefined,
  eli5: string,
  expert: string,
): string {
  const w = walkthroughMd?.trim();
  if (w) {
    return `**Answer ${correctKey}.** The step-by-step explanation below shows how to reach this answer.`;
  }
  const chunks: string[] = [
    `**Answer ${correctKey}.**`,
    'Here is reasoning that applies to this kind of problem:',
  ];
  const e5 = eli5.trim();
  const ex = expert.trim();
  if (e5) chunks.push('', e5);
  if (ex) chunks.push('', ex);
  if (chunks.length <= 2) {
    return `**Answer ${correctKey}.** Go choice by choice: rule out options that contradict the stem, then decide which remaining choice must be true.`;
  }
  return chunks.join('\n\n');
}

export function dbQuestionToPracticeItem(row: QWithConcept): PracticeItem | null {
  const key = row.externalKey;
  if (!key) return null;
  const choicesUnknown = row.choicesJson as unknown;
  if (!Array.isArray(choicesUnknown) || choicesUnknown.length === 0) return null;
  const choices = choicesUnknown as { key: string; text: string }[];
  const skillCode =
    row.skills?.[0]?.skill?.code ?? 'NUMBER_PROPERTIES';
  const SK = prismaSectionToKey(row.section);
  const section = SK as PracticeItem['section'];

  const eli5Raw = row.concept?.eli5Md ?? '';
  const expertRaw = row.concept?.expertMd ?? '';
  const eli5 = eli5Raw || 'Review the concept notes for this skill in your textbook.';
  const expert = expertRaw || 'Consult the expert notes linked to this item.';
  const walkthrough = row.solutionWalkthroughMd ?? undefined;
  const breakdown = buildDbBreakdown(row.correctKey, walkthrough, eli5Raw, expertRaw);

  return {
    section,
    routable: {
      id: key,
      skillIds: row.skills?.length
        ? row.skills.map((x) => x.skill.code)
        : [skillCode],
      difficulty: row.difficulty,
      discrimination: row.discrimination,
      guessing: row.guessing,
    },
    stem: row.stemMd,
    choices,
    correctKey: row.correctKey,
    concept: { eli5, expert },
    breakdown,
    solutionWalkthrough: walkthrough,
    timeTargetSec: row.timeTargetSec ?? 90,
    skillCode,
    practiceTier: row.practiceTier ?? null,
  };
}

export async function fetchPracticeItemByExternalKey(externalKey: string): Promise<PracticeItem | null> {
  const row = await prisma.question.findFirst({
    where: { externalKey },
    include: { concept: true, skills: { include: { skill: true } } },
  });
  if (!row) return null;
  return dbQuestionToPracticeItem(row);
}

export function sectionKeyToPrisma(s: 'QUANT' | 'VERBAL' | 'DATA_INSIGHTS'): Section {
  return s as Section;
}
