export async function sendEmailOtp(to: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.warn('[email] RESEND_API_KEY or EMAIL_FROM missing — OTP not emailed');
    return { ok: false, error: 'Email not configured' };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Your Logic Field Guide verification code',
      text: `Your verification code is ${code}. It expires in 15 minutes.\n\nIf you did not request this, ignore this message.`,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    return { ok: false, error: t || res.statusText };
  }
  return { ok: true };
}
