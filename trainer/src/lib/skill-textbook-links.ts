export const SKILL_TEXTBOOK_PATH: Record<string, string> = {
  NUMBER_PROPERTIES: '/textbook/chapters/01-quant-number-properties.html',
  ALGEBRAIC_LOGIC: '/textbook/chapters/02-quant-algebraic-logic.html',
  RATES_WORK: '/textbook/chapters/03-quant-word-problems.html',
  PERCENT_FRACTION: '/textbook/chapters/01-quant-number-properties.html',
  DESCRIPTIVE_STATS: '/textbook/chapters/08-di-table-analysis.html',
  GEOMETRY_AREA: '/textbook/chapters/02-quant-algebraic-logic.html',
  PROBABILITY_SIMPLE: '/textbook/chapters/01-quant-number-properties.html',
  INEQUALITIES_LINEAR: '/textbook/chapters/02-quant-algebraic-logic.html',
  CR_ASSUMPTION: '/textbook/chapters/04-verbal-critical-reasoning.html',
  CR_WEAKEN: '/textbook/chapters/04-verbal-critical-reasoning.html',
  CR_STRENGTHEN: '/textbook/chapters/04-verbal-critical-reasoning.html',
  CR_INFERENCE: '/textbook/chapters/04-verbal-critical-reasoning.html',
  SC_SUBJECT_VERB: '/textbook/chapters/05-verbal-sentence-correction.html',
  SC_PARALLELISM: '/textbook/chapters/05-verbal-sentence-correction.html',
  SC_PRONOUN: '/textbook/chapters/05-verbal-sentence-correction.html',
  TABLE_READING: '/textbook/chapters/08-di-table-analysis.html',
  GRAPH_TRENDS: '/textbook/chapters/08-di-table-analysis.html',
  MULTI_SOURCE_SIMPLE: '/textbook/chapters/08-di-table-analysis.html',
};

export function textbookPathForSkill(code: string): string | null {
  return SKILL_TEXTBOOK_PATH[code] ?? null;
}
