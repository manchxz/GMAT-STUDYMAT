import { prisma } from '@/lib/prisma';
import type { RetrievedChunk } from '@/lib/tutor/system-prompt';

// Lightweight keyword retrieval over TutorChapterChunk.
//
// Strategy (MVP):
//   1. Tokenize the query into lowercase words >= 3 chars (stop-word filter).
//   2. Score each chunk by sum-of-term-frequency (case-insensitive substring).
//   3. Heading matches count 3x; chapterSlug match counts 1.5x.
//   4. Return top-k chunks, optionally biased toward `chapterSlug`.
//
// v0.2 will swap this for pgvector with `text-embedding-004`.

const STOP = new Set([
  'the', 'and', 'for', 'you', 'your', 'with', 'that', 'this', 'what',
  'how', 'why', 'are', 'was', 'were', 'but', 'not', 'from', 'have',
  'has', 'had', 'can', 'any', 'all', 'into', 'out', 'about',
  'would', 'could', 'should', 'does', 'did', 'doing', 'done', 'just',
  'like', 'more', 'most', 'some', 'such', 'than', 'then', 'them', 'they',
  'their', 'there', 'these', 'those', 'when', 'where', 'which', 'who',
  'whom', 'will', 'over', 'under', 'very', 'much', 'also',
]);

function tokens(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

export interface RetrieveArgs {
  query: string;
  chapterSlug?: string | null;
  k?: number;
}

export async function retrieve(args: RetrieveArgs): Promise<RetrievedChunk[]> {
  const k = args.k ?? 4;
  const terms = tokens(args.query);
  if (terms.length === 0) return [];

  const candidates = await prisma.tutorChapterChunk.findMany({
    where: {
      OR: terms.flatMap((t) => [
        { text: { contains: t, mode: 'insensitive' } },
        { heading: { contains: t, mode: 'insensitive' } },
      ]),
    },
    take: 200,
  });

  if (candidates.length === 0) return [];

  const scored = candidates.map((c) => {
    const text = c.text.toLowerCase();
    const heading = c.heading.toLowerCase();
    let score = 0;
    for (const t of terms) {
      const tf = (text.match(new RegExp(escapeRegex(t), 'g')) || []).length;
      score += tf;
      if (heading.includes(t)) score += 3;
    }
    if (args.chapterSlug && c.chapterSlug === args.chapterSlug) {
      score *= 1.5;
    }
    return { c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, k).map(({ c }) => ({
    chapterSlug: c.chapterSlug,
    chapterTitle: c.chapterTitle,
    heading: c.heading,
    anchor: c.anchor,
    text: c.text,
  }));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
