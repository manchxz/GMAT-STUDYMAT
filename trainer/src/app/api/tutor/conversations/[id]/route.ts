import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Load a single conversation + its messages for /tutor restoration.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = await ctx.params;
  const conv = await prisma.tutorConversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!conv || conv.userId !== userId) {
    return new NextResponse('Not found', { status: 404 });
  }
  return NextResponse.json({
    id: conv.id,
    title: conv.title,
    chapterSlug: conv.chapterSlug,
    tier: conv.tier,
    messages: conv.messages.map((m) => ({
      id: m.id,
      role: m.role.toLowerCase(),
      content: m.content,
      citations: m.citations,
      createdAt: m.createdAt,
    })),
  });
}
