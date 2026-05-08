import { createHash, randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';
import type { OtpPurpose } from '@prisma/client';

function pepper() {
  const s = process.env.SESSION_SECRET ?? '';
  return s.length >= 16 ? s : 'dev-only-pepper-change-me';
}

export function hashOtp(code: string, target: string, purpose: OtpPurpose) {
  return createHash('sha256')
    .update(`${pepper()}:${purpose}:${target.toLowerCase().trim()}:${code}`)
    .digest('hex');
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

export async function saveOtpChallenge(target: string, purpose: OtpPurpose, code: string) {
  const codeHash = hashOtp(code, target, purpose);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await prisma.otpChallenge.deleteMany({ where: { target, purpose } });
  return prisma.otpChallenge.create({
    data: { target: target.trim(), purpose, codeHash, expiresAt },
  });
}

export async function consumeOtp(
  target: string,
  purpose: OtpPurpose,
  code: string
): Promise<boolean> {
  const row = await prisma.otpChallenge.findFirst({
    where: { target: target.trim(), purpose, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!row || row.attempts >= 8) return false;
  const ok = row.codeHash === hashOtp(code, target, purpose);
  await prisma.otpChallenge.update({
    where: { id: row.id },
    data: { attempts: { increment: 1 } },
  });
  if (!ok) return false;
  await prisma.otpChallenge.deleteMany({ where: { target: target.trim(), purpose } });
  return true;
}

export function exposeDevOtp(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.OTP_DEBUG === '1';
}
