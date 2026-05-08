'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  SplitPaneStudy,
  type AttemptFinalizePayload,
  type SessionAttemptLog,
} from '@/components/study/SplitPaneStudy';
import { ThemeSwitcher } from '@/components/system/ThemeSwitcher';
import { rankAdaptiveCandidates, blendedTheta, selectNextAdaptive } from '@/lib/adaptive-router';
import { PRACTICE_ITEMS, getPracticeItemById, type PracticeItem } from '@/lib/practice-items';
import { textbookPathForSkill } from '@/lib/skill-textbook-links';
import {
  applyAttemptToSnapshot,
  snapshotToSkillTheta,
  type SkillSnapshot,
} from '@/lib/skill-snapshot';
import {
  STUDY_SECTION_LABELS,
  filterPracticeBySection,
  type StudySectionFilter,
} from '@/lib/study-section';
import { buildRoutingExplanation, challengeMeterPercent } from '@/lib/study-routing-meta';
import { summarizeSprintAttempts } from '@/lib/time-analytics';
import {
  advancePracticeStateAfterAttempt,
  buildFreshPracticeState,
  metaFromPracticeState,
  TRI_SECTION_ROUND_COOLDOWN_MS,
  type PracticeStateV1,
} from '@/lib/practice-block';
import { pickGuestPracticeItem } from '@/lib/guest-tri-pick';
import { StudyReportCard } from '@/components/study/StudyReportCard';
import type { StudyReportCardPayload } from '@/lib/study-report-scoring';

type PracticeMeta = {
  blockSize: number;
  blockIndex: number;
  blockNumber: number;
  currentSection: 'QUANT' | 'VERBAL' | 'DATA_INSIGHTS';
  currentTier: 'EASY' | 'MID' | 'HARD';
};

type Bootstrap = {
  sessionId: string | null;
  guest: boolean;
  skillSnapshot: SkillSnapshot;
  nextQuestion: PracticeItem | null;
  dbDegraded?: boolean;
  practiceMode?: 'tri_section' | 'legacy' | 'guest_tri';
  bankExhausted?: boolean;
  practiceMeta?: PracticeMeta;
  cooldownUntil?: string;
  guestPracticeState?: PracticeStateV1;
};

const GUEST_TRI_COOLDOWN_LS = 'gmat_guest_tri_next_allowed_at';

const TRI_HINT =
  '**Mixed practice round:** **5** questions per section (**15** total when you pick all sections). **Level:** a correct answer bumps that section up a notch (easier → medium → harder). One miss keeps the same level; two misses in a row step it down. After **15** questions (or **5** in one section), take a **5-minute** break before the next round.';

type SprintRollupLite = {
  attempts: number;
  correct: number;
  avgTimeMs: number;
  panicGuessRate: number;
  overInvestRate: number;
};

const SPRINT_MS = 15 * 60 * 1000;

function StudyNavHome({ guest }: { guest: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.35em] opacity-70">
        ← Home
      </Link>
      {!guest ? (
        <Link
          href="/review"
          className="font-mono text-[11px] uppercase tracking-[0.35em] text-[color:var(--accent)]"
        >
          Review mistakes
        </Link>
      ) : null}
    </div>
  );
}

