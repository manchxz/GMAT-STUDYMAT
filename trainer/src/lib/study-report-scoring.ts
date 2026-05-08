import type { PracticeTier, Section } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { prismaSectionToKey } from '@/lib/practice-block';

export type ReportSectionKey = 'QUANT' | 'VERBAL' | 'DATA_INSIGHTS';

export function questionDifficultyWeight(
  practiceTier: PracticeTier | null,
  difficulty: number
): number {
  const tierMul =
    practiceTier === 'HARD' ? 3.5 : practiceTier === 'MID' ? 2 : practiceTier === 'EASY' ? 1 : 1.5;
  const d = Math.max(-1.2, Math.min(2.5, difficulty));
  const diffBoost = 1 + d * 0.12;
  return Math.round(tierMul * diffBoost * 1000) / 1000;
}

export type SectionReportSlice = {
  section: ReportSectionKey;
  label: string;
  lifetimeWeightedCorrect: number;
  lifetimeWeightedAttempted: number;
  weightedAccuracyPct: number;
  sectionScore: number;
  lastRoundWeightedCorrect: number;
  priorRoundWeightedCorrect: number;
  deltaVsPriorRound: number;
  attemptsLifetime: number;
  correctLifetime: number;
  priorityRank: number;
  studyFocus: string;
  lastRoundAttempts: number;
  lastRoundCorrect: number;
  textbookStartHref: string;
};

export type StudyReportCardPayload = {
  sections: SectionReportSlice[];
  studyOrder: ReportSectionKey[];
  headlineSummary: string;
  totalScoreEstimate: number;
  scoreFootnote: string;
  lastRoundEndedAt: string | null;
  priorRoundEndedAt: string | null;
  roundsCompared: number;
};

const SECTION_TEXTBOOK_START: Record<ReportSectionKey, string> = {
  QUANT: '/textbook/chapters/01-quant-number-properties.html',
  VERBAL: '/textbook/chapters/04-verbal-critical-reasoning.html',
  DATA_INSIGHTS: '/textbook/chapters/08-di-table-analysis.html',
};

const SECTION_ORDER: Section[] = ['QUANT', 'VERBAL', 'DATA_INSIGHTS'];

const LABELS: Record<ReportSectionKey, string> = {
  QUANT: 'Quantitative',
  VERBAL: 'Verbal',
  DATA_INSIGHTS: 'Data Insights',
};

function emptySlice(section: ReportSectionKey): SectionReportSlice {
  return {
    section,
    label: LABELS[section],
    lifetimeWeightedCorrect: 0,
    lifetimeWeightedAttempted: 0,
    weightedAccuracyPct: 0,
    sectionScore: 60,
    lastRoundWeightedCorrect: 0,
    priorRoundWeightedCorrect: 0,
    deltaVsPriorRound: 0,
    attemptsLifetime: 0,
    correctLifetime: 0,
    priorityRank: 0,
    studyFocus: '',
    lastRoundAttempts: 0,
    lastRoundCorrect: 0,
    textbookStartHref: SECTION_TEXTBOOK_START[section],
  };
}

function computeGmAtStyleSectionScore(
  weightedAccPct: number,
  attemptsLifetime: number,
  lifetimeWeightedCorrect: number
): number {
  if (attemptsLifetime === 0) return 60;
  const p = Math.max(0, Math.min(1, weightedAccPct / 100));
  const rawLinear = 60 + p * 30;
  const volumeSignal = 1 - Math.exp(-lifetimeWeightedCorrect / 28 - attemptsLifetime / 22);
  const shrunk = 75 + (rawLinear - 75) * Math.max(0.35, Math.min(1, volumeSignal));
  return Math.round(Math.min(90, Math.max(60, shrunk)));
}

function computeGmAtStyleTotalScore(q: number, v: number, di: number): number {
  const avg = (q + v + di) / 3;
  const unrounded = 205 + ((avg - 60) / 30) * 600;
  const bin = Math.round((unrounded - 205) / 10);
  return Math.min(805, Math.max(205, 205 + bin * 10));
}

