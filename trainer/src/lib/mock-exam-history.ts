import type { MockSectionKey } from '@/lib/mock-exam-types';
import { MOCK_SECTION_LABELS, MOCK_SECTION_ORDER } from '@/lib/mock-exam-types';
import type { MockReportQuestionRow } from '@/lib/mock-exam-cat';

export const MOCK_LAST_RESULT_KEY = 'mock_exam_last_result_v1';

export type MockLastResult = {
  version: 1 | 2;
  completedAt: string;
  total: number;
  sections: Record<MockSectionKey, { est: number; wta: number }>;
  report?: Record<MockSectionKey, MockReportQuestionRow[]>;
};

export type MockCooldownInfo = {
  canTakeMock: boolean;
  lastResult: MockLastResult | null;
  nextAllowedAt: number | null;
  message: string;
};

function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfNextLocalDay(after: Date): Date {
  const d = new Date(after.getTime());
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function readMockLastResult(): MockLastResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MOCK_LAST_RESULT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as MockLastResult;
    if (v?.version !== 1 && v?.version !== 2) return null;
    if (typeof v.total !== 'number' || !v.sections || !v.completedAt) return null;
    return v;
  } catch {
    return null;
  }
}

export function getMockCooldownInfo(): MockCooldownInfo {
  const lastResult = readMockLastResult();
  if (!lastResult) {
    return {
      canTakeMock: true,
      lastResult: null,
      nextAllowedAt: null,
      message: '',
    };
  }
  const completed = new Date(lastResult.completedAt);
  const now = new Date();
  if (!isSameLocalCalendarDay(completed, now)) {
    return {
      canTakeMock: true,
      lastResult,
      nextAllowedAt: null,
      message: '',
    };
  }
  const next = startOfNextLocalDay(completed);
  return {
    canTakeMock: false,
    lastResult,
    nextAllowedAt: next.getTime(),
    message: `You can take one full practice test per day (using this device’s date). Your next test starts after ${next.toLocaleString()}.`,
  };
}

export function saveMockLastResult(
  payload: Pick<MockLastResult, 'total' | 'sections'> &
    Partial<Pick<MockLastResult, 'report' | 'completedAt'>>
): void {
  const entry: MockLastResult = {
    version: 2,
    completedAt: payload.completedAt ?? new Date().toISOString(),
    total: payload.total,
    sections: payload.sections,
    report: payload.report,
  };
  localStorage.setItem(MOCK_LAST_RESULT_KEY, JSON.stringify(entry));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mock-exam-result-updated'));
  }
}

const SECTION_TEXTBOOK: Record<MockSectionKey, string> = {
  QUANT: '/textbook/chapters/01-quant-number-properties.html',
  VERBAL: '/textbook/chapters/04-verbal-critical-reasoning.html',
  DATA_INSIGHTS: '/textbook/chapters/08-di-table-analysis.html',
};

export type MockStudyRef = {
  section: MockSectionKey;
  label: string;
  est: number;
  weightedAcc: number;
  priority: number;
  textbookHref: string;
  suggestion: string;
};

export function buildMockStudyReferences(sections: MockLastResult['sections']): MockStudyRef[] {
  const ordered = [...MOCK_SECTION_ORDER].sort((a, b) => sections[a].est - sections[b].est);
  return ordered.map((sec, i) => {
    const s = sections[sec];
    const priority = i + 1;
    let suggestion = '';
    if (i === 0) {
      suggestion = `This section had your lowest score (${s.est} on the practice scale). Spend most of your next few study sessions here: review the chapter linked above, then practice mixed problems until this area feels steadier.`;
    } else if (i === 1) {
      suggestion = `Your second focus (${s.est} on the practice scale). Use the questions you missed on this test to spot patterns; keep working on ${MOCK_SECTION_LABELS[ordered[0]!]} first until it feels stronger.`;
    } else {
      suggestion = `You’re relatively stronger here (${s.est} on the practice scale). Keep touch-up practice so you don’t lose ground while you lift your weaker sections.`;
    }
    if (s.wta < 62 && s.est >= 65) {
      suggestion += ` Your accuracy on harder questions was a bit soft—slow down and read carefully, not just for speed.`;
    }
    return {
      section: sec,
      label: MOCK_SECTION_LABELS[sec],
      est: s.est,
      weightedAcc: s.wta,
      priority,
      textbookHref: SECTION_TEXTBOOK[sec],
      suggestion,
    };
  });
}

export function mockTotalToScaleFraction(total: number): number {
  const t = Math.min(805, Math.max(205, total));
  return (t - 205) / (805 - 205);
}