export function StudyShell() {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [question, setQuestion] = useState<PracticeItem | null>(null);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [skillSnapshot, setSkillSnapshot] = useState<SkillSnapshot>({});
  const snapshotRef = useRef<SkillSnapshot>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [guest, setGuest] = useState(true);
  const [poolDone, setPoolDone] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [sprintHint, setSprintHint] = useState<string | null>(null);
  const [dbDegraded, setDbDegraded] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<StudySectionFilter>('ALL');
  const [sessionLog, setSessionLog] = useState<SessionAttemptLog[]>([]);
  const [lastSprintRollup, setLastSprintRollup] = useState<SprintRollupLite | null>(null);
  const [practiceMode, setPracticeMode] = useState<'tri_section' | 'legacy' | 'guest_tri' | null>(null);
  const [practiceMeta, setPracticeMeta] = useState<PracticeMeta | null>(null);
  const [bankExhausted, setBankExhausted] = useState(false);
  const [guestTriState, setGuestTriState] = useState<PracticeStateV1 | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const [reportCard, setReportCard] = useState<StudyReportCardPayload | null>(null);

  const sprintStart = useRef<number | null>(null);
  const sprintRows = useRef<
    { timeMs: number; isCorrect: boolean; wasFlaggedGuess?: boolean; timeTargetMs?: number }[]
  >([]);

  useEffect(() => {
    snapshotRef.current = skillSnapshot;
  }, [skillSnapshot]);

  const applyBootstrapPayload = useCallback((data: Bootstrap) => {
    setBoot(data);
    setPracticeMode(data.practiceMode ?? (data.guest ? 'guest_tri' : 'tri_section'));
    setPracticeMeta(data.practiceMeta ?? null);
    setBankExhausted(Boolean(data.bankExhausted));
    setQuestion(data.nextQuestion);
    setSkillSnapshot(data.skillSnapshot);
    snapshotRef.current = data.skillSnapshot;
    setSessionId(data.sessionId);
    setGuest(data.guest);
    setDbDegraded(Boolean(data.dbDegraded));
    setUsedIds([]);
    setPoolDone(false);
    setSessionLog([]);
    if (data.cooldownUntil) setCooldownUntil(data.cooldownUntil);
    else if (!data.guest) setCooldownUntil(null);
    if (data.guestPracticeState) setGuestTriState(data.guestPracticeState);
    else if (!data.guest) setGuestTriState(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = new URLSearchParams();
        q.set('section', sectionFilter);
        const r = await fetch(`/api/study/bootstrap?${q.toString()}`);
        if (!r.ok) throw new Error('Bootstrap failed');
        const data = (await r.json()) as Bootstrap;
        if (cancelled) return;
        applyBootstrapPayload(data);
      } catch {
        if (!cancelled) setLoadErr('Could not start study session. Check database and try again.');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once with ALL; drill uses POST bootstrap
  }, []);

  useEffect(() => {
    if (!boot?.guest) return;
    const raw = localStorage.getItem(GUEST_TRI_COOLDOWN_LS);
    if (!raw) return;
    const until = Number(raw);
    if (until > Date.now()) {
      setCooldownUntil(new Date(until).toISOString());
      setQuestion(null);
    }
  }, [boot?.guest]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  useEffect(() => {
    if (!cooldownUntil) return;
    if (new Date(cooldownUntil).getTime() <= Date.now()) {
      setCooldownUntil(null);
      localStorage.removeItem(GUEST_TRI_COOLDOWN_LS);
      void (async () => {
        const q = new URLSearchParams();
        q.set('section', sectionFilter);
        const r = await fetch(`/api/study/bootstrap?${q.toString()}`);
        if (r.ok) applyBootstrapPayload((await r.json()) as Bootstrap);
      })();
    }
  }, [cooldownUntil, nowTick, sectionFilter, applyBootstrapPayload]);

  const refreshReportCard = useCallback(async () => {
    try {
      const r = await fetch('/api/study/report-card');
      if (r.ok) {
        setReportCard((await r.json()) as StudyReportCardPayload);
      } else {
        setReportCard(null);
      }
    } catch {
      setReportCard(null);
    }
  }, []);

  useEffect(() => {
    if (guest) setReportCard(null);
  }, [guest]);

  useEffect(() => {
    if (guest || !cooldownUntil) return;
    void refreshReportCard();
  }, [guest, cooldownUntil, refreshReportCard]);

  const guestCooldownRecap = useMemo(() => {
    if (!guest) return null;
    const keys = ['QUANT', 'VERBAL', 'DATA_INSIGHTS'] as const;
    const tallies = new Map<string, { c: number; t: number }>();
    for (const k of keys) tallies.set(k, { c: 0, t: 0 });
    for (const row of sessionLog) {
      const ent = tallies.get(row.section);
      if (!ent) continue;
      ent.t += 1;
      if (row.isCorrect) ent.c += 1;
    }
    const any = keys.some((k) => (tallies.get(k)?.t ?? 0) > 0);
    if (!any) return null;
    const rows = keys.map((k) => {
      const { c: correct, t: total } = tallies.get(k)!;
      return {
        key: k,
        label: STUDY_SECTION_LABELS[k],
        correct,
        total,
        pct: total > 0 ? Math.round((100 * correct) / total) : null,
      };
    });
    const ranked = [...rows].sort((a, b) => {
      const ra = a.total ? a.correct / a.total : 1;
      const rb = b.total ? b.correct / b.total : 1;
      if (ra !== rb) return ra - rb;
      return a.total - b.total;
    });
    const focus = ranked.find((r) => r.total > 0) ?? null;
    return { rows, focus };
  }, [guest, sessionLog]);

  const poolItems = useMemo(
    () => filterPracticeBySection(PRACTICE_ITEMS, sectionFilter),
    [sectionFilter]
  );
  const poolRoutables = useMemo(() => poolItems.map((p) => p.routable), [poolItems]);

  const applySectionFilter = useCallback(
    async (next: StudySectionFilter) => {
      setSectionFilter(next);
      const useLocal =
        guest ||
        practiceMode === 'legacy' ||
        practiceMode === 'guest_tri' ||
        practiceMode === null;

      if (useLocal) {
        if (guest) {
          const raw = localStorage.getItem(GUEST_TRI_COOLDOWN_LS);
          if (raw && Number(raw) > Date.now()) {
            setCooldownUntil(new Date(Number(raw)).toISOString());
            setQuestion(null);
            return;
          }
          const gState = buildFreshPracticeState(next);
          const first = pickGuestPracticeItem(gState, new Set());
          if (!first) {
            setPoolDone(true);
            setQuestion(null);
            return;
          }
          setGuestTriState(gState);
          setPracticeMode('guest_tri');
          setPracticeMeta(metaFromPracticeState(gState));
          setPoolDone(false);
          setBankExhausted(false);
          setUsedIds([]);
          setQuestion(first);
          return;
        }

        const pool = filterPracticeBySection(PRACTICE_ITEMS, next);
        if (!pool.length) {
          setPoolDone(true);
          setQuestion(null);
          return;
        }
        setPoolDone(false);
        setBankExhausted(false);
        setUsedIds([]);
        const theta = snapshotToSkillTheta(snapshotRef.current);
        const picked = selectNextAdaptive(
          pool.map((p) => p.routable),
          theta,
          { excludedIds: new Set() }
        );
        const row = picked ? getPracticeItemById(picked.id) : pool[0];
        if (row) setQuestion(row);
        return;
      }

      try {
        const r = await fetch('/api/study/bootstrap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionFilter: next }),
        });
        if (!r.ok) throw new Error('bootstrap');
        const data = (await r.json()) as Bootstrap;
        applyBootstrapPayload(data);
      } catch {
        const pool = filterPracticeBySection(PRACTICE_ITEMS, next);
        setPracticeMode('legacy');
        if (!pool.length) {
          setPoolDone(true);
          setQuestion(null);
          return;
        }
        const theta = snapshotToSkillTheta(snapshotRef.current);
        const picked = selectNextAdaptive(
          pool.map((p) => p.routable),
          theta,
          { excludedIds: new Set() }
        );
        const row = picked ? getPracticeItemById(picked.id) : pool[0];
        if (row) setQuestion(row);
      }
    },
    [guest, practiceMode, applyBootstrapPayload]
  );

  const maybeRunSprintPredict = useCallback(
    async (snapshot: SkillSnapshot) => {
      if (guest) return;
      const start = sprintStart.current;
      if (start === null) {
        sprintStart.current = Date.now();
        return;
      }
      if (Date.now() - start < SPRINT_MS) return;

      const rollup = summarizeSprintAttempts(sprintRows.current);
      setLastSprintRollup(rollup);
      sprintRows.current = [];
      sprintStart.current = Date.now();

      try {
        const skillSnapshotForPredict = Object.fromEntries(
          Object.entries(snapshot).map(([k, v]) => [k, { theta: v.theta, recentAccuracy: v.recentAccuracy }])
        );
        const res = await fetch('/api/sprint/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rollup, skillSnapshot: skillSnapshotForPredict }),
        });
        if (res.ok) {
          const j = (await res.json()) as { predictedScoreDelta: number };
          setSprintHint(
            `15-min window closed · modeled lift ≈ ${j.predictedScoreDelta >= 0 ? '+' : ''}${j.predictedScoreDelta} (composite index)`
          );
        }
      } catch {
        /* optional */
      }
    },
    [guest]
  );

  const studyMeta = useMemo(() => {
    if (!question) {
      return {
        sessionOrdinal: 1,
        sessionTotal: Math.max(1, poolItems.length),
        sectionFilter,
        routingExplanation: 'Loading…',
        challengePercent: 50,
        routingRank: 0,
        textbookHref: null as string | null,
        sectionLabel: STUDY_SECTION_LABELS[sectionFilter],
        practiceBlockHint: null as string | null,
      };
    }
    if ((practiceMode === 'tri_section' || practiceMode === 'guest_tri') && practiceMeta) {
      const thetaHat = blendedTheta(snapshotToSkillTheta(skillSnapshot), question.routable.skillIds);
      const tb =
        textbookPathForSkill(question.skillCode) ??
        textbookPathForSkill(question.routable.skillIds[0] ?? '') ??
        null;
      const tierLabel =
        practiceMeta.currentTier === 'EASY'
          ? 'Easier'
          : practiceMeta.currentTier === 'MID'
            ? 'Medium'
            : 'Harder';
      const drawLabel = STUDY_SECTION_LABELS[practiceMeta.currentSection];
      return {
        sessionOrdinal: practiceMeta.blockIndex + 1,
        sessionTotal: Math.max(1, practiceMeta.blockSize),
        sectionFilter,
        routingExplanation: TRI_HINT,
        challengePercent: challengeMeterPercent(thetaHat, question.routable.difficulty),
        routingRank: 0,
        textbookHref: tb,
        sectionLabel: STUDY_SECTION_LABELS[sectionFilter],
        practiceBlockHint: `${drawLabel} · **${tierLabel}** · round **${practiceMeta.blockNumber + 1}**`,
      };
    }
    const ranked = rankAdaptiveCandidates(poolRoutables, snapshotToSkillTheta(skillSnapshot), {
      excludedIds: new Set(usedIds),
    });
    const rankIndex = ranked.findIndex((r) => r.q.id === question.routable.id);
    const thetaHat = blendedTheta(snapshotToSkillTheta(skillSnapshot), question.routable.skillIds);
    const explanation =
      rankIndex >= 0
        ? buildRoutingExplanation(question.routable, ranked, rankIndex)
        : 'Question set refreshed—details update after your next answer.';
    const tb =
      textbookPathForSkill(question.skillCode) ??
      textbookPathForSkill(question.routable.skillIds[0] ?? '') ??
      null;
    return {
      sessionOrdinal: usedIds.length + 1,
      sessionTotal: Math.max(1, poolItems.length),
      sectionFilter,
      routingExplanation: explanation,
      challengePercent: challengeMeterPercent(thetaHat, question.routable.difficulty),
      routingRank: Math.max(0, rankIndex),
      textbookHref: tb,
      sectionLabel: STUDY_SECTION_LABELS[sectionFilter],
      practiceBlockHint: null as string | null,
    };
  }, [
    question,
    skillSnapshot,
    usedIds,
    poolRoutables,
    poolItems.length,
    sectionFilter,
    practiceMode,
    practiceMeta,
  ]);

  const handleFinalize = useCallback(
    async (payload: AttemptFinalizePayload) => {
      const item =
        PRACTICE_ITEMS.find((q) => q.routable.id === payload.questionId) ?? question ?? null;
      if (!item) return;
      const nextExcluded = [...usedIds, payload.questionId];

      setSessionLog((prev) => [
        ...prev,
        {
          questionId: payload.questionId,
          skillCode: item.skillCode,
          section: item.section,
          timeMs: payload.timeMs,
          isCorrect: payload.isCorrect,
          selectedKey: payload.selectedKey,
          confidence: payload.confidence,
          errorTag: payload.errorTag,
          guessFlag: payload.wasFlaggedGuess,
          at: new Date().toISOString(),
        },
      ]);

      sprintRows.current.push({
        timeMs: payload.timeMs,
        isCorrect: payload.isCorrect,
        wasFlaggedGuess: payload.wasFlaggedGuess,
        timeTargetMs: item.timeTargetSec * 1000,
      });

      const advanceLocal = (merged: SkillSnapshot) => {
        snapshotRef.current = merged;
        setSkillSnapshot(merged);
        void maybeRunSprintPredict(merged);
        const theta = snapshotToSkillTheta(merged);
        const pool = filterPracticeBySection(PRACTICE_ITEMS, sectionFilter);
        const rout = pool.map((p) => p.routable);
        if (!rout.length) {
          setPoolDone(true);
          return;
        }
        const next = selectNextAdaptive(rout, theta, {
          excludedIds: new Set(nextExcluded),
        });
        if (!next) setPoolDone(true);
        else {
          const nq = getPracticeItemById(next.id);
          if (nq) setQuestion(nq);
        }
        setUsedIds(nextExcluded);
      };

      if (practiceMode === 'guest_tri' && guestTriState) {
        const merged = applyAttemptToSnapshot(snapshotRef.current, item, payload.isCorrect);
        snapshotRef.current = merged;
        setSkillSnapshot(merged);
        const nextState = advancePracticeStateAfterAttempt(
          guestTriState,
          item.section,
          payload.isCorrect
        );
        setGuestTriState(nextState);
        setPracticeMeta(metaFromPracticeState(nextState));
        void maybeRunSprintPredict(merged);
        if (nextState.roundComplete) {
          const until = Date.now() + TRI_SECTION_ROUND_COOLDOWN_MS;
          localStorage.setItem(GUEST_TRI_COOLDOWN_LS, String(until));
          setCooldownUntil(new Date(until).toISOString());
          setPoolDone(true);
          setQuestion(null);
          setUsedIds(nextExcluded);
          return;
        }
        const nextQ = pickGuestPracticeItem(nextState, new Set(nextExcluded));
        if (!nextQ) {
          setPoolDone(true);
          setQuestion(null);
        } else {
          setQuestion(nextQ);
        }
        setUsedIds(nextExcluded);
        return;
      }

      if (guest || !sessionId) {
        const merged = applyAttemptToSnapshot(snapshotRef.current, item, payload.isCorrect);
        advanceLocal(merged);
        return;
      }

      try {
        const res = await fetch('/api/study/attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            excludedQuestionIds: nextExcluded,
            practiceSectionFilter: sectionFilter,
            attempt: {
              questionId: payload.questionId,
              timeMs: payload.timeMs,
              selectedKey: payload.selectedKey,
              isCorrect: payload.isCorrect,
              wasFlaggedGuess: payload.wasFlaggedGuess,
              scaffoldStepsUsed: payload.scaffoldStepsUsed,
              errorTag: payload.errorTag,
            },
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            skillSnapshot: SkillSnapshot;
            nextQuestion: PracticeItem | null;
            bankExhausted?: boolean;
            practiceMeta?: PracticeMeta;
            roundComplete?: boolean;
            cooldownUntil?: string;
          };
          snapshotRef.current = data.skillSnapshot;
          setSkillSnapshot(data.skillSnapshot);
          setUsedIds(nextExcluded);
          void maybeRunSprintPredict(data.skillSnapshot);
          if (data.practiceMeta) setPracticeMeta(data.practiceMeta);
          if (data.cooldownUntil) setCooldownUntil(data.cooldownUntil);
          if (!data.nextQuestion) {
            setPoolDone(true);
            setQuestion(null);
            if (data.bankExhausted) setBankExhausted(true);
          } else {
            setQuestion(data.nextQuestion);
            setBankExhausted(false);
          }
          return;
        }
      } catch {
        /* fall through */
      }

      const merged = applyAttemptToSnapshot(snapshotRef.current, item, payload.isCorrect);
      advanceLocal(merged);
    },
    [
      guest,
      sessionId,
      usedIds,
      question,
      maybeRunSprintPredict,
      sectionFilter,
      practiceMode,
      guestTriState,
    ]
  );

  const exportSessionJson = useCallback(() => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            sectionFilter,
            attempts: sessionLog,
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gmat-study-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sessionLog, sectionFilter]);

  if (loadErr) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-[color:var(--muted)]">{loadErr}</p>
        <Link href="/" className="mt-6 inline-block text-[color:var(--accent)]">
          ← Home
        </Link>
      </div>
    );
  }

  if (!boot) {
    return (
      <div className="mx-auto px-6 py-24 text-center font-mono text-sm text-[color:var(--muted)]">
        Loading study engine…
      </div>
    );
  }

  const cooldownRemainingSec =
    cooldownUntil != null
      ? Math.max(0, Math.ceil((new Date(cooldownUntil).getTime() - Date.now()) / 1000))
      : 0;

  if (cooldownRemainingSec > 0) {
    const mm = String(Math.floor(cooldownRemainingSec / 60)).padStart(2, '0');
    const ss = String(cooldownRemainingSec % 60).padStart(2, '0');
    return (
      <>
        <header
          className="sticky top-0 z-40 border-b bg-[color:var(--bg)]/90 px-4 py-4 backdrop-blur"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4">
            <StudyNavHome guest={guest} />
            <ThemeSwitcher />
          </div>
        </header>
        <div className="mx-auto max-w-3xl px-6 py-12 text-center">
          <p className="text-lg font-semibold text-[color:var(--ink)]">Round complete</p>
          <p className="mt-4 font-mono text-3xl tabular-nums text-[color:var(--accent)]">
            {mm}:{ss}
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            A new tri-section round will unlock after a <strong>5-minute</strong> break. The timer
            updates automatically; use the report below to plan what to study before the next round.
          </p>
          <p className="mt-4 text-xs text-[color:var(--muted)]">
            {guest
              ? 'Guest rounds reset locally on this device.'
              : 'Signed-in cooldown is tied to your account.'}
          </p>
        </div>
        <div className="mx-auto max-w-3xl px-6 pb-24">
          {!guest && reportCard && (
            <StudyReportCard data={reportCard} onRefresh={() => void refreshReportCard()} />
          )}
          {guest && guestCooldownRecap && (
            <section
              className="rounded-2xl border px-4 py-5 sm:px-6 sm:py-6 text-left"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
              aria-label="Guest round recap"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">
                This round · by section
              </p>
              {guestCooldownRecap.focus && guestCooldownRecap.focus.pct !== null && (
                <p className="mt-2 text-sm text-[color:var(--ink)]">
                  Weakest area this round: <strong>{guestCooldownRecap.focus.label}</strong> (
                  {guestCooldownRecap.focus.correct}/{guestCooldownRecap.focus.total} correct ·{' '}
                  {guestCooldownRecap.focus.pct}%). Sign in to unlock a full weighted report card across
                  all your attempts.
                </p>
              )}
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--muted)]">
                {guestCooldownRecap.rows.map((r) => (
                  <li key={r.key} className="flex flex-wrap justify-between gap-2 border-t pt-2 first:border-t-0 first:pt-0" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[color:var(--ink)]">{r.label}</span>
                    <span className="tabular-nums">
                      {r.total > 0 ? (
                        <>
                          {r.correct}/{r.total} ({r.pct}%)
                        </>
                      ) : (
                        <span className="text-[color:var(--muted)]">—</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {guest && !guestCooldownRecap && (
            <p className="text-center text-sm text-[color:var(--muted)]">
              Round stats will appear here after you complete items. If you reloaded mid-cooldown, start a
              new round when the timer ends to capture a recap.
            </p>
          )}
        </div>
      </>
    );
  }

  if (
    !question &&
    (poolDone || bankExhausted || (practiceMode === 'legacy' && poolItems.length === 0))
  ) {
    const triRoundDone =
      poolDone &&
      !bankExhausted &&
      (practiceMode === 'tri_section' || practiceMode === 'guest_tri');
    return (
      <>
        <header
          className="sticky top-0 z-40 border-b bg-[color:var(--bg)]/90 px-4 py-4 backdrop-blur"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4">
            <StudyNavHome guest={guest} />
            <ThemeSwitcher />
          </div>
        </header>
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <p className="text-lg font-semibold text-[color:var(--ink)]">
            {poolItems.length === 0
              ? 'No items in this section yet'
              : bankExhausted
                ? 'You have cleared all practice questions available'
                : triRoundDone
                  ? 'Round complete'
                  : 'Practice pool complete'}
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {bankExhausted
              ? 'You answered every item in the database for this drill mode. New content may be added over time — check back later.'
              : triRoundDone
                ? 'You finished this 15-question block (5 per section when “All sections” is on). If the cooldown has not started, reload the page.'
                : 'Start a new block from the drill menu or reload the page.'}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="rounded-lg border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => applySectionFilter('ALL')}
            >
              All sections
            </button>
            <button
              type="button"
              className="rounded-lg bg-[color:var(--accent)] px-6 py-3 font-semibold text-black"
              onClick={() => globalThis.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!question) {
    return (
      <div className="mx-auto px-6 py-24 text-center font-mono text-sm text-[color:var(--muted)]">
        Loading study engine…
      </div>
    );
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b bg-[color:var(--bg)]/90 px-4 py-4 backdrop-blur"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <StudyNavHome guest={guest} />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Drill
              <select
                value={sectionFilter}
                onChange={(e) => applySectionFilter(e.target.value as StudySectionFilter)}
                className="rounded border bg-[color:var(--panel)] px-2 py-1.5 text-[11px] font-semibold normal-case text-[color:var(--ink)]"
                style={{ borderColor: 'var(--border)' }}
              >
                {(Object.keys(STUDY_SECTION_LABELS) as StudySectionFilter[]).map((k) => (
                  <option key={k} value={k}>
                    {STUDY_SECTION_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            {dbDegraded && (
              <span className="max-w-md font-mono text-[10px] text-amber-300">
                DB offline — local practice; attempts not saved.
              </span>
            )}
            {guest && (
              <span className="font-mono text-[10px] text-[color:var(--muted)]">
                Guest · sign in to persist θ + attempts
              </span>
            )}
            {sprintHint && (
              <span className="max-w-md font-mono text-[10px] text-[color:var(--accent)]">{sprintHint}</span>
            )}
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <SplitPaneStudy
        key={question.routable.id}
        question={question}
        meta={studyMeta}
        sessionLog={sessionLog}
        lastSprintRollup={lastSprintRollup}
        onAttemptFinalize={handleFinalize}
        onExportSessionJson={exportSessionJson}
      />
    </>
  );
}
