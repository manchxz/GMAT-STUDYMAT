# The Logic Field Guide

### A GMAT Focus Edition study textbook for analytical thinkers

> Zero rote memorization. Zero dead content. Every concept written twice — once for intuition, once for the exam room.

---

## What this is

A modular, hyperlinked HTML textbook covering the three live sections of the GMAT Focus Edition:

- **Quantitative Reasoning** — Number Properties, Algebraic Logic, Word Problem Deconstruction
- **Verbal Reasoning** — Critical Reasoning, Reading Comprehension Archetypes
- **Data Insights** — Data Sufficiency 2.0, Multi-Source Reasoning, Table Analysis, Graphics Interpretation

Plus a Strategic Overlay (the *Art of the Skip*) and a Trap Library appendix.

**Geometry and Sentence Correction are deliberately excluded** — they are not on the Focus Edition, and including them would be the exact "dead content" this book exists to eliminate.

---

## Why "Field Guide" and not "PDF"?

Because every requirement on the spec — two-way hyperlinks between questions and explanations, fillable error logs, inline trap callouts, embedded formula boxes — only works when the source is HTML. You get both:

1. A real **browseable book** (open `index.html` in any modern browser)
2. A real **printable PDF** (Browser → Print → "Save as PDF" → preserves every link, every formula box, every form field as ruled lines)

You do not have to choose. The same source compiles to both.

---

## How to use it

### Reading mode (recommended)

```text
1. Open index.html in Chrome, Firefox, or Edge
2. Pick a study path from the master TOC (Diagnostic, 8-Week, 12-Week, or Free Browse)
3. Work through chapters in order; each takes ~25–40 minutes
4. Toggle ELI5 / Expert blocks with the buttons in the chapter header
5. Fill out the Error Log at the end of each chapter — entries persist in your browser
```

### PDF / Print mode

```text
1. Open the chapter (or index.html for the full book)
2. Ctrl + P  (or Cmd + P on Mac)
3. Destination: "Save as PDF"
4. Layout: Portrait
5. Margins: Default
6. Background graphics: ON  (this preserves the formula boxes)
7. Save
```

The print stylesheet automatically:

- Hides navigation, toggles, and the floating sidebar
- Expands all collapsed ELI5/Expert tiers (both print)
- Converts fillable form fields into ruled lines for hand-written notes
- Forces clean page breaks between chapters and major sections
- Switches to a paper-friendly color profile (vermillion → black where contrast matters)

---

## File layout

```text
GMAT Study mats/
├── index.html                              ← master TOC + study paths
├── README.md                               ← this file
├── assets/
│   ├── textbook.css                        ← design system + print stylesheet
│   └── textbook.js                         ← ELI5/Expert toggle, error log persistence
├── chapters/
│   ├── 01-quant-number-properties.html
│   ├── 02-quant-algebraic-logic.html
│   ├── 03-quant-word-problems.html
│   ├── 04-verbal-critical-reasoning.html
│   ├── 05-verbal-reading-comp.html
│   ├── 06-di-data-sufficiency.html
│   ├── 07-di-multi-source-reasoning.html
│   ├── 08-di-table-analysis.html
│   ├── 09-di-graphics-interpretation.html
│   ├── 10-strategy-art-of-skip.html
│   └── appendix-trap-library.html
└── extras/
    ├── diagnostic.html                     ← placement test → routes to weak-area chapters
    ├── flashcards.html                     ← formula + trap flip-cards
    └── cheatsheet.html                     ← single-page printable summary

trainer/                                    ← Next.js adaptive rail (CAT routing, analytics UI)
├── prisma/schema.prisma                   ← PostgreSQL schema (Users, Questions, Concepts, Analytics)
├── sql/schema-reference.sql               ← same schema as raw SQL
├── src/                                   ← split-pane study UI, Pearson-style mock, API routes
└── README.md                              ← architecture + wireframes
```

---

## The "ELI5 → Expert" Pipeline

Every concept is written in two tiers, deliberately and visibly:

| Tier         | Marked by              | Purpose                                                                 |
|:-------------|:-----------------------|:------------------------------------------------------------------------|
| **ELI5**     | ☀ sun glyph (sienna)   | Intuition. Plain-English analogy. Builds the mental model.              |
| **Expert**   | ◈ compass glyph (teal) | Formal GMAT logic. Structural reasoning. The version you bring to test. |

You can toggle either tier off in the chapter header to drill the other.

---

## Study paths

The master TOC offers four paths:

1. **Diagnostic-First** — take the placement quiz, get routed to your weakest chapters
2. **8-Week Sprint** — 4 chapters/week, intense
3. **12-Week Standard** — 1 chapter every ~3 days, sustainable
4. **Free Browse** — jump in anywhere

---

## Authorial voice

Direct. Slightly irreverent. Tough-tutor honest.

If a question is a trap, the book says it is a trap. If a memorized formula will save you 90 seconds, you get the formula. If a "shortcut" being sold elsewhere is actually slower, the book tells you to ignore it.

---

## Contributing / extending

Each chapter is a standalone HTML file that imports the same shared CSS and JS. To add a new section:

1. Copy any existing chapter as a template
2. Update the chapter number, title, and `<nav>` cross-links
3. Add an entry to `index.html` under the appropriate block
4. Cross-link any new traps into `appendix-trap-library.html`

That is it. No build step. No bundler. No framework.

---

## GitHub & hosting (v.1)

### Repository

Push this folder as a single repo so the **static textbook** (`index.html`, `chapters/`, `assets/`, `extras/`) and the **Next.js trainer** (`trainer/`) stay versioned together.

### Static textbook (free)

| Host | Notes |
|:-----|:------|
| **GitHub Pages** | Repo **Settings → Pages**: Source = branch `main`, folder `/ (root)`. Your `index.html` becomes the site entry. |
| **Cloudflare Pages** | Connect repo; build command empty; output directory `/` (static). |
| **Netlify** | New site from Git; base directory blank; no build step. |

Paths are relative — keep the same folder layout so `assets/` and `chapters/` resolve.

### Trainer app (`trainer/`) — Vercel (free hobby)

1. [vercel.com](https://vercel.com) → **Add New Project** → Import this GitHub repo.
2. **Root Directory**: set to `trainer` (critical).
3. Framework: **Next.js** (auto). Build: `npm run build`, Output: default.
4. **Environment variables** (optional): none required for the current demo UI. If you add a database later, set `DATABASE_URL` in the Vercel project.
5. **Production limitation**: `POST /api/concept-chat` calls **Ollama on your PC** (`127.0.0.1:11434`). Vercel cannot reach your machine; that route will **fail online** unless you swap in a public LLM API or self-host a bridge. Study UI, scaffold, and breakdown still work.

Local build hit Node heap limits on some machines; Vercel’s build image is usually fine. If needed: Project **Settings → General → Build & Development Settings** and increase or add an install command hook — rarely needed.

### Quick push (first time)

Create an **empty** repo on GitHub (no README), then from this folder:

```powershell
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
git remote add origin https://github.com/manchxz/YOUR-REPO.git
git branch -M main
git push -u origin main
```

Replace `YOUR-REPO` with the new repository name.

---

## License

Personal study use. Do not redistribute commercially.
