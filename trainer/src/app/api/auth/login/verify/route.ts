import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeOtp } from '@/lib/otp-utils';
import { createSessionToken, setSessionCookie } from '@/lib/auth-session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const code = String(body.code ?? '').trim();
    if (!email || code.length < 4) {
      return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.emailVerifiedAt) {
      return NextResponse.json({ error: 'Account not verified' }, { status: 403 });
    }

    const ok = await consumeOtp(email, 'LOGIN', code);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    const token = await createSessionToken(user.id);
    await setSessionCookie(token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Sign-in failed' }, { status: 500 });
  }
}
