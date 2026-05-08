import type { DisplayChoice } from '@/lib/shuffle-choices';

export function rewriteBankLettersToDisplay(
  text: string,
  displayChoices: readonly DisplayChoice[],
): string {
  if (!text || displayChoices.length === 0) return text;

  const bankToDisplay = new Map(
    displayChoices.map((c) => [c.bankKey.toUpperCase(), c.displayKey]),
  );
  const validBanks = new Set(displayChoices.map((c) => c.bankKey.toUpperCase()));

  const mapLetter = (raw: string): string => {
    const u = raw.toUpperCase();
    return bankToDisplay.get(u) ?? raw;
  };

  let out = text;

  const replaceIfValid = (letter: string, fullMatch: string): string => {
    if (!validBanks.has(letter.toUpperCase())) return fullMatch;
    return mapLetter(letter);
  };

  out = out.replace(/\*\*Answer\s*:\s*([A-E])\.\*\*/gi, (m, l) => {
    const d = replaceIfValid(l, m);
    if (d === m) return m;
    return `**Answer: ${d}.**`;
  });

  out = out.replace(/\*\*Answer\s+([A-E])\.\*\*/gi, (m, l) => {
    const d = replaceIfValid(l, m);
    if (d === m) return m;
    return `**Answer ${d}.**`;
  });

  out = out.replace(/\*\*Answer\s*:\s*([A-E])\*\*/gi, (m, l) => {
    const d = replaceIfValid(l, m);
    if (d === m) return m;
    return `**Answer: ${d}**`;
  });

  out = out.replace(/\bAnswer\s*:\s*([A-E])\b/gi, (m, l) => {
    const d = replaceIfValid(l, m);
    if (d === m) return m;
    return m.replace(/:\s*([A-E])\b/i, `: ${d}`);
  });

  out = out.replace(/\*\*([A-E])\*\*/g, (m, l) => {
    if (!validBanks.has(l)) return m;
    return `**${mapLetter(l)}**`;
  });

  return out;
}
