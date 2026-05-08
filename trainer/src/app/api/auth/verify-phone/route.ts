import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeOtp } from '@/lib/otp-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const code = String(body.code ?? '').trim();
    if (!email || code.length < 4) {
      return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.phone) {
      return NextResponse.json({ error: 'No phone on file' }, { status: 400 });
    }

    const ok = await consumeOtp(user.phone, 'REGISTER_PHONE', code);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerifiedAt: new Date() },
    });

    return NextResponse.json({ ok: true, step: 'done' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
