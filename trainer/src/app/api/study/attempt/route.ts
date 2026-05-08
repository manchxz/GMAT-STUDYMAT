import { NextResponse } from 'next/server';
import { ErrorBehaviorTag, type Section } from '@prisma/client';
import { getSessionUserId } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import { selectNextAdaptive } from '@/lib/adaptive-router';
import { updateThetaAfterAttempt } from '@/lib/theta-calibration';
import { classifyAttemptPace } from '@/lib/time-analytics';
import { PRACTICE_ITEMS, getPracticeItemById, type PracticeItem } from '@/lib/practice-items';
import { filterPracticeBySection, type StudySectionFilter } from '@/lib/study-section';
import {
  defaultSnapshotEntry,
  snapshotToSkillTheta,
  type SkillSnapshot,
} from '@/lib/skill-snapshot';
import {
  advancePracticeStateAfterAttempt,
  buildFreshPracticeState,
  metaFromPracticeState,
  parsePracticeState,
  prismaSectionToKey,
  TRI_SECTION_ROUND_COOLDOWN_MS,
  type SectionKey,
} from '@/lib/practice-block';
import {
  fetchPracticeItemByExternalKey,
  sectionKeyToPrisma,
} from '@/lib/db-question-mapper';
import { pickRandomBankQuestion } from '@/lib/tri-section-pick';
import { loadUserAnsweredExternalKeys } from '@/lib/user-answered-keys';

export const dynamic = 'force-dynamic';

const TAG_SET = new Set<string>(Object.values(ErrorBehaviorTag));

type AttemptBody = {
  sessionId: string;
  excludedQuestionIds: string[];
  practiceSectionFilter?: StudySectionFilter;
  attempt: {
    questionId: string;
    timeMs: number;
    selectedKey: string;
    isCorrect: boolean;
    wasFlaggedGuess: boolean;
    scaffoldStepsUsed: number;
    reviewedConcept?: boolean;
    errorTag?: string | null;
  };
};

async function loadSnapshotForUser(userId: string): Promise<SkillSnapshot> {
  const skills = await prisma.skill.findMany({ select: { id: true, code: true } });
  const states = await prisma.userSkillState.findMany({
    where: { userId },
    include: { skill: { select: { code: true } } },
  });
  const byCode: SkillSnapshot = {};
  for (const s of skills) {
    byCode[s.code] = defaultSnapshotEntry();
  }
  for (const st of states) {
    byCode[st.skill.code] = {
      theta: st.theta,
      recentAccuracy: st.recentAccuracy,
    };
  }
  return byCode;
}

function pickNextLegacy(
  excluded: Set<string>,
  snapshot: SkillSnapshot,
  section: StudySectionFilter
): PracticeItem | null {
  const poolItems = filterPracticeBySection(PRACTICE_ITEMS, section);
  const pool = poolItems.map((p) => p.routable);
  if (!pool.length) return null;
  const next = selectNextAdaptive(pool, snapshotToSkillTheta(snapshot), { excludedIds: excluded });
  if (!next) return null;
  return getPracticeItemById(next.id) ?? null;
}

