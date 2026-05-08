import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import { selectNextAdaptive } from '@/lib/adaptive-router';
import { PRACTICE_ITEMS, getPracticeItemById, type PracticeItem } from '@/lib/practice-items';
import {
  buildFreshPracticeState,
  metaFromPracticeState,
  parsePracticeState,
} from '@/lib/practice-block';
import {
  defaultSnapshotEntry,
  snapshotToSkillTheta,
  type SkillSnapshot,
} from '@/lib/skill-snapshot';
import { parseStudySectionParam, type StudySectionFilter } from '@/lib/study-section';
import { fetchPracticeItemByExternalKey } from '@/lib/db-question-mapper';
import { pickRandomBankQuestion } from '@/lib/tri-section-pick';
import { sectionKeyToPrisma } from '@/lib/db-question-mapper';
import { loadUserAnsweredExternalKeys } from '@/lib/user-answered-keys';
import { pickGuestPracticeItem } from '@/lib/guest-tri-pick';

export const dynamic = 'force-dynamic';

export type StudyBootstrapResponse = {
  sessionId: string | null;
  guest: boolean;
  skillSnapshot: SkillSnapshot;
  nextQuestion: PracticeItem | null;
  dbDegraded?: boolean;
  practiceMode: 'tri_section' | 'legacy' | 'guest_tri';
  bankExhausted?: boolean;
  practiceMeta?: ReturnType<typeof metaFromPracticeState>;
  cooldownUntil?: string;
  guestPracticeState?: ReturnType<typeof buildFreshPracticeState>;
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
  for (const q of PRACTICE_ITEMS) {
    for (const code of q.routable.skillIds) {
      if (!byCode[code]) byCode[code] = defaultSnapshotEntry();
    }
  }
  return byCode;
}

function pickNextLegacyQuestion(excludedIds: Set<string>, snapshot: SkillSnapshot): PracticeItem | null {
  const pool = PRACTICE_ITEMS.map((p) => p.routable);
  const theta = snapshotToSkillTheta(snapshot);
  const next = selectNextAdaptive(pool, theta, { excludedIds });
  if (!next) return null;
  return getPracticeItemById(next.id) ?? null;
}

async function pickNextForPracticeState(
  userId: string,
  practiceState: ReturnType<typeof buildFreshPracticeState>
): Promise<PracticeItem | null> {
  const answered = await loadUserAnsweredExternalKeys(userId);
  if (practiceState.roundComplete || practiceState.index >= practiceState.queue.length) return null;
  const slot = practiceState.queue[practiceState.index];
  const tier = practiceState.tiers[slot];
  const picked = await pickRandomBankQuestion(sectionKeyToPrisma(slot), tier, answered);
  if (picked?.externalKey) return fetchPracticeItemByExternalKey(picked.externalKey);
  return null;
}

async function resumeTriSectionSession(
  session: { id: string; practiceState: unknown },
  userId: string,
  snapshot: SkillSnapshot
): Promise<StudyBootstrapResponse | null> {
  const st = parsePracticeState(session.practiceState);
  if (!st || st.roundComplete || st.index >= st.queue.length) return null;
  const nextQuestion = await pickNextForPracticeState(userId, st);
  if (!nextQuestion) {
    return {
      sessionId: session.id,
      guest: false,
      skillSnapshot: snapshot,
      nextQuestion: null,
      dbDegraded: false,
      practiceMode: 'tri_section',
      bankExhausted: true,
      practiceMeta: metaFromPracticeState(st),
    };
  }
  return {
    sessionId: session.id,
    guest: false,
    skillSnapshot: snapshot,
    nextQuestion,
    dbDegraded: false,
    practiceMode: 'tri_section',
    practiceMeta: metaFromPracticeState(st),
  };
}

