export type DisplayChoice = {
  displayKey: string;
  bankKey: string;
  text: string;
};

export function buildShuffledDisplayChoices(
  bankChoices: readonly { key: string; text: string }[]
): DisplayChoice[] {
  const n = bankChoices.length;
  if (n === 0) return [];
  const letters = Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
  const pool = [...bankChoices];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = t;
  }
  return pool.map((c, i) => ({
    displayKey: letters[i]!,
    bankKey: c.key,
    text: c.text,
  }));
}
