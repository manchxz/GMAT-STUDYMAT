# GMAT Focus Study Module — Architecture

This document satisfies the system design brief: **CAT-style routing**, **contextual scaffolding (ELI5 / Expert)**, **time + behavior analytics**, **predictive sprint scoring**, and **Pearson-style mock shell** (see `/mock`).

## 1. Database schema (PostgreSQL / Prisma)

The authoritative schema lives in `prisma/schema.prisma`. Summary:

| Model | Purpose |
|:------|:--------|
| **User** | Identity; links to skills, sessions, sprints, diagnostics. |
| **Skill** | Fine-grained nodes (`code` unique, e.g. `NUMBER_PROPERTIES`) with `Section` enum. |
| **Concept** | Theory for a skill: `eli5Md`, `expertMd` — **no answer key** in this table. |
| **Question** | Item bank: `stemMd`, `choicesJson`, `correctKey`, 3PL-ish params (`difficulty`, `discrimination`, `guessing`), `timeTargetSec`, optional `conceptId`. |
| **QuestionSkill** | Many-to-many with `weight` for multi-skill items. |
| **UserSkillState** | Per-user `theta`, `standardError`, `recentAccuracy` (scaffold decay), attempt counts. |
| **StudySession** | Practice / CAT drill window; owns **QuestionAttempt** rows. |
| **QuestionAttempt** | `timeMs`, `selectedKey`, `isCorrect`, `wasFlaggedGuess`, `scaffoldStepsUsed`, `errorTag` (**ErrorBehaviorTag** enum). |
| **SprintSummary** | ~15-minute rollup: accuracy, `panicGuessRate`, `overInvestRate`, `predictedScoreDelta`, `metricsJson`. |
| **ExamAttempt** / **ExamQuestionSelection** | Full-section CAT audit trail (`thetaBefore`, sequence index). |

**ErrorBehaviorTag** (behavioral taxonomy): `MISREAD_PROMPT`, `CARELESS_CALC`, `CONCEPT_GAP`, `TRAP_ANSWER`, `TIME_PRESSURE_GUESS`, `OVERCONFIDENT_SKIP_REVIEW`, `DS_LOGIC_ERROR`, `OTHER`.

Seed the demo bank:

```bash
cd trainer && npx prisma db push && npm run db:seed
```

## 2. Core algorithms (server + shared libs)

| Module | Responsibility |
|:-------|:----------------|
| `src/lib/adaptive-router.ts` | 3PL probability, Fisher information heuristic, **`selectNextAdaptive`** — serves items near **θ + ~0.45** challenge offset. |
| `src/lib/theta-calibration.ts` | **`updateThetaAfterAttempt`** — online θ update after each scored item. |
| `src/lib/time-analytics.ts` | **`classifyAttemptPace`** (`panic_like` / `over_invested` / `normal`), **`summarizeSprintAttempts`** for 15-min windows. |
| `src/lib/predictive-scoring.ts` | **`predictCompositeDelta`** — pseudo score lift from sprint rollup + `recentAccuracy`. |
| `src/lib/scaffold-policy.ts` | **`maxVisibleScaffoldLayers`** — fewer ELI5/Expert layers as **`recentAccuracy`** rises. |
| `src/lib/skill-snapshot.ts` | Client/server **SkillSnapshot** map by `Skill.code`; guest-mode **`applyAttemptToSnapshot`**. |

## 3. HTTP API

| Route | Method | Role |
|:------|:-------|:-----|
| `/api/study/bootstrap` | GET | Create **StudySession** (if signed in), load **UserSkillState**, return first **nextQuestion** from adaptive router. |
| `/api/study/attempt` | POST | Persist **QuestionAttempt** (when bank seeded), update θ + EMA accuracy, return **`nextQuestion`**. |
| `/api/sprint/predict` | POST | Body: `rollup` + `skillSnapshot` → **`predictedScoreDelta`**. |

Guests run the **same router** in the browser; attempts are **not** persisted until login.

## 4. Study UI (React / Next.js)

- **`src/components/study/SplitPaneStudy.tsx`** — Split layout: **question and choices** on the left; **Review** pane on the right (sticky on large screens). After submit: correct answer line, optional **step-by-step** (`solutionWalkthrough`), **breakdown**, and “You chose …”. **Next item** on an incorrect answer opens **`ErrorTagPicker`** so the learner can log **`errorTag`** (optional skip still persists the miss with `errorTag: null`). Session timeline tooltips show logged tags for past misses.
- **`src/components/study/ErrorTagPicker.tsx`** — Accessible modal; options defined in **`src/lib/error-tags.ts`** (IDs must match Prisma **`ErrorBehaviorTag`**).
- **`src/components/study/ConceptScaffold.tsx`** — Standalone ELI5 / Expert component (not wired into the split pane; concept text is also folded into DB item `breakdown` via **`db-question-mapper`** when no walkthrough exists).
- **`src/components/study/StudyShell.tsx`** — Bootstrap, **`/api/study/attempt`** on finalize, tri-section / guest rounds, sprint rollup → **`/api/sprint/predict`**, nav link to **`/review`** when signed in.
- **`src/app/study/page.tsx`** — Entry point.
- **`src/app/review/page.tsx`** — **Review hub**: lists recent incorrect **`QuestionAttempt`** rows (signed-in) via **`src/lib/review-log.ts`**, plus client card for last mock (localStorage).
- **`src/components/home/StudyJourney.tsx`** — Ordered “study path” (diagnostic → dashboard → study lab → mock → review) on home and dashboard.

## 5. High-fidelity mock shell

- **`src/app/mock/page.tsx`** — Pearson-style ribbons, high-contrast panel, section timer chrome (extend for production item driver).

## 6. Dark mode & responsiveness

- **`src/app/globals.css`** — `:root` dark theme + `html.theme-light` + `.theme-vue` (mock).
- **`ThemeSwitcher`** — User preference.
- Study panes use `max-h`, `overflow-y-auto`, **`custom-scroll`** for long review on tablet.

## 7. Execution checklist

1. `docker compose up` (Postgres) — see `trainer/docker-compose.yml`.
2. `cp .env.example .env` — set `DATABASE_URL`, `SESSION_SECRET`.
3. `npm run db:push && npm run db:seed`.
4. `npm run dev` → `/study` (guest or signed-in).
