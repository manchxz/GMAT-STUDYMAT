export const ERROR_TAG_OPTIONS = [
  { id: 'MISREAD_PROMPT', label: 'Misread the question' },
  { id: 'CARELESS_CALC', label: 'Small calculation slip' },
  { id: 'CONCEPT_GAP', label: 'Need to revisit the concept' },
  { id: 'TRAP_ANSWER', label: 'Fell for a trap answer' },
  { id: 'TIME_PRESSURE_GUESS', label: 'Rushed or guessed' },
  { id: 'OVERCONFIDENT_SKIP_REVIEW', label: 'Skipped double-checking' },
  { id: 'DS_LOGIC_ERROR', label: 'Data sufficiency logic slip' },
  { id: 'OTHER', label: 'Something else' },
] as const;

export type ErrorTagId = (typeof ERROR_TAG_OPTIONS)[number]['id'];

const LABEL_MAP = Object.fromEntries(ERROR_TAG_OPTIONS.map((o) => [o.id, o.label])) as Record<
  ErrorTagId,
  string
>;

export function formatErrorTagLabel(tag: string | null | undefined): string | null {
  if (!tag) return null;
  return LABEL_MAP[tag as ErrorTagId] ?? tag;
}
