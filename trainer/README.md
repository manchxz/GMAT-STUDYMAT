# GMAT Focus Trainer

Next.js app: learner **accounts** (email OTP + **password**), progress dashboard, split-pane practice, and the full textbook at **`/textbook/`** after sync. PostgreSQL holds all user data (`prisma/schema.prisma`).

---

## Make auth work (step by step)

These steps give you a **private Postgres** on your machine and a working **register / login / dashboard / textbook progress** flow.

1. **Install Docker Desktop** (Windows/Mac) or Docker Engine — needed only if you use the bundled database below.  
   Alternatively skip to step 3 with a hosted DB (**Neon**, **Supabase**, **Railway**) and paste its connection string as `DATABASE_URL`.

2. **Start your local database** (exclusive to you — data stays in a Docker volume on your PC):

   ```bash
   cd trainer
   docker compose up -d
   ```

   Edit `docker-compose.yml` if you want a stronger `POSTGRES_PASSWORD`. Copy the same user/password/db into `DATABASE_URL` in `.env` (see `.env.example`).

3. **Configure the app**

   ```bash
   npm install
   cp .env.example .env
   ```

   In `.env` set:

   - **`DATABASE_URL`** — must match Postgres (local Docker or cloud).
   - **`SESSION_SECRET`** — any random string **≥ 16 characters** (used to sign login cookies and OTP pepper).
   - **`RESEND_API_KEY`** + **`EMAIL_FROM`** — for real email codes in production ([Resend](https://resend.com)).
   - For **local dev without Resend**, set **`OTP_DEBUG=1`**; registration/login responses may include `debugOtp` in the JSON (never enable on a public server).

4. **Create tables** (from `trainer/`):

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Sync the textbook into the app** (required for `/textbook/...` and progress bar):

   ```bash
   npm run sync-book
   npm run dev
   ```

6. **Smoke test**

   - Open `http://localhost:3330/register` — set name, email, **password**, optional phone → email OTP → (optional phone OTP).
   - Open `http://localhost:3330/login` — try **Password** and **Email code**.
   - Open `http://localhost:3330/textbook/index.html` — bottom bar should show login / mark chapter complete when signed in.
   - Complete **`/textbook/extras/diagnostic.html`** while signed in to store diagnostic data on **`/dashboard`**.

**Password rules:** minimum **8** characters; stored as **bcrypt** hash (`passwordHash` on `User`). OTP sign-in still works for accounts that have no password yet.

---

## Run (quick reference)

```bash
cd trainer
docker compose up -d    # if using local Postgres
npm install
cp .env.example .env    # fill DATABASE_URL, SESSION_SECRET, optional Resend / Twilio
npx prisma db push
npm run sync-book
npm run dev               # http://localhost:3330
```

---

## Deploying (e.g. Vercel)

- Set project **root** to **`trainer`**.
- **Environment variables:** `DATABASE_URL` (e.g. Neon), `SESSION_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` (and Twilio if you use SMS). Do **not** set `OTP_DEBUG` in production.
- Production build runs **`prebuild`** → syncs the textbook into `public/textbook`.

---

## Legal

The mock shell is for **practice UX only**. Not affiliated with GMAC or Pearson VUE.