function buildStudyFocus(
  slice: SectionReportSlice,
  rank: number,
  sectionCount: number
): string {
  const parts: string[] = [];
  if (slice.attemptsLifetime === 0) {
    return 'No lifetime data in this section yet — open the chapter below, then return here for easy-band practice.';
  }
  if (slice.lastRoundAttempts > 0) {
    parts.push(
      `This tri-section round: ${slice.lastRoundCorrect}/${slice.lastRoundAttempts} correct (unweighted count).`
    );
  }
  if (slice.deltaVsPriorRound < -0.25) {
    parts.push('Weighted points vs your prior round are down — revisit fundamentals before forcing HARD.');
  } else if (slice.deltaVsPriorRound > 0.25) {
    parts.push('Weighted points improved vs your prior round — good trajectory.');
  }
  if (slice.weightedAccuracyPct < 58 && slice.attemptsLifetime >= 5) {
    parts.push(
      'Difficulty-weighted accuracy is soft — spend structured time in the linked chapter before volume-only drilling.'
    );
  } else if (slice.weightedAccuracyPct >= 72 && slice.attemptsLifetime >= 6) {
    parts.push('Solid difficulty-weighted accuracy — keep mixing tiers so HARD stays honest.');
  }
  if (rank === 1) {
    parts.push('This is your top priority section for the next study block.');
  } else if (rank === sectionCount && slice.sectionScore >= 78) {
    parts.push('Relative strength right now — maintain with shorter touch sessions between deep dives elsewhere.');
  }
  if (parts.length === 0) {
    parts.push('Keep mixing difficulties; use misses to pick textbook sections, then return here.');
  }
  return parts.join(' ');
}

