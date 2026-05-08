/**
 * Contextual scaffolding: hint depth decays as recentAccuracy improves on concept/skill.
 * Never exposes the answer — only theoretical layers (ELI5 → Expert).
 */

export type ScaffoldLayer = 'eli5' | 'expert_framework' | 'none';

export function maxVisibleScaffoldLayers(
  recentAccuracy: number,
  userMaxHintStepsCap: number
): number {
  const baseCap = Math.max(1, Math.min(userMaxHintStepsCap, 3));
  if (recentAccuracy >= 0.88) return 1;
  if (recentAccuracy >= 0.75) return Math.min(2, baseCap);
  if (recentAccuracy >= 0.62) return baseCap;
  return baseCap;
}

export type ScaffoldContent = {
  eli5: string;
  expert: string;
};

/** Build ordered steps for UI (client removes lower steps as mastery rises) */
export function buildScaffoldSequence(
  content: ScaffoldContent,
  visibleSteps: number
): { layer: ScaffoldLayer; text: string }[] {
  const seq: { layer: ScaffoldLayer; text: string }[] = [];

  const showEli5 = visibleSteps >= 2;
  const showExpert = visibleSteps >= 1;

  if (showEli5) seq.push({ layer: 'eli5', text: content.eli5 });
  if (showExpert) seq.push({ layer: 'expert_framework', text: content.expert });

  return seq;
}
