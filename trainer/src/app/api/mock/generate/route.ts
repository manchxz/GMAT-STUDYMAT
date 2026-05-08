import { createRequire } from 'module';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import type { MockExamPayload, MockExamPoolItem, MockSectionKey } from '@/lib/mock-exam-types';
import { MOCK_SECTION_ORDER } from '@/lib/mock-exam-types';
import { makeSeededRng, mapBankSection } from '@/lib/mock-exam-cat';

const require = createRequire(import.meta.url);

const POOL_TARGET = 110;

function sectionFromRow(row: { section: string }): MockSectionKey {
  return mapBankSection(String(row.section));
}

function seededSlice<T>(arr: T[], rng: () => number, startFrac: number, len: number): T[] {
  const n = arr.length;
  if (n <= len) return [...arr];
  const start = Math.floor(startFrac * Math.max(0, n - len));
  return arr.slice(start, start + len);
}

export async function POST(req: Request) {
  let salt: string = randomUUID();
  try {
    const body = (await req.json()) as { salt?: string };
    if (body?.salt && typeof body.salt === 'string' && body.salt.length > 8) salt = body.salt;
  } catch {
    /* optional body */
  }

  const started = Date.now();
  const bank = require('../../../../../prisma/generated-practice-bank.js');
  const rows: Array<{
    externalKey: string;
    section: string;
    stemMd: string;
    choicesJson: { key: string; text: string }[];
    correctKey: string;
    difficulty: number;
  }> = bank.buildBankRows();

  const pools: Record<MockSectionKey, MockExamPoolItem[]> = {
    QUANT: [],
    VERBAL: [],
    DATA_INSIGHTS: [],
  };

  for (const sec of MOCK_SECTION_ORDER) {
    const subset = rows.filter((r) => sectionFromRow(r) === sec);
    const rng = makeSeededRng(salt + sec, subset.length);
    const shuffled = [...subset].sort(() => rng() - 0.5);
    const frac = rng();
    const picked = seededSlice(shuffled, rng, frac, Math.min(POOL_TARGET, shuffled.length));

    let i = 0;
    for (const row of picked) {
      const choices = row.choicesJson;
      const correct = choices.find((c) => c.key === row.correctKey);
      if (!correct) continue;
      pools[sec].push({
        id: `mx-${sec.slice(0, 1)}-${salt.slice(0, 8)}-${i++}`,
        bankKey: row.externalKey,
        section: sec,
        stemMd: row.stemMd,
        choices,
        correctText: correct.text,
        difficulty: typeof row.difficulty === 'number' ? row.difficulty : 0,
      });
    }
  }

  const payload: MockExamPayload = {
    version: 1,
    salt,
    createdAt: new Date().toISOString(),
    pools,
  };

  const prepMs = Date.now() - started;

  return NextResponse.json({
    ok: true,
    prepMs,
    payload,
  });
}
