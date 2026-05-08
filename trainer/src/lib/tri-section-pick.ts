import type { Section } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  type PracticeTier,
  tierFallbackOrder,
  tierPrisma,
} from '@/lib/practice-block';

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)]!;
}

type PickRow = {
  id: string;
  externalKey: string | null;
  section: Section;
};

export async function pickRandomBankQuestion(
  section: Section,
  preferredTier: PracticeTier,
  excludeExternalKeys: Set<string>
): Promise<PickRow | null> {
  const exclude = [...excludeExternalKeys].filter(Boolean);
  const base = {
    section,
    isActive: true,
    externalKey: { not: null },
    ...(exclude.length ? { NOT: { externalKey: { in: exclude } } } : {}),
  };

  for (const tier of tierFallbackOrder(preferredTier)) {
    const rows = await prisma.question.findMany({
      where: { ...base, practiceTier: tierPrisma(tier) },
      select: { id: true, externalKey: true, section: true },
    });
    const picked = pickRandom(rows);
    if (picked?.externalKey) return picked as PickRow;
  }

  const anyRows = await prisma.question.findMany({
    where: { ...base },
    select: { id: true, externalKey: true, section: true },
    take: 200,
  });
  const picked = pickRandom(anyRows);
  if (picked?.externalKey) return picked as PickRow;
  return null;
}
