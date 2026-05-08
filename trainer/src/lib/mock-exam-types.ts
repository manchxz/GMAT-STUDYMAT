export type MockSectionKey = 'QUANT' | 'VERBAL' | 'DATA_INSIGHTS';

export const MOCK_SECTION_ORDER: MockSectionKey[] = ['QUANT', 'VERBAL', 'DATA_INSIGHTS'];

export const MOCK_SECTION_COUNTS: Record<MockSectionKey, number> = {
  QUANT: 21,
  VERBAL: 23,
  DATA_INSIGHTS: 20,
};

export const MOCK_SECTION_SECONDS = 45 * 60;

export const MOCK_SECTION_LABELS: Record<MockSectionKey, string> = {
  QUANT: 'Quantitative',
  VERBAL: 'Verbal',
  DATA_INSIGHTS: 'Data Insights',
};

export type MockExamProfile = {
  whyGmat: string;
  targetSchools: string;
  goals: string;
};

export type MockExamPoolItem = {
  id: string;
  bankKey: string;
  section: MockSectionKey;
  stemMd: string;
  choices: { key: string; text: string }[];
  correctText: string;
  difficulty: number;
};

export type MockExamPayload = {
  version: 1;
  salt: string;
  createdAt: string;
  pools: Record<MockSectionKey, MockExamPoolItem[]>;
};

export type MockPerAnswer = {
  itemId: string;
  correctText: string;
  selectedText: string | null;
  selectedKey: string | null;
  isCorrect: boolean;
  timeMs: number;
  flaggedReview: boolean;
};

export type MockSectionProgress = {
  section: MockSectionKey;
  theta: number;
  usedIds: string[];
  answers: MockPerAnswer[];
  currentItemId: string | null;
};

export const MOCK_STORAGE_PAYLOAD = 'mock_exam_payload_v1';
export const MOCK_STORAGE_PROFILE = 'mock_exam_profile_v1';
export const MOCK_STORAGE_PROGRESS = 'mock_exam_progress_v1';
