import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOtpCode, saveOtpChallenge, exposeDevOtp } from '@/lib/otp-utils';
import { sendEmailOtp } from '@/lib/email-otp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.emailVerifiedAt) {
      return NextResponse.json(
        { error: 'No verified account for this email. Register first or finish verification.' },
        { status: 404 }
      );
    }

    const code = generateOtpCode();
    await saveOtpChallenge(email, 'LOGIN', code);
    const sent = await sendEmailOtp(email, code);
    if (!sent.ok && !exposeDevOtp()) {
      return NextResponse.json({ error: sent.error || 'Could not send email' }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Check your email for a sign-in code.',
      ...(exposeDevOtp() ? { debugOtp: code } : {}),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Could not start sign-in' }, { status: 500 });
  }
}