export async function buildStudyReportCard(userId: string): Promise<StudyReportCardPayload> {
  const attempts = await prisma.questionAttempt.findMany({
    where: {
      session: { userId },
      isCorrect: { not: null },
    },
    select: {
      isCorrect: true,
      sessionId: true,
      question: {
        select: { section: true, practiceTier: true, difficulty: true },
      },
      session: {
        select: { mode: true, endedAt: true },
      },
    },
  });

  const rows = attempts.filter(
    (a): a is typeof a & { question: NonNullable<typeof a.question> } =>
      a.question != null && a.session != null
  );

  const rounds = await prisma.studySession.findMany({
    where: { userId, mode: 'tri_section_practice', endedAt: { not: null } },
    orderBy: { endedAt: 'desc' },
    take: 3,
    select: { id: true, endedAt: true },
  });

  const lastSessionId = rounds[0]?.id;
  const priorSessionId = rounds[1]?.id;

  const bySection = new Map<ReportSectionKey, SectionReportSlice>();
  for (const s of SECTION_ORDER) {
    const k = prismaSectionToKey(s);
    bySection.set(k, emptySlice(k));
  }

  const lastRoundBySection = new Map<ReportSectionKey, number>();
  const priorRoundBySection = new Map<ReportSectionKey, number>();
  const lastRoundAttemptsBySection = new Map<ReportSectionKey, number>();
  const lastRoundCorrectBySection = new Map<ReportSectionKey, number>();
  for (const k of bySection.keys()) {
    lastRoundBySection.set(k, 0);
    priorRoundBySection.set(k, 0);
    lastRoundAttemptsBySection.set(k, 0);
    lastRoundCorrectBySection.set(k, 0);
  }

  for (const a of rows) {
    const sec = prismaSectionToKey(a.question.section);
    const w = questionDifficultyWeight(
      a.question.practiceTier ?? null,
      a.question.difficulty ?? 0
    );
    const slice = bySection.get(sec)!;
    slice.attemptsLifetime += 1;
    slice.lifetimeWeightedAttempted += w;
    if (a.isCorrect) {
      slice.correctLifetime += 1;
      slice.lifetimeWeightedCorrect += w;
    }

    if (lastSessionId && a.sessionId === lastSessionId) {
      lastRoundAttemptsBySection.set(sec, (lastRoundAttemptsBySection.get(sec) ?? 0) + 1);
      if (a.isCorrect) {
        lastRoundCorrectBySection.set(sec, (lastRoundCorrectBySection.get(sec) ?? 0) + 1);
      }
    }

    if (lastSessionId && a.sessionId === lastSessionId && a.isCorrect) {
      lastRoundBySection.set(sec, (lastRoundBySection.get(sec) ?? 0) + w);
    }
    if (priorSessionId && a.sessionId === priorSessionId && a.isCorrect) {
      priorRoundBySection.set(sec, (priorRoundBySection.get(sec) ?? 0) + w);
    }
  }

  const sections: SectionReportSlice[] = SECTION_ORDER.map((s) => {
    const k = prismaSectionToKey(s);
    const slice = bySection.get(k)!;
    slice.weightedAccuracyPct =
      slice.lifetimeWeightedAttempted > 0
        ? Math.round((100 * slice.lifetimeWeightedCorrect) / slice.lifetimeWeightedAttempted)
        : 0;
    slice.sectionScore = computeGmAtStyleSectionScore(
      slice.weightedAccuracyPct,
      slice.attemptsLifetime,
      slice.lifetimeWeightedCorrect
    );
    slice.lastRoundWeightedCorrect = Math.round((lastRoundBySection.get(k) ?? 0) * 100) / 100;
    slice.priorRoundWeightedCorrect = Math.round((priorRoundBySection.get(k) ?? 0) * 100) / 100;
    slice.deltaVsPriorRound =
      Math.round((slice.lastRoundWeightedCorrect - slice.priorRoundWeightedCorrect) * 100) / 100;
    slice.lastRoundAttempts = lastRoundAttemptsBySection.get(k) ?? 0;
    slice.lastRoundCorrect = lastRoundCorrectBySection.get(k) ?? 0;
    slice.textbookStartHref = SECTION_TEXTBOOK_START[k];
    return slice;
  });

  const prioritySorted = [...sections].sort((a, b) => {
    if (a.sectionScore !== b.sectionScore) return a.sectionScore - b.sectionScore;
    if (a.weightedAccuracyPct !== b.weightedAccuracyPct) return a.weightedAccuracyPct - b.weightedAccuracyPct;
    if (a.attemptsLifetime !== b.attemptsLifetime) return a.attemptsLifetime - b.attemptsLifetime;
    return a.lifetimeWeightedCorrect - b.lifetimeWeightedCorrect;
  });
  const studyOrder = prioritySorted.map((s) => s.section);
  const n = prioritySorted.length;
  prioritySorted.forEach((slice, i) => {
    slice.priorityRank = i + 1;
    slice.studyFocus = buildStudyFocus(slice, i + 1, n);
  });

  const headlineSummary = `Suggested study priority for your next block: ${studyOrder.map((key) => LABELS[key]).join(' → ')}.`;

  const bySec = new Map(sections.map((s) => [s.section, s]));
  const totalScoreEstimate = computeGmAtStyleTotalScore(
    bySec.get('QUANT')!.sectionScore,
    bySec.get('VERBAL')!.sectionScore,
    bySec.get('DATA_INSIGHTS')!.sectionScore
  );

  const scoreFootnote =
    'These values use GMAT Focus–style scales (60–90 per section, 205–805 total in tens) for readability only. They are generated from this app’s bank—not by GMAC—and are not official or predictive scores.';

  return {
    sections,
    studyOrder,
    headlineSummary,
    totalScoreEstimate,
    scoreFootnote,
    lastRoundEndedAt: rounds[0]?.endedAt?.toISOString() ?? null,
    priorRoundEndedAt: rounds[1]?.endedAt?.toISOString() ?? null,
    roundsCompared: rounds.length,
  };
}
