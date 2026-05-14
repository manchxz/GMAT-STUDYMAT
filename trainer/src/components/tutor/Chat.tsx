'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
import Message from './Message';
import type { Tier } from './TierToggle';

interface Props {
  tier: Tier;
  chapterSlug: string | null;
  anchor?: string | null;
  conversationId: string | null;
  initialMessages?: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
  }>;
  onConversationId?: (id: string) => void;
  onCitationClick?: (slug: string, anchor?: string) => void;
}

export default function Chat({
  tier,
  chapterSlug,
  anchor,
  conversationId,
  initialMessages,
  onConversationId,
  onCitationClick,
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setMessages,
  } = useChat({
    api: '/api/tutor/chat',
    id: conversationId ?? undefined,
    initialMessages: initialMessages,
    body: {
      conversationId,
      chapterSlug,
      anchor,
      tier,
    },
    onResponse: (res) => {
      const id = res.headers.get('X-Conversation-Id');
      if (id && id !== conversationId) onConversationId?.(id);
    },
  });

  useEffect(() => {
    if (initialMessages && initialMessages.length) {
      setMessages(initialMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div
            className="px-6 py-8 text-sm"
            style={{ color: 'var(--muted)' }}
          >
            <p style={{ color: 'var(--ink)', fontWeight: 500 }}>
              Ready when you are.
            </p>
            <p className="mt-2">
              Ask about any chapter — e.g. <em>“What flaw pattern does this argument use?”</em>
              {' '}or <em>“Walk me through a two-statement DS prompt.”</em>
            </p>
            <p className="mt-2 text-xs" style={{ opacity: 0.7 }}>
              Off-topic questions (Geometry, MBA essays, etc.) will be politely refused.
            </p>
          </div>
        ) : (
          messages.map((m) =>
            m.role === 'user' || m.role === 'assistant' ? (
              <Message
                key={m.id}
                role={m.role}
                content={m.content}
                onCitationClick={onCitationClick}
              />
            ) : null,
          )
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3"
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--panel)',
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask the tutor…"
            rows={2}
            className="min-h-[48px] flex-1 resize-none rounded-md px-3 py-2 text-sm focus:outline-none"
            style={{
              background: 'var(--bg)',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(
                  e as unknown as React.FormEvent<HTMLFormElement>,
                );
              }
            }}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={() => stop()}
              className="rounded-md px-3 py-2 text-sm font-medium"
              style={{
                background: 'var(--panel)',
                color: 'var(--ink)',
                border: '1px solid var(--border)',
              }}
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Send
            </button>
          )}
        </div>
        <p
          className="mt-1 text-[11px]"
          style={{ color: 'var(--muted)' }}
        >
          Cite-aware tutor · {tier === 'ELI5' ? 'ELI5 mode' : 'Expert mode'} ·
          {chapterSlug ? ` viewing ${chapterSlug}` : ' no chapter selected'}
        </p>
      </form>
    </div>
  );
}