function answeredSectionKey(
  question: { section: Section } | null,
  practiceRow: PracticeItem
): SectionKey {
  if (question) return prismaSectionToKey(question.section);
  return practiceRow.section;
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to persist attempts & CAT state' }, { status: 401 });
  }

  let body: AttemptBody;
  try {
    body = (await req.json()) as AttemptBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { sessionId, excludedQuestionIds, attempt } = body;
  if (!sessionId || !attempt?.questionId) {
    return NextResponse.json({ error: 'sessionId and attempt.questionId required' }, { status: 400 });
  }

  const session = await prisma.studySession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const practiceRow =
    (await fetchPracticeItemByExternalKey(attempt.questionId)) ??
    getPracticeItemById(attempt.questionId);
  if (!practiceRow) {
    return NextResponse.json({ error: 'Unknown question' }, { status: 400 });
  }

  let errorEnum: ErrorBehaviorTag | null = null;
  if (attempt.errorTag && TAG_SET.has(attempt.errorTag)) {
    errorEnum = attempt.errorTag as ErrorBehaviorTag;
  }

  const question = await prisma.question.findFirst({
    where: { externalKey: attempt.questionId },
    include: { skills: { include: { skill: true } } },
  });

  const pace = classifyAttemptPace({
    timeMs: attempt.timeMs,
    timeTargetMs: practiceRow.timeTargetSec * 1000,
  });
  const panicFlag =
    attempt.wasFlaggedGuess || (pace === 'panic_like' && !attempt.isCorrect);

  if (question) {
    await prisma.questionAttempt.create({
      data: {
        sessionId,
        questionId: question.id,
        startedAt: new Date(Date.now() - attempt.timeMs),
        answeredAt: new Date(),
        timeMs: attempt.timeMs,
        selectedKey: attempt.selectedKey,
        isCorrect: attempt.isCorrect,
        wasFlaggedGuess: panicFlag,
        reviewedConcept: Boolean(attempt.reviewedConcept),
        scaffoldStepsUsed: Math.max(0, attempt.scaffoldStepsUsed ?? 0),
        errorTag: errorEnum,
      },
    });
  }

  const skillIds: string[] = [];
  if (question?.skills?.length) {
    for (const qs of question.skills) skillIds.push(qs.skillId);
  } else {
    for (const code of practiceRow.routable.skillIds) {
      const s = await prisma.skill.findUnique({ where: { code } });
      if (s) skillIds.push(s.id);
    }
  }

  const diff = question?.difficulty ?? practiceRow.routable.difficulty;
  const a = question?.discrimination ?? practiceRow.routable.discrimination;
  const c = question?.guessing ?? practiceRow.routable.guessing;

  for (const skillId of skillIds) {
    const state = await prisma.userSkillState.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });

    const theta = state?.theta ?? 0;
    const { nextTheta, se } = updateThetaAfterAttempt(theta, diff, attempt.isCorrect, a, c);

    const prevAcc = state?.recentAccuracy ?? 0.55;
    const acc = prevAcc * 0.78 + (attempt.isCorrect ? 0.22 : 0);

    await prisma.userSkillState.upsert({
      where: { userId_skillId: { userId, skillId } },
      create: {
        userId,
        skillId,
        theta: nextTheta,
        standardError: se,
        totalAttempts: 1,
        correctAttempts: attempt.isCorrect ? 1 : 0,
        streakCorrect: attempt.isCorrect ? 1 : 0,
        recentAccuracy: Math.min(0.99, Math.max(0.04, acc)),
      },
      update: {
        theta: nextTheta,
        standardError: se,
        totalAttempts: { increment: 1 },
        correctAttempts: { increment: attempt.isCorrect ? 1 : 0 },
        streakCorrect: attempt.isCorrect ? { increment: 1 } : { set: 0 },
        recentAccuracy: Math.min(0.99, Math.max(0.04, acc)),
      },
    });
  }

  const snapshot = await loadSnapshotForUser(userId);

  if (session.mode === 'tri_section_practice') {
    const prev =
      parsePracticeState(session.practiceState) ??
      buildFreshPracticeState(body.practiceSectionFilter ?? 'ALL');
    const sec = answeredSectionKey(question, practiceRow);
    const nextState = advancePracticeStateAfterAttempt(prev, sec, attempt.isCorrect);

    if (nextState.roundComplete) {
      const nextAllowed = new Date(Date.now() + TRI_SECTION_ROUND_COOLDOWN_MS);
      await prisma.studySession.update({
        where: { id: sessionId },
        data: {
          practiceState: nextState as object,
          endedAt: new Date(),
        },
      });
      await prisma.userPreference.upsert({
        where: { userId },
        create: {
          userId,
          theme: 'dark',
          mockExamHighFidelity: true,
          maxHintSteps: 3,
          triSectionNextAllowedAt: nextAllowed,
        },
        update: { triSectionNextAllowedAt: nextAllowed },
      });

      return NextResponse.json({
        skillSnapshot: snapshot,
        nextQuestion: null,
        persistedAttempt: Boolean(question),
        practiceMode: 'tri_section' as const,
        bankExhausted: false,
        roundComplete: true,
        cooldownUntil: nextAllowed.toISOString(),
        practiceMeta: metaFromPracticeState(nextState),
      });
    }

    const answered = await loadUserAnsweredExternalKeys(userId);
    const nextSlot = nextState.queue[nextState.index];
    const tier = nextState.tiers[nextSlot];
    const picked = await pickRandomBankQuestion(sectionKeyToPrisma(nextSlot), tier, answered);
    let nextQ: PracticeItem | null = null;
    if (picked?.externalKey) {
      nextQ = await fetchPracticeItemByExternalKey(picked.externalKey);
    }
    const bankExhausted = !nextQ;

    await prisma.studySession.update({
      where: { id: sessionId },
      data: { practiceState: nextState as object },
    });

    return NextResponse.json({
      skillSnapshot: snapshot,
      nextQuestion: nextQ,
      persistedAttempt: Boolean(question),
      practiceMode: 'tri_section' as const,
      bankExhausted,
      practiceMeta: metaFromPracticeState(nextState),
    });
  }

  const excluded = new Set(excludedQuestionIds ?? []);
  const section: StudySectionFilter = body.practiceSectionFilter ?? 'ALL';
  const nextQ = pickNextLegacy(excluded, snapshot, section);

  return NextResponse.json({
    skillSnapshot: snapshot,
    nextQuestion: nextQ,
    persistedAttempt: Boolean(question),
    practiceMode: 'legacy' as const,
  });
}
