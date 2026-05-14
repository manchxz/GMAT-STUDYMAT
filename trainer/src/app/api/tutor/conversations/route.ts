import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// List the signed-in user's recent tutor conversations.
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const rows = await prisma.tutorConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 25,
    select: {
      id: true,
      title: true,
      chapterSlug: true,
      tier: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ conversations: rows });
}
