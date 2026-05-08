export function slugToChapterId(dataChapterAttr: string | null | undefined): string | null {
  if (!dataChapterAttr) return null;
  const s = dataChapterAttr.trim();
  if (!s || s === 'index') return null;
  if (s === 'diagnostic') return 'diagnostic';
  if (s.startsWith('appendix')) return 'appendix';
  const m = /^(\d+)/.exec(s);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (n < 1 || n > 10) return null;
  return String(n).padStart(2, '0');
}

const ALLOWED = new Set(
  ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'appendix', 'diagnostic'].map((x) => x)
);

export function assertProgressChapterId(id: string): string | null {
  const trimmed = id.trim();
  return ALLOWED.has(trimmed) ? trimmed : null;
}
