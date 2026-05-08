'use client';

import { useEffect, useRef, useState } from 'react';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type Props = {
  skillCode: string;
  conceptEli5: string;
  conceptExpert: string;
  submitted: boolean;
  questionKey: string;
  className?: string;
};

export function ConceptChatSidebar({
  skillCode,
  conceptEli5,
  conceptExpert,
  submitted,
  questionKey,
  className = '',
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setInput('');
    setError(null);
    setLoading(false);
  }, [questionKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextHist: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextHist);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/concept-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillCode,
          conceptEli5,
          conceptExpert,
          submitted,
          messages: nextHist,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };

      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : `Request failed (${res.status})`);
        return;
      }

      const reply = typeof data.reply === 'string' ? data.reply : '';
      if (!reply) {
        setError('Empty response');
        return;
      }

      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setError('Network error — check that the dev server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className={`flex min-h-0 flex-col bg-[color:var(--bg)] ${className}`}
      style={{ borderColor: 'var(--border)' }}
      aria-label="Concept tutor chat powered by local Ollama"
    >
      <div className="shrink-0 border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-65">
          Local tutor · Ollama
        </p>
        <p className="mt-1 text-[color:var(--muted)] text-xs leading-snug">
          {submitted
            ? 'Post-submit: you can ask for full reasoning and trap review.'
            : 'Pre-submit: tutor will not name the correct letter. Ask about definitions and the skill.'}
        </p>
      </div>

      <div
        ref={listRef}
        className="custom-scroll min-h-[200px] flex-1 space-y-3 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && !loading && (
          <p className="text-sm text-[color:var(--muted)] leading-relaxed">
            Ask about <strong className="text-[color:var(--ink)]">{skillCode}</strong> in plain language —
            the model reads the same ELI5/Expert notes as the scaffold.
          </p>
        )}
        {messages.map((msg, i) => (
          <article
            key={`${msg.role}-${i}-${msg.content.slice(0, 24)}`}
            className={`rounded-xl border px-3 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user' ? 'ml-4 border-[color:var(--accent)]/40 bg-[color:var(--accent-mute)]' : 'mr-2'
            }`}
            style={msg.role === 'assistant' ? { borderColor: 'var(--border)' } : undefined}
          >
            <header className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] opacity-55">
              {msg.role === 'user' ? 'You' : 'Tutor'}
            </header>
            <p className="whitespace-pre-wrap font-study-body text-[color:var(--ink)]">{msg.content}</p>
          </article>
        ))}
        {loading && (
          <p className="text-xs text-[color:var(--muted)] animate-pulse">Thinking with local model…</p>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div
          className="shrink-0 border-t px-4 py-2 text-xs text-orange-300"
          style={{ borderColor: 'var(--border)' }}
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="shrink-0 border-t p-3" style={{ borderColor: 'var(--border)' }}>
        <label htmlFor={`concept-chat-${questionKey}`} className="sr-only">
          Message to concept tutor
        </label>
        <textarea
          id={`concept-chat-${questionKey}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={3}
          disabled={loading}
          placeholder="Ask about this concept…"
          className="mb-2 w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--muted)] disabled:opacity-50"
          style={{ borderColor: 'var(--border)' }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-35"
          >
            Send
          </button>
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            disabled={loading || messages.length === 0}
            className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-35"
            style={{ borderColor: 'var(--border)' }}
          >
            Clear thread
          </button>
        </div>
      </div>
    </section>
  );
}
