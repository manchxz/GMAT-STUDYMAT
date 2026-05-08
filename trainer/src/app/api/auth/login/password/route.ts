import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { createSessionToken, setSessionCookie } from '@/lib/auth-session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const generic = { error: 'Invalid email or password.' };

    if (!user?.emailVerifiedAt || !user.passwordHash) {
      return NextResponse.json(generic, { status: 401 });
    }

    const match = await verifyPassword(password, user.passwordHash);
    if (!match) {
      return NextResponse.json(generic, { status: 401 });
    }

    const token = await createSessionToken(user.id);
    await setSessionCookie(token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Sign-in failed' }, { status: 500 });
  }
}
