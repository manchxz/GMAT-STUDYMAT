import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth-session';
import { buildStudyReportCard } from '@/lib/study-report-scoring';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
  try {
    const card = await buildStudyReportCard(userId);
    return NextResponse.json(card);
  } catch (e) {
    console.error('[study/report-card]', e);
    return NextResponse.json({ error: 'Failed to build report' }, { status: 500 });
  }
}
