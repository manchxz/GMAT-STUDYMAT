# GMAT Focus Trainer — Architecture

This package is the adaptive **software rail** that ingests your Logic Field Guide content (HTML/markdown/DB) and exposes a **zero-scroll** study UI, sprint analytics, and CAT routing.

---

## Database schema (`prisma/schema.prisma`)

| Domain | Entities |
|---|---|
| Identity | `User`, `UserPreference` |
| Content | `Skill`, `Concept`, `Question`, `QuestionSkill` |
| Proficiency | `UserSkillState` (θ estimates + recent accuracy windows) |
| Sessions | `StudySession`, `QuestionAttempt` (+ behavioral `ErrorBehaviorTag`) |
| Analytics | `SprintSummary` (15‑minute rollup + predictive deltas) |
| CAT exams | `ExamAttempt`, `ExamQuestionSelection` (ordered adaptive trail) |

Raw SQL twin: `sql/schema-reference.sql`.

---

## Core libs

| Module | Responsibility |
|---|---|
| `src/lib/adaptive-router.ts` | 3‑PL heuristic + Fisher information picker — serves items slightly above θ |
| `src/lib/time-analytics.ts` | Panic‑guess vs over‑invest flags from `timeMs` vs `timeTargetMs` |
| `src/lib/predictive-scoring.ts` | Composite delta after sprint (tunable to your normed scale) |
| `src/lib/scaffold-policy.ts` | ELI5/Expert layer budget decays with `recentAccuracy` |
| `src/lib/theta-calibration.ts` | Online θ update after each graded attempt |

---

## Component tree (frontend)

```
app/layout.tsx
├── app/page.tsx                    # marketing / entry
├── app/study/page.tsx              # primary cockpit
│   └── SplitPaneStudy.tsx          # zero-struggle layout
│       ├── QuestionTimer.tsx
│       ├── ConceptScaffold.tsx     # Concept tab (no answer leakage)
│       ├── ConceptChatSidebar.tsx  # Ollama concept tutor (optional)
│       └── ErrorTagPicker.tsx      # modal taxonomy on misses
├── app/mock/page.tsx               # Pearson-esque shell
├── app/api/sprint/predict/route.ts
└── app/api/concept-chat/route.ts # proxies to local Ollama (/api/chat)
```

---

## Local Ollama (concept tutor)

The **Concept** tab includes a right-hand chat pane that calls Ollama from the Next.js server (`POST /api/concept-chat`). Start Ollama and pull your model, then open **Study**:

```bash
ollama pull huihui_ai/glm-4.7-flash-abliterated
ollama serve   # usually already running after installing Ollama
```

Optional env (see `.env.example`): `OLLAMA_BASE_URL` (default `http://127.0.0.1:11434`), `OLLAMA_MODEL` (defaults to the GLM flash model above). Before submit, the system prompt blocks naming the correct MC letter; after submit, full reasoning is allowed.

---

## Wireframe — split-pane study (desktop)

```
┌──────────────────────────────────────────────┬────────────────────────────┐
│ QUESTION PANE                                 │ CONTEXT PANE (sticky)      │
│ · stem                                        │ [ Concept | Breakdown ]    │
│ · choices (radio)                             │                            │
│ · timing guess flag                           │  Concept:                  │
│ · live timer                                  │   · ELI5 card              │
│ · Submit                                      │   · Expert card            │
│                                               │  (hint depth decays)      │
│ Mobile: same stack + tab strip mirrors tabs   │  Breakdown: post-submit    │
└──────────────────────────────────────────────┴────────────────────────────┘
```

---

## Run locally

```bash
cd trainer
npm install
cp .env.example .env   # add DATABASE_URL when wiring Prisma
npm run db:generate
npm run dev            # http://localhost:3330
```

---

## Content ingestion (next step)

1. Parse your existing `chapters/*.html` into `Question` + `Concept` rows (externalKey = file#anchor).
2. Map each item to `Skill` nodes for routing weights.
3. Replace `DEMO_QUESTIONS` in `SplitPaneStudy` with a server component fetch.

---

## Legal / trademark note

The mock exam shell is **visually inspired** by common high-stakes test UIs. It is not affiliated with GMAC or Pearson. Tune colors/spacing to stay clearly distinct if you ship publicly.
