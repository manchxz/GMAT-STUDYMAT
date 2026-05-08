export type StudyPlanFeature = {
  id: string;
  title: string;
  description: string;
};

export const STUDY_PLAN_SECTION_FEATURES: StudyPlanFeature[] = [
  {
    id: 'diagnostic-priority',
    title: 'Diagnostic-driven priorities',
    description:
      'We surface your weakest core chapters from the last diagnostic (by how you scored per chapter) so you know what to open first.',
  },
  {
    id: 'chapter-checklist',
    title: 'Chapter checklist',
    description:
      'Track all ten core modules and jump straight into the matching textbook lesson from the same screen.',
  },
  {
    id: 'headline-coaching',
    title: 'Plain-language next step',
    description:
      'A short focus line suggests either your next chapter in order or a data-driven priority when diagnostic data exists.',
  },
  {
    id: 'progress-snapshot',
    title: 'Progress snapshot',
    description:
      'See diagnostic score, chapters completed, and whether you’ve finished the trap-library appendix.',
  },
  {
    id: 'jump-to-practice',
    title: 'Jump to practice',
    description:
      'From here you can open the study lab, review hub, or full practice test without hunting through menus.',
  },
];

export const STUDY_PLAN_FEATURE_LABELS: string[] = STUDY_PLAN_SECTION_FEATURES.map((f) => f.title);
