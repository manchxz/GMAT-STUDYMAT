import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import type { BreakdownEntry } from '@/lib/study-advice';

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const correct = Number(body.correct);
    const total = Number(body.total);
    const breakdown = body.breakdown as Record<string, BreakdownEntry> | undefined;
    if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0 || correct < 0) {
      return NextResponse.json({ error: 'Invalid score payload' }, { status: 400 });
    }
    if (!breakdown || typeof breakdown !== 'object') {
      return NextResponse.json({ error: 'Breakdown required' }, { status: 400 });
    }

    const scorePct = Math.round((correct / total) * 1000) / 10;

    const row = await prisma.learnerDiagnostic.create({
      data: {
        userId,
        correct: Math.floor(correct),
        total: Math.floor(total),
        scorePct,
        breakdown: breakdown as object,
      },
    });

    return NextResponse.json({ ok: true, id: row.id, scorePct });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Could not save diagnostic' }, { status: 500 });
  }
}
