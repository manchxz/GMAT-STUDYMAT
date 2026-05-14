'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Chat from '@/components/tutor/Chat';
import ChapterFrame, { TUTOR_CHAPTERS } from '@/components/tutor/ChapterFrame';
import TierToggle, { type Tier } from '@/components/tutor/TierToggle';

const STORAGE_KEY = 'gmat-tutor:state';

interface PersistedState {
  chapterSlug: string;
  anchor: string | null;
  tier: Tier;
  conversationId: string | null;
}

const DEFAULT: PersistedState = {
  chapterSlug: '04-verbal-critical-reasoning',
  anchor: null,
  tier: 'EXPERT',
  conversationId: null,
};

export default function TutorPage() {
  const [state, setState] = useState<PersistedState>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);
  const [initialMessages, setInitialMessages] = useState<
    Array<{ id: string; role: 'user' | 'assistant'; content: string }>
  >([]);
  const [authError, setAuthError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        setState((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated || !state.conversationId) {
      setInitialMessages([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/tutor/conversations/${state.conversationId}`)
      .then(async (r) => {
        if (r.status === 401) {
          setAuthError(true);
          return null;
        }
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        const msgs = (
          data.messages as Array<{ id: string; role: string; content: string }>
        )
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));
        setInitialMessages(msgs);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, state.conversationId]);

  function setChapter(slug: string) {
    setState((s) => ({ ...s, chapterSlug: slug, anchor: null }));
  }

  function onCitationClick(slug: string, anchor?: string) {
    if (!slug) return;
    setState((s) => ({ ...s, chapterSlug: slug, anchor: anchor || null }));
    setTimeout(() => {
      const ifr = iframeRef.current;
      if (ifr && ifr.contentWindow && anchor) {
        ifr.contentWindow.location.hash = anchor;
      }
    }, 50);
  }

  function newConversation() {
    setState((s) => ({ ...s, conversationId: null }));
    setInitialMessages([]);
  }

  if (authError) {
    return (
      <main
        className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16"
        style={{ background: 'var(--bg)', color: 'var(--ink)' }}
      >
        <h1 className="text-2xl font-semibold">Please sign in</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
          The tutor needs a learner session. Sign in to continue.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex w-fit items-center rounded-md px-4 py-2 text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Go to login
        </Link>
      </main>
    );
  }

  return (
    <div
      className="flex h-screen flex-col"
      style={{ background: 'var(--bg)' }}
    >
      <header
        className="flex items-center justify-between gap-3 px-4 py-2"
        style={{
          background: 'var(--panel)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-base font-semibold"
            style={{ color: 'var(--ink)' }}
          >
            GMAT Tutor
          </Link>
          <select
            value={state.chapterSlug}
            onChange={(e) => setChapter(e.target.value)}
            className="rounded-md px-2 py-1 text-xs"
            style={{
              background: 'var(--bg)',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
            }}
          >
            {TUTOR_CHAPTERS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <TierToggle
            value={state.tier}
            onChange={(t) => setState((s) => ({ ...s, tier: t }))}
          />
          <button
            onClick={newConversation}
            className="rounded-md px-2.5 py-1 text-xs font-medium"
            style={{
              background: 'var(--bg)',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
            }}
          >
            New chat
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <section
          className="min-h-0"
          style={{ borderRight: '1px solid var(--border)' }}
        >
          <ChapterFrame
            ref={iframeRef}
            chapterSlug={state.chapterSlug}
            anchor={state.anchor}
          />
        </section>
        <section className="min-h-0">
          {hydrated && (
            <Chat
              tier={state.tier}
              chapterSlug={state.chapterSlug}
              anchor={state.anchor}
              conversationId={state.conversationId}
              initialMessages={initialMessages}
              onConversationId={(id) =>
                setState((s) => ({ ...s, conversationId: id }))
              }
              onCitationClick={onCitationClick}
            />
          )}
        </section>
      </div>
    </div>
  );
}