async function startTriSectionSession(
  userId: string,
  sectionFilter: StudySectionFilter,
  snapshot: SkillSnapshot
): Promise<StudyBootstrapResponse> {
  await prisma.studySession.updateMany({
    where: { userId, mode: 'tri_section_practice', endedAt: null },
    data: { endedAt: new Date() },
  });

  const answered = await loadUserAnsweredExternalKeys(userId);
  const practiceState = buildFreshPracticeState(sectionFilter);
  const firstSection = practiceState.queue[0];
  const tier = practiceState.tiers[firstSection];
  const picked = await pickRandomBankQuestion(sectionKeyToPrisma(firstSection), tier, answered);
  let nextQuestion: PracticeItem | null = null;
  if (picked?.externalKey) {
    nextQuestion = await fetchPracticeItemByExternalKey(picked.externalKey);
  }

  if (!nextQuestion) {
    return {
      sessionId: null,
      guest: false,
      skillSnapshot: snapshot,
      nextQuestion: null,
      dbDegraded: false,
      practiceMode: 'tri_section',
      bankExhausted: true,
      practiceMeta: metaFromPracticeState(practiceState),
    };
  }

  const session = await prisma.studySession.create({
    data: {
      userId,
      mode: 'tri_section_practice',
      practiceState: practiceState as object,
    },
  });

  return {
    sessionId: session.id,
    guest: false,
    skillSnapshot: snapshot,
    nextQuestion,
    dbDegraded: false,
    practiceMode: 'tri_section',
    practiceMeta: metaFromPracticeState(practiceState),
  };
}

async function runBootstrap(sectionFilter: StudySectionFilter): Promise<StudyBootstrapResponse> {
  const userId = await getSessionUserId();
  const excluded = new Set<string>();

  if (!userId) {
    const snapshot: SkillSnapshot = {};
    for (const q of PRACTICE_ITEMS) {
      for (const code of q.routable.skillIds) {
        if (!snapshot[code]) snapshot[code] = defaultSnapshotEntry();
      }
    }
    const guestPracticeState = buildFreshPracticeState(sectionFilter);
    const first =
      pickGuestPracticeItem(guestPracticeState, excluded) ??
      pickNextLegacyQuestion(excluded, snapshot) ??
      PRACTICE_ITEMS[0];
    return {
      sessionId: null,
      guest: true,
      skillSnapshot: snapshot,
      nextQuestion: first,
      practiceMode: 'guest_tri',
      guestPracticeState,
      practiceMeta: metaFromPracticeState(guestPracticeState),
    };
  }

  try {
    const pref = await prisma.userPreference.findUnique({ where: { userId } });
    if (pref?.triSectionNextAllowedAt && pref.triSectionNextAllowedAt > new Date()) {
      const snapshot = await loadSnapshotForUser(userId);
      return {
        sessionId: null,
        guest: false,
        skillSnapshot: snapshot,
        nextQuestion: null,
        dbDegraded: false,
        practiceMode: 'tri_section',
        cooldownUntil: pref.triSectionNextAllowedAt.toISOString(),
      };
    }

    const snapshot = await loadSnapshotForUser(userId);

    const openSession = await prisma.studySession.findFirst({
      where: { userId, mode: 'tri_section_practice', endedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    if (openSession?.practiceState) {
      const parsed = parsePracticeState(openSession.practiceState);
      if (
        parsed &&
        !parsed.roundComplete &&
        parsed.index < parsed.queue.length &&
        parsed.sectionFilter === sectionFilter
      ) {
        const resumed = await resumeTriSectionSession(openSession, userId, snapshot);
        if (resumed) return resumed;
      }
      await prisma.studySession.update({
        where: { id: openSession.id },
        data: { endedAt: new Date() },
      });
    }

    return await startTriSectionSession(userId, sectionFilter, snapshot);
  } catch (e) {
    console.error('[study/bootstrap]', e);
    const snapshot: SkillSnapshot = {};
    for (const q of PRACTICE_ITEMS) {
      for (const code of q.routable.skillIds) {
        if (!snapshot[code]) snapshot[code] = defaultSnapshotEntry();
      }
    }
    const first = pickNextLegacyQuestion(excluded, snapshot) ?? PRACTICE_ITEMS[0];
    return {
      sessionId: null,
      guest: false,
      skillSnapshot: snapshot,
      nextQuestion: first,
      dbDegraded: true,
      practiceMode: 'legacy',
    };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sectionFilter = parseStudySectionParam(searchParams.get('section'));
  return NextResponse.json(await runBootstrap(sectionFilter));
}

export async function POST(req: Request) {
  let sectionFilter: StudySectionFilter = 'ALL';
  try {
    const body = (await req.json()) as { sectionFilter?: string };
    sectionFilter = parseStudySectionParam(body?.sectionFilter ?? null);
  } catch {
    /* default ALL */
  }
  return NextResponse.json(await runBootstrap(sectionFilter));
}
