import type { Section } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { prismaSectionToKey, type SectionKey } from '@/lib/practice-block';
import { STUDY_SECTION_LABELS } from '@/lib/study-section';
import { textbookPathForSkill } from '@/lib/skill-textbook-links';

const SECTION_FALLBACK_TEXTBOOK: Record<Section, string> = {
  QUANT: '/textbook/chapters/01-quant-number-properties.html',
  VERBAL: '/textbook/chapters/04-verbal-critical-reasoning.html',
  DATA_INSIGHTS: '/textbook/chapters/06-di-data-sufficiency.html',
};

export type ReviewLogRowDTO = {
  id: string;
  at: string;
  externalKey: string | null;
  stemPreview: string;
  sectionKey: SectionKey;
  sectionLabel: string;
  correctKey: string;
  selectedKey: string | null;
  errorTag: string | null;
  timeMs: number | null;
  textbookHref: string;
};

function previewStem(md: string, max = 200): string {
  const t = md.replace(/`+/g, '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export async function fetchReviewLogForUser(userId: string, take = 60): Promise<ReviewLogRowDTO[]> {
  const rows = await prisma.questionAttempt.findMany({
    where: {
      session: { userId },
      isCorrect: false,
      answeredAt: { not: null },
    },
    orderBy: { answeredAt: 'desc' },
    take,
    include: {
      question: {
        select: {
          externalKey: true,
          stemMd: true,
          correctKey: true,
          section: true,
          skills: {
            take: 1,
            orderBy: { weight: 'desc' },
            select: { skill: { select: { code: true } } },
          },
        },
      },
    },
  });

  return rows.map((r) => {
    const q = r.question;
    const sk = prismaSectionToKey(q.section);
    const skillCode = q.skills[0]?.skill.code;
    const book =
      (skillCode ? textbookPathForSkill(skillCode) : null) ?? SECTION_FALLBACK_TEXTBOOK[q.section];
    return {
      id: r.id,
      at: r.answeredAt!.toISOString(),
      externalKey: q.externalKey,
      stemPreview: previewStem(q.stemMd),
      sectionKey: sk,
      sectionLabel: STUDY_SECTION_LABELS[sk],
      correctKey: q.correctKey,
      selectedKey: r.selectedKey,
      errorTag: r.errorTag,
      timeMs: r.timeMs,
      textbookHref: book,
    };
  });
}
