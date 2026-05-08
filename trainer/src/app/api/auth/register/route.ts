import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOtpCode, saveOtpChallenge, exposeDevOtp } from '@/lib/otp-utils';
import { sendEmailOtp } from '@/lib/email-otp';
import { normalizePhone } from '@/lib/phone';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const phoneRaw = body.phone ? String(body.phone).trim() : '';

    if (name.length < 2) {
      return NextResponse.json({ error: 'Please enter your full name' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    const phone = normalizePhone(phoneRaw || undefined);
    if (phoneRaw && !phone) {
      return NextResponse.json({ error: 'Enter a valid phone number (or leave it blank)' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.emailVerifiedAt) {
      return NextResponse.json({ error: 'An account with this email already exists. Sign in instead.' }, { status: 409 });
    }

    const code = generateOtpCode();
    await saveOtpChallenge(email, 'REGISTER_EMAIL', code);

    if (!existing) {
      await prisma.user.create({ data: { email, name, phone } });
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: { name, phone: phone ?? existing.phone },
      });
    }

    const sent = await sendEmailOtp(email, code);
    if (!sent.ok && !exposeDevOtp()) {
      return NextResponse.json(
        { error: sent.error || 'Could not send email. Check server email configuration.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Check your email for a verification code.',
      ...(exposeDevOtp() ? { debugOtp: code } : {}),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
