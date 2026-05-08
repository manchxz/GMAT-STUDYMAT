# GMAT Focus Trainer

Next.js app: split-pane timed practice, ELI5/Expert scaffolding, optional **local Ollama** concept chat, error tagging, and a high-contrast mock shell. PostgreSQL schema lives in `prisma/schema.prisma` (see `sql/schema-reference.sql`).

## Run

```bash
cd trainer
npm install
cp .env.example .env   # optional: DATABASE_URL, Ollama vars
npm run db:generate
npm run dev              # http://localhost:3330
```

## Ollama (optional)

With [Ollama](https://ollama.com) running locally, the Concept pane can call your model via `POST /api/concept-chat`. Defaults: `OLLAMA_BASE_URL=http://127.0.0.1:11434`, model in `.env.example`. Hosted deployments cannot reach your laptop; use a reachable API or disable that route in production.

## Deploying

Import this monorepo into a host (e.g. Vercel) and set the **root directory** to `trainer` so Next.js builds correctly.

## Legal

The mock shell is styled like common test-center software for **practice UX only**. Not affiliated with GMAC or Pearson VUE.
