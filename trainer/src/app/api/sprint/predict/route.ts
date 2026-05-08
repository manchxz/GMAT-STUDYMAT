import { NextResponse } from 'next/server';
import { predictCompositeDelta } from '@/lib/predictive-scoring';
import type { SprintRollup } from '@/lib/time-analytics';

/**
 * POST JSON:
 * { userId: string, rollup: SprintRollup, skillSnapshot: Record<string,{theta:number,recentAccuracy:number}>, priorComposite?: number }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rollup = body.rollup as SprintRollup | undefined;
    const skillSnapshot = body.skillSnapshot ?? {};

    if (!rollup || typeof rollup.attempts !== 'number') {
      return NextResponse.json({ error: 'Invalid rollup payload' }, { status: 400 });
    }

    const delta = predictCompositeDelta({
      rollup,
      skillSnapshot,
      priorComposite: body.priorComposite ?? undefined,
    });

    return NextResponse.json({
      predictedScoreDelta: delta,
      window: {
        panicGuessRate: rollup.panicGuessRate,
        overInvestRate: rollup.overInvestRate,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
