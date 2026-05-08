import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import { assertProgressChapterId } from '@/lib/chapter-key';

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const raw = String(body.chapterId ?? '').trim();
    const chapterId = assertProgressChapterId(raw);
    if (!chapterId) {
      return NextResponse.json({ error: 'Invalid chapter' }, { status: 400 });
    }

    await prisma.learnerChapterProgress.upsert({
      where: { userId_chapterId: { userId, chapterId } },
      create: { userId, chapterId },
      update: { completedAt: new Date() },
    });

    return NextResponse.json({ ok: true, chapterId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Could not save progress' }, { status: 500 });
  }
}
