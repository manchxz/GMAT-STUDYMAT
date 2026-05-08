export const CORE_CHAPTER_IDS: string[] = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
];

export const textbookChapterNames: Record<string, string> = {
  '01': 'Number Properties',
  '02': 'Algebraic Logic',
  '03': 'Word Problems',
  '04': 'Critical Reasoning',
  '05': 'Reading Comprehension',
  '06': 'Data Sufficiency 2.0',
  '07': 'Multi-Source Reasoning',
  '08': 'Table Analysis',
  '09': 'Graphics Interpretation',
  '10': 'The Art of the Skip',
};

export type BreakdownEntry = { correct: number; total: number };

export type DiagnosticChapterRow = {
  id: string;
  name: string;
  pct: number;
  correct: number;
  total: number;
};

export type AdviceResult = {
  headline: string;
  focusChapters: { id: string; name: string; pct: number }[];
  diagnosticRanking: DiagnosticChapterRow[];
  modulesCompleted: number;
  totalCoreModules: number;
  diagnosticScore: number | null;
  appendixDone: boolean;
};

const CHAPTER_NAMES = textbookChapterNames;
export function buildStudyAdvice(input: {
  completedIds: string[];
  diagnostic: { scorePct: number; breakdown: Record<string, BreakdownEntry> } | null;
}): AdviceResult {
  const core = CORE_CHAPTER_IDS;
  const completedCore = new Set(
    input.completedIds.filter((id) => core.includes(id))
  );
  const modulesCompleted = completedCore.size;
  const appendixDone = input.completedIds.includes('appendix');

  let diagnosticRanking: DiagnosticChapterRow[] = [];
  let focusChapters: { id: string; name: string; pct: number }[] = [];
  let headline =
    modulesCompleted === 0
      ? 'Start with Chapter 1 or take the diagnostic to personalize your path.'
      : `You have completed ${modulesCompleted} of ${core.length} core chapters.`;

  if (input.diagnostic?.breakdown) {
    diagnosticRanking = Object.entries(input.diagnostic.breakdown)
      .filter(([k]) => core.includes(k))
      .map(([id, v]) => ({
        id,
        name: CHAPTER_NAMES[id] ?? `Chapter ${id}`,
        pct: v.total > 0 ? v.correct / v.total : 0,
        correct: v.correct,
        total: v.total,
      }))
      .sort((a, b) => a.pct - b.pct);

    const rows = diagnosticRanking.map(({ id, name, pct }) => ({ id, name, pct }));
    focusChapters = rows.slice(0, 3).filter((r) => r.pct < 1);
    if (focusChapters.length > 0) {
      const top = focusChapters[0];
      headline = `Priority focus: ${top.name} (${Math.round(top.pct * 100)}% on diagnostic) — then the next weakest areas below.`;
    } else {
      headline = 'Strong diagnostic across chapters — maintain with mixed review and timed sets.';
    }
  } else if (modulesCompleted < core.length) {
    const next = core.find((id) => !completedCore.has(id));
    if (next) {
      headline = `Next suggested chapter: ${CHAPTER_NAMES[next] ?? next} — or take the diagnostic for a data-driven order.`;
    }
  }

  return {
    headline,
    focusChapters,
    diagnosticRanking,
    modulesCompleted,
    totalCoreModules: core.length,
    diagnosticScore: input.diagnostic?.scorePct ?? null,
    appendixDone,
  };
}
