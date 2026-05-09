import { streamText, type Message } from 'ai';
import { google, TUTOR_MODEL, assertGeminiKey } from '@/lib/gemini';
import { getSessionUserId } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import { retrieve } from '@/lib/tutor/retrieve';
import { buildSystemPrompt, type Tier } from '@/lib/tutor/system-prompt';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ChatBody {
  messages: Message[];
  conversationId?: string | null;
  chapterSlug?: string | null;
  anchor?: string | null;
  tier?: Tier;
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const messages = body.messages || [];
  const tier: Tier = body.tier === 'ELI5' ? 'ELI5' : 'EXPERT';
  const chapterSlug = body.chapterSlug ?? null;
  const anchor = body.anchor ?? null;

  if (messages.length === 0) {
    return new Response('messages required', { status: 400 });
  }

  try {
    assertGeminiKey();
  } catch (err) {
    return new Response(
      err instanceof Error ? err.message : 'LLM key missing',
      { status: 500 },
    );
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const query = lastUser?.content || '';
  const retrieved = query
    ? await retrieve({ query, chapterSlug, k: 4 })
    : [];

  const conversation = await ensureConversation({
    userId,
    conversationId: body.conversationId ?? null,
    chapterSlug,
    tier,
    firstUserContent: lastUser?.content ?? null,
  });

  if (lastUser?.content) {
    await prisma.tutorMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: lastUser.content,
      },
    });
  }

  const system = buildSystemPrompt({ tier, chapterSlug, anchor, retrieved });

  const result = streamText({
    model: google(TUTOR_MODEL),
    system,
    messages,
    temperature: 0.4,
    onFinish: async ({ text }) => {
      try {
        await prisma.tutorMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'ASSISTANT',
            content: text,
            citations: retrieved.map((r) => ({
              chapterSlug: r.chapterSlug,
              anchor: r.anchor,
              heading: r.heading,
            })),
          },
        });
        await prisma.tutorConversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
      } catch (err) {
        console.error('[tutor/chat] persist failed', err);
      }
    },
  });

  const res = result.toDataStreamResponse();
  res.headers.set('X-Conversation-Id', conversation.id);
  return res;
}

async function ensureConversation(args: {
  userId: string;
  conversationId: string | null;
  chapterSlug: string | null;
  tier: Tier;
  firstUserContent: string | null;
}) {
  if (args.conversationId) {
    const existing = await prisma.tutorConversation.findUnique({
      where: { id: args.conversationId },
    });
    if (existing && existing.userId === args.userId) return existing;
  }
  const title = args.firstUserContent
    ? args.firstUserContent.slice(0, 60)
    : 'New chat';
  return prisma.tutorConversation.create({
    data: {
      userId: args.userId,
      title,
      chapterSlug: args.chapterSlug,
      tier: args.tier,
    },
  });
}
