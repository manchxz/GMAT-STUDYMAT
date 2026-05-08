import { NextResponse } from 'next/server';
import {
  buildConceptChatSystemPrompt,
  clampConceptChatPayload,
  getOllamaRuntimeConfig,
  ollamaChat,
  type OllamaChatMessage,
} from '@/lib/ollama-server';

type ClientMessage = { role: 'user' | 'assistant'; content: string };

type Body = {
  skillCode?: string;
  conceptEli5?: string;
  conceptExpert?: string;
  submitted?: boolean;
  messages?: ClientMessage[];
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const skillCode = typeof body.skillCode === 'string' ? body.skillCode.trim() : '';
  const rawEli5 = typeof body.conceptEli5 === 'string' ? body.conceptEli5 : '';
  const rawExpert = typeof body.conceptExpert === 'string' ? body.conceptExpert : '';
  const submitted = body.submitted === true;
  const rawHistory = Array.isArray(body.messages) ? body.messages : [];

  if (!skillCode) {
    return NextResponse.json({ error: 'skillCode is required' }, { status: 400 });
  }

  const cleaned: ClientMessage[] = [];
  for (const m of rawHistory) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const c = typeof m.content === 'string' ? m.content.trim() : '';
    if (!c) continue;
    cleaned.push({ role: m.role, content: c });
  }

  if (cleaned.length === 0 || cleaned[cleaned.length - 1]!.role !== 'user') {
    return NextResponse.json(
      { error: 'messages must end with a non-empty user message' },
      { status: 400 },
    );
  }

  const { eli5, expert, history } = clampConceptChatPayload({
    eli5: rawEli5,
    expert: rawExpert,
    history: cleaned,
  });

  const system = buildConceptChatSystemPrompt({
    skillCode,
    eli5,
    expert,
    submitted,
  });

  const ollamaMessages: OllamaChatMessage[] = [
    { role: 'system', content: system },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const { baseUrl, model } = getOllamaRuntimeConfig();
  const result = await ollamaChat({ baseUrl, model, messages: ollamaMessages });

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ reply: result.content });
}
