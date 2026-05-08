import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeOtp, generateOtpCode, saveOtpChallenge, exposeDevOtp } from '@/lib/otp-utils';
import { sendSmsOtp } from '@/lib/sms-otp';
import { hashPassword, validateNewPassword } from '@/lib/password';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const code = String(body.code ?? '').trim();
    const password = String(body.password ?? '');
    const confirmPassword = String(body.confirmPassword ?? '');

    if (!email || code.length < 4) {
      return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
    }

    const pwdErr = validateNewPassword(password, confirmPassword);
    if (pwdErr) {
      return NextResponse.json({ error: pwdErr }, { status: 400 });
    }

    const ok = await consumeOtp(email, 'REGISTER_EMAIL', code);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.update({
      where: { email },
      data: {
        emailVerifiedAt: new Date(),
        passwordHash,
      },
    });

    if (user.phone && !user.phoneVerifiedAt) {
      const pCode = generateOtpCode();
      await saveOtpChallenge(user.phone, 'REGISTER_PHONE', pCode);
      const sms = await sendSmsOtp(user.phone, pCode);
      if (!sms.ok) {
        return NextResponse.json({
          ok: true,
          step: 'done',
          warning:
            'Phone SMS is not configured or failed. Your account is active; phone was not verified. Sign in to continue.',
        });
      }
      return NextResponse.json({
        ok: true,
        step: 'phone',
        message: 'Email verified. Enter the code sent to your phone.',
        ...(exposeDevOtp() ? { debugPhoneOtp: pCode } : {}),
      });
    }

    return NextResponse.json({ ok: true, step: 'done' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
