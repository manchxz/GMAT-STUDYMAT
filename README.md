# The Logic Field Guide

### A GMAT Focus Edition study textbook for analytical thinkers

> Zero rote memorization. Zero dead content. Every concept written twice — once for intuition, once for the exam room.

---

## What this is

A modular, hyperlinked HTML textbook covering the three live sections of the GMAT Focus Edition:

- **Quantitative Reasoning** — Number Properties, Algebraic Logic, Word Problem Deconstruction
- **Verbal Reasoning** — Critical Reasoning, Reading Comprehension Archetypes
- **Data Insights** — Data Sufficiency 2.0, Multi-Source Reasoning, Table Analysis, Graphics Interpretation

Plus a strategic overlay (*Art of the Skip*) and a trap library appendix.

**Geometry and Sentence Correction are omitted** — they are not on the Focus Edition.

---

## Why HTML (not only PDF)

The book is authored as HTML so you get:

1. A **browseable** reference (open `index.html` in any modern browser)
2. A **printable PDF** (Print → Save as PDF preserves links, formula boxes, and form fields as ruled lines)

---

## How to use it

### Reading mode

1. Open `index.html` in Chrome, Firefox, or Edge
2. Take the diagnostic from the master TOC before you start so your strengths and weaknesses are laid out
3. Work chapters in order (~25–40 minutes each)
4. Toggle ELI5 / Expert blocks in the chapter header
5. Use the Error Log at the end of each chapter (saved in your browser)

### Print / PDF

1. Open the chapter or `index.html`
2. Print → Save as PDF  
3. Portrait, default margins, **background graphics on**

Print CSS hides chrome, expands both tiers where needed, and uses a paper-friendly palette.

---

## Repository layout

```text
├── index.html                 master TOC + diagnostic lead + chapters
├── assets/                    shared CSS and JS
├── chapters/                  numbered sections + trap appendix
├── extras/                    diagnostic, flashcards, cheatsheet
└── trainer/                   Next.js practice app (see trainer/README.md)
```

**Source:** [github.com/manchxz/GMAT-STUDYMAT](https://github.com/manchxz/GMAT-STUDYMAT)

The static book can be served from **GitHub Pages** (branch `main`, site root) — typically `https://manchxz.github.io/GMAT-STUDYMAT/`.  

When you deploy the **trainer** (e.g. Vercel with root `trainer/`), the build copies this book into **`/textbook/`** on the same domain so **login (password + email OTP), chapter progress, and diagnostic scores** can sync to your **PostgreSQL** database. Local setup: **`trainer/docker-compose.yml`** + steps in **`trainer/README.md`**.


---

## ELI5 and Expert

| Tier       | Role |
|:-----------|:-----|
| **ELI5**   | Intuition and plain-language framing |
| **Expert** | Formal GMAT-style structure for test day |

Toggle either tier from the chapter header.

---

## Study flow

1. **Diagnostic** — placement-style quiz in `extras/diagnostic.html` (also linked from the master TOC)  
2. **Textbook** — work Quant, Verbal, DI, and Strategy sections in the order that fits your plan  

---

## Extending the book

1. Copy an existing chapter as a template  
2. Update numbering, title, and `<nav>` links  
3. Add the chapter to `index.html`  
4. Cross-link new traps in `appendix-trap-library.html`  

The HTML tree has no bundler or framework dependency.

---

## License

Personal study use. Do not redistribute commercially.
