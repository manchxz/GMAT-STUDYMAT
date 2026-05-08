'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type Mode = 'password' | 'code';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/';
  const registered = search.get('registered') === '1';

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugHint, setDebugHint] = useState('');

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Sign-in failed');
        return;
      }
      router.push(next.startsWith('/') ? next : '/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDebugHint('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not send code');
        return;
      }
      if (data.debugOtp) setDebugHint(`Dev OTP: ${data.debugOtp}`);
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Invalid code');
        return;
      }
      router.push(next.startsWith('/') ? next : '/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">Account · Sign in</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Sign in</h1>
      {registered && (
        <p className="mt-4 rounded-lg border border-teal-500/30 bg-teal-950/20 px-4 py-3 text-sm text-teal-100">
          Registration complete. Sign in with your email and password (or email code).
        </p>
      )}
      <p className="mt-2 text-sm text-[color:var(--muted)]">Use your password, or get a one-time code by email.</p>

      <div className="mt-6 flex rounded-lg border p-0.5" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => {
            setMode('password');
            setError('');
            setSent(false);
            setCode('');
          }}
          className="flex-1 rounded-md py-2 text-sm font-semibold transition"
          style={{
            background: mode === 'password' ? 'var(--accent-mute)' : 'transparent',
            color: 'var(--ink)',
          }}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('code');
            setError('');
            setSent(false);
            setCode('');
          }}
          className="flex-1 rounded-md py-2 text-sm font-semibold transition"
          style={{
            background: mode === 'code' ? 'var(--accent-mute)' : 'transparent',
            color: 'var(--ink)',
          }}
        >
          Email code
        </button>
      </div>

      {error && (
        <p className="mt-6 rounded-lg border border-orange-400/50 bg-orange-950/20 px-4 py-3 text-sm text-orange-200">
          {error}
        </p>
      )}
      {debugHint && (
        <p className="mt-4 text-xs text-[color:var(--muted)] border border-dashed px-3 py-2 rounded-lg">{debugHint}</p>
      )}

      {mode === 'password' ? (
        <form onSubmit={submitPassword} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] opacity-70">Email</label>
            <input
              required
              type="email"
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2.5 text-[color:var(--ink)]"
              style={{ borderColor: 'var(--border)' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] opacity-70">Password</label>
            <input
              required
              type="password"
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2.5 text-[color:var(--ink)]"
              style={{ borderColor: 'var(--border)' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <p className="text-xs text-[color:var(--muted)]">
            Accounts created before passwords were added can still use <strong>Email code</strong>.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[color:var(--accent)] py-3 font-semibold text-black disabled:opacity-40"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      ) : !sent ? (
        <form onSubmit={requestCode} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] opacity-70">Email</label>
            <input
              required
              type="email"
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2.5 text-[color:var(--ink)]"
              style={{ borderColor: 'var(--border)' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[color:var(--accent)] py-3 font-semibold text-black disabled:opacity-40"
          >
            {loading ? 'Sending…' : 'Email me a code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-8 space-y-4">
          <p className="text-sm text-[color:var(--muted)]">
            Code sent to <strong>{email}</strong>. Enter it below.
          </p>
          <input
            required
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className="w-full rounded-lg border bg-transparent px-3 py-2.5 font-mono text-lg tracking-[0.3em] text-[color:var(--ink)]"
            style={{ borderColor: 'var(--border)' }}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            autoComplete="one-time-code"
          />
          <button
            type="submit"
            disabled={loading || code.length < 4}
            className="w-full rounded-lg bg-[color:var(--accent)] py-3 font-semibold text-black disabled:opacity-40"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setCode('');
            }}
            className="w-full text-sm text-[color:var(--muted)] underline"
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="mt-10 text-center text-sm text-[color:var(--muted)]">
        Need an account?{' '}
        <Link href="/register" className="font-semibold text-[color:var(--accent)]">
          Register
        </Link>
      </p>
      <p className="mt-4 text-center">
        <Link href="/" className="text-xs font-mono uppercase tracking-[0.25em] text-[color:var(--muted)]">
          ← Home
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="p-16 text-center text-[color:var(--muted)]">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
