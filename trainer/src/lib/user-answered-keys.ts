import { prisma } from '@/lib/prisma';

export async function loadUserAnsweredExternalKeys(userId: string): Promise<Set<string>> {
  const rows = await prisma.questionAttempt.findMany({
    where: {
      session: { userId },
      answeredAt: { not: null },
      selectedKey: { not: null },
      isCorrect: { not: null },
    },
    include: { question: { select: { externalKey: true } } },
  });
  const set = new Set<string>();
  for (const r of rows) {
    const k = r.question.externalKey;
    if (k) set.add(k);
  }
  return set;
}
