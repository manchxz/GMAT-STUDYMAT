/** Server-only Ollama helpers — read env at request time (not build time). */

export type OllamaChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export function getOllamaRuntimeConfig() {
  return {
    baseUrl: (process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434').replace(/\/$/, ''),
    model: process.env.OLLAMA_MODEL ?? 'huihui_ai/glm-4.7-flash-abliterated',
  };
}

export function buildConceptChatSystemPrompt(opts: {
  skillCode: string;
  eli5: string;
  expert: string;
  submitted: boolean;
}): string {
  const submissionRule = opts.submitted
    ? 'The learner has already submitted this item. You may walk through reasoning, traps, and what the test rewards. Still teach—do not only give a verdict.'
    : 'The learner has NOT submitted yet. Do NOT state which multiple-choice option (A–E) is correct. Do NOT work the problem to a final choice or eliminate choices to one letter. You may clarify definitions, the underlying skill, and the concept excerpts below. If they insist on the answer, briefly refuse and point them to the in-app scaffold.';

  return `You are a GMAT Focus Quant tutor. Current skill code: ${opts.skillCode}.

${submissionRule}

Ground-truth concept notes from the course (paraphrase; do not contradict):
--- ELI5 ---
${opts.eli5}
--- Expert ---
${opts.expert}

Keep replies concise. Use × for multiplication. Prefer short paragraphs and, when helpful, bullet lists.`;
}

export type OllamaChatResponse = {
  message?: { role: string; content: string };
  error?: string;
};

export async function ollamaChat(opts: {
  model: string;
  baseUrl: string;
  messages: OllamaChatMessage[];
  /** ms */
  timeoutMs?: number;
}): Promise<{ content: string } | { error: string; status: number }> {
  const { model, baseUrl, messages, timeoutMs = 120_000 } = opts;
  const url = `${baseUrl}/api/chat`;

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
      signal: ac.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        error: text || `Ollama returned HTTP ${res.status}`,
        status: res.status >= 400 && res.status < 600 ? res.status : 502,
      };
    }

    const data = (await res.json()) as OllamaChatResponse;
    const content = data.message?.content?.trim();
    if (!content) {
      return { error: 'Empty reply from Ollama', status: 502 };
    }
    return { content };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('aborted') || ac.signal.aborted) {
      return { error: 'Ollama request timed out — try a shorter question.', status: 504 };
    }
    return {
      error:
        'Could not reach Ollama. Is it running? Default URL is http://127.0.0.1:11434 — check OLLAMA_BASE_URL.',
      status: 503,
    };
  } finally {
    clearTimeout(t);
  }
}

const MAX_CONTEXT = 12_000;
const MAX_MESSAGE = 6_000;
const MAX_HISTORY_MESSAGES = 24;

export function clampConceptChatPayload(parts: {
  eli5: string;
  expert: string;
  history: { role: 'user' | 'assistant'; content: string }[];
}): { eli5: string; expert: string; history: typeof parts.history } {
  const clip = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max)}\n…[truncated]`);

  let budget = MAX_CONTEXT;
  const eli5 = clip(parts.eli5, Math.min(6000, budget));
  budget -= eli5.length;
  const expert = clip(parts.expert, Math.min(6000, Math.max(500, budget)));

  const hist = parts.history.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.role,
    content: clip(m.content, MAX_MESSAGE),
  }));

  return { eli5, expert, history: hist };
}
