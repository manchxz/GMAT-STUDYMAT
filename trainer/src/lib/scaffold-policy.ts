export type ScaffoldLayer = 'micro' | 'eli5' | 'expert_framework';

export type ScaffoldContent = {
  eli5: string;
  expert: string;
  microHint?: string;
};

export function resolveScaffoldLayers(
  content: ScaffoldContent,
  recentAccuracy: number,
  maxStepsCap = 4
): { layer: ScaffoldLayer; text: string }[] {
  const microText = content.microHint?.trim();
  const hasMicro = Boolean(microText);
  const micro = hasMicro
    ? { layer: 'micro' as const, text: microText! }
    : null;
  const eli5 = { layer: 'eli5' as const, text: content.eli5 };
  const expert = { layer: 'expert_framework' as const, text: content.expert };

  let seq: { layer: ScaffoldLayer; text: string }[];
  if (recentAccuracy >= 0.88) {
    seq = [expert];
  } else if (recentAccuracy >= 0.75) {
    seq = hasMicro ? [micro!, expert] : [eli5, expert];
  } else if (recentAccuracy >= 0.62) {
    seq = hasMicro ? [micro!, eli5, expert] : [eli5, expert];
  } else {
    seq = hasMicro ? [micro!, eli5, expert] : [eli5, expert];
  }

  return seq.slice(0, Math.max(1, Math.min(maxStepsCap, seq.length)));
}

export function maxVisibleScaffoldLayers(
  recentAccuracy: number,
  userMaxHintStepsCap: number
): number {
  void recentAccuracy;
  return Math.max(1, Math.min(userMaxHintStepsCap, 4));
}
