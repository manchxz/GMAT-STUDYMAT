'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Step = 'form' | 'email' | 'phone';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugHint, setDebugHint] = useState('');

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setDebugHint('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, phone: phone || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Registration failed');
        return;
      }
      if (data.debugOtp) setDebugHint(`Dev OTP: ${data.debugOtp}`);
      setStep('email');
    } finally {
      setLoading(false);
    }
  }

  async function submitEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDebugHint('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code: emailCode, password, confirmPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Verification failed');
        return;
      }
      if (data.debugPhoneOtp) setDebugHint(`Dev phone OTP: ${data.debugPhoneOtp}`);
      if (data.warning) setDebugHint(data.warning);
      if (data.step === 'phone') {
        setStep('phone');
        return;
      }
      router.push('/login?registered=1');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function submitPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code: phoneCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Verification failed');
        return;
      }
      router.push('/login?registered=1');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
        Account · Register
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Create your learner profile</h1>
      <p className="mt-2 text-sm text-[color:var(--muted)]">
        Choose a password, verify your email (OTP), and optionally confirm your phone by SMS when the server supports it.
      </p>

      {error && (
        <p className="mt-6 rounded-lg border border-orange-400/50 bg-orange-950/20 px-4 py-3 text-sm text-orange-200">
          {error}
        </p>
      )}
      {debugHint && (
        <p className="mt-4 text-xs text-[color:var(--muted)] border border-dashed px-3 py-2 rounded-lg">{debugHint}</p>
      )}

      {step === 'form' && (
        <form onSubmit={submitForm} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] opacity-70">Full name</label>
            <input
              required
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2.5 text-[color:var(--ink)]"
              style={{ borderColor: 'var(--border)' }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
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
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] opacity-70">Confirm password</label>
            <input
              required
              type="password"
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2.5 text-[color:var(--ink)]"
              style={{ borderColor: 'var(--border)' }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] opacity-70">
              Phone <span className="font-normal opacity-60">(optional)</span>
            </label>
            <input
              type="tel"
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2.5 text-[color:var(--ink)]"
              style={{ borderColor: 'var(--border)' }}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 or local 10-digit"
              autoComplete="tel"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[color:var(--accent)] py-3 font-semibold text-black disabled:opacity-40"
          >
            {loading ? 'Sending…' : 'Continue · verify email'}
          </button>
        </form>
      )}

      {step === 'email' && (
        <form onSubmit={submitEmailOtp} className="mt-8 space-y-4">
          <p className="text-sm text-[color:var(--muted)]">
            Enter the 6-digit code sent to <strong>{email}</strong>. Your password is applied when you verify.
          </p>
          <input
            required
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className="w-full rounded-lg border bg-transparent px-3 py-2.5 font-mono text-lg tracking-[0.3em] text-[color:var(--ink)]"
            style={{ borderColor: 'var(--border)' }}
            value={emailCode}
            onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            autoComplete="one-time-code"
          />
          <button
            type="submit"
            disabled={loading || emailCode.length < 4}
            className="w-full rounded-lg bg-[color:var(--accent)] py-3 font-semibold text-black disabled:opacity-40"
          >
            {loading ? 'Checking…' : 'Verify email'}
          </button>
        </form>
      )}

      {step === 'phone' && (
        <form onSubmit={submitPhoneOtp} className="mt-8 space-y-4">
          <p className="text-sm text-[color:var(--muted)]">
            Enter the code sent to <strong>{phone}</strong> by SMS.
          </p>
          <input
            required
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className="w-full rounded-lg border bg-transparent px-3 py-2.5 font-mono text-lg tracking-[0.3em] text-[color:var(--ink)]"
            style={{ borderColor: 'var(--border)' }}
            value={phoneCode}
            onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            autoComplete="one-time-code"
          />
          <button
            type="submit"
            disabled={loading || phoneCode.length < 4}
            className="w-full rounded-lg bg-[color:var(--accent)] py-3 font-semibold text-black disabled:opacity-40"
          >
            {loading ? 'Checking…' : 'Verify phone'}
          </button>
        </form>
      )}

      <p className="mt-10 text-center text-sm text-[color:var(--muted)]">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[color:var(--accent)]">
          Sign in
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
