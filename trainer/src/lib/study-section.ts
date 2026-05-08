export type StudySectionFilter = 'ALL' | 'QUANT' | 'VERBAL' | 'DATA_INSIGHTS';

export const STUDY_SECTION_LABELS: Record<StudySectionFilter, string> = {
  ALL: 'All sections',
  QUANT: 'Quantitative',
  VERBAL: 'Verbal',
  DATA_INSIGHTS: 'Data Insights',
};

export function parseStudySectionParam(raw: string | null): StudySectionFilter {
  if (raw === 'QUANT' || raw === 'VERBAL' || raw === 'DATA_INSIGHTS') return raw;
  return 'ALL';
}

export function filterPracticeBySection<T extends { section: StudySectionFilter | string }>(
  items: T[],
  filter: StudySectionFilter
): T[] {
  if (filter === 'ALL') return items;
  return items.filter((i) => i.section === filter);
}
