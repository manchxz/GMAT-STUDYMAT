-- =============================================================================
-- GMAT Focus Trainer — PostgreSQL schema reference (mirrors prisma/schema.prisma)
-- Use for docs, BI tools, or manual provisioning. Prefer Prisma migrate for app.
-- =============================================================================

CREATE TYPE "Section" AS ENUM ('QUANT', 'VERBAL', 'DATA_INSIGHTS');
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'DATA_SUFFICIENCY', 'MULTI_PART_MSQ');
CREATE TYPE "PracticeTier" AS ENUM ('EASY', 'MID', 'HARD');
CREATE TYPE "ErrorBehaviorTag" AS ENUM (
  'MISREAD_PROMPT',
  'CARELESS_CALC',
  'CONCEPT_GAP',
  'TRAP_ANSWER',
  'TIME_PRESSURE_GUESS',
  'OVERCONFIDENT_SKIP_REVIEW',
  'DS_LOGIC_ERROR',
  'OTHER'
);

-- Users -----------------------------------------------------------------------
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE,
  "name" TEXT,
  "phone" TEXT UNIQUE,
  "emailVerifiedAt" TIMESTAMP(3),
  "phoneVerifiedAt" TIMESTAMP(3),
  "passwordHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "UserPreference" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "theme" TEXT NOT NULL DEFAULT 'dark',
  "mockExamHighFidelity" BOOLEAN NOT NULL DEFAULT TRUE,
  "maxHintSteps" INTEGER NOT NULL DEFAULT 3,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Skills & concepts -----------------------------------------------------------
CREATE TABLE "Skill" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "section" "Section" NOT NULL,
  "parentId" TEXT REFERENCES "Skill"("id"),
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "Concept" (
  "id" TEXT PRIMARY KEY,
  "skillId" TEXT NOT NULL REFERENCES "Skill"("id") ON DELETE CASCADE,
  "slug" TEXT UNIQUE NOT NULL,
  "title" TEXT NOT NULL,
  "eli5Md" TEXT NOT NULL,
  "expertMd" TEXT NOT NULL,
  "formulaRefs" JSONB,
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- Questions -------------------------------------------------------------------
CREATE TABLE "Question" (
  "id" TEXT PRIMARY KEY,
  "externalKey" TEXT UNIQUE,
  "section" "Section" NOT NULL,
  "type" "QuestionType" NOT NULL,
  "stemMd" TEXT NOT NULL,
  "choicesJson" JSONB NOT NULL,
  "correctKey" TEXT NOT NULL,
  "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discrimination" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "guessing" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  "practiceTier" "PracticeTier",
  "conceptId" TEXT REFERENCES "Concept"("id"),
  "timeTargetSec" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Question_section_practiceTier_idx" ON "Question"("section", "practiceTier");

CREATE TABLE "QuestionSkill" (
  "questionId" TEXT NOT NULL REFERENCES "Question"("id") ON DELETE CASCADE,
  "skillId" TEXT NOT NULL REFERENCES "Skill"("id") ON DELETE CASCADE,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  PRIMARY KEY ("questionId", "skillId")
);

-- User proficiency -----------------------------------------------------------
CREATE TABLE "UserSkillState" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "skillId" TEXT NOT NULL REFERENCES "Skill"("id") ON DELETE CASCADE,
  "theta" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "standardError" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "totalAttempts" INTEGER NOT NULL DEFAULT 0,
  "correctAttempts" INTEGER NOT NULL DEFAULT 0,
  "streakCorrect" INTEGER NOT NULL DEFAULT 0,
  "recentAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "lastCalibratedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("userId", "skillId")
);

-- Sessions & attempts ---------------------------------------------------------
CREATE TABLE "StudySession" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "mode" TEXT NOT NULL,
  "section" "Section",
  "practiceState" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3)
);

CREATE TABLE "QuestionAttempt" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES "StudySession"("id") ON DELETE CASCADE,
  "questionId" TEXT NOT NULL REFERENCES "Question"("id") ON DELETE CASCADE,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "answeredAt" TIMESTAMP(3),
  "timeMs" INTEGER,
  "selectedKey" TEXT,
  "isCorrect" BOOLEAN,
  "wasFlaggedGuess" BOOLEAN NOT NULL DEFAULT FALSE,
  "reviewedConcept" BOOLEAN NOT NULL DEFAULT FALSE,
  "scaffoldStepsUsed" INTEGER NOT NULL DEFAULT 0,
  "errorTag" "ErrorBehaviorTag",
  "notes" TEXT
);
CREATE INDEX "QuestionAttempt_sessionId_idx" ON "QuestionAttempt"("sessionId");
CREATE INDEX "QuestionAttempt_questionId_idx" ON "QuestionAttempt"("questionId");

-- 15-minute sprint rollup -----------------------------------------------------
CREATE TABLE "SprintSummary" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "windowEnd" TIMESTAMP(3) NOT NULL,
  "durationSec" INTEGER NOT NULL,
  "attemptsInt" INTEGER NOT NULL,
  "correctInt" INTEGER NOT NULL,
  "avgTimeMs" DOUBLE PRECISION NOT NULL,
  "panicGuessRate" DOUBLE PRECISION NOT NULL,
  "overInvestRate" DOUBLE PRECISION NOT NULL,
  "predictedScoreDelta" DOUBLE PRECISION,
  "metricsJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "SprintSummary_user_window_idx" ON "SprintSummary"("userId", "windowEnd");

-- CAT exam --------------------------------------------------------------------
CREATE TABLE "ExamAttempt" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "section" "Section" NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "finalTheta" DOUBLE PRECISION,
  "rawCorrect" INTEGER,
  "totalItems" INTEGER
);

CREATE TABLE "ExamQuestionSelection" (
  "id" TEXT PRIMARY KEY,
  "examAttemptId" TEXT NOT NULL REFERENCES "ExamAttempt"("id") ON DELETE CASCADE,
  "questionId" TEXT NOT NULL REFERENCES "Question"("id"),
  "sequenceIndex" INTEGER NOT NULL,
  "thetaBefore" DOUBLE PRECISION NOT NULL,
  "information" DOUBLE PRECISION,
  UNIQUE ("examAttemptId", "sequenceIndex")
);
CREATE INDEX "ExamQuestionSelection_exam_idx" ON "ExamQuestionSelection"("examAttemptId");
