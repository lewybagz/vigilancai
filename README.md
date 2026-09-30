# Vigilancai

One screen, every morning: what changed at the jurisdictions, suppliers, manufacturers, and licensing boards a roofing, HVAC, or GC business depends on, ranked by severity, with the number and the action.

- **App** (`/app`): the Good Morning briefing, History with a weekly summary, Sources with per-source cadence and snooze, Settings (briefing cadence, delivery time, severity threshold, business profile, critical-alert recipients, billing).
- **Marketing site** (`/`, `/how-it-works`, `/pricing`, `/about`) and **Guides** (`/guides/...`, hub-and-spoke with JSON-LD, redirects, sitemap).
- **Monitoring pipeline**: fetch, diff, classify with **Laya** (fast decision model) and **Claude** (writes the card), reconcile, alert with **Resend**.
- **Billing**: Stripe Checkout, Customer Portal, webhooks.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres, RLS, Auth) · Anthropic SDK · Resend · Stripe · a small FastAPI sidecar for Laya (`services/laya`).

## Local setup

1. **Install**
   ```bash
   npm install
   cp .env.example .env   # fill in the values below
   ```

2. **Supabase**
   - Create a project. Copy the URL, anon key, and service-role key into `.env`.
   - Apply the schema: paste `supabase/migrations/0001_init.sql` into the SQL editor, or `supabase db push` with the CLI.
   - Auth → URL configuration: add `http://localhost:3000/auth/callback` (and your production URL) to redirect URLs.

3. **Seed demo data** (a demo user "Lewis" with 7 sources, 9 changes, settings, crew recipients, and the guide content):
   ```bash
   npm run seed
   # sign in with demo@vigilancai.local / vigilancai-demo (override with SEED_EMAIL / SEED_PASSWORD)
   ```

4. **Run**
   ```bash
   npm run dev
   ```

## The pipeline

```
Vercel Cron (hourly) ──► /api/cron/check
  for each due source (cadence, not snoozed):
    fetch page ─► text ─► hash ─► compare to last snapshot
    changed?  ─► line diff with context
      ├─ boilerplate heuristics ─► skip
      ├─ Laya on the raw diff: material? category? severity? trade relevance?
      │     (very confident "noise" on a tiny diff ─► skip, no LLM spend)
      ├─ Claude extracts up to 4 distinct changes and writes headline / number / date / action
      ├─ Laya re-reads each extracted change (with attribution for "Why we flagged this")
      ├─ reconcile: agreement ─► published; disagreement or low Laya confidence ─► needs_review
      └─ published + critical ─► immediate Resend alert to owner + crew recipients

Vercel Cron (every 15 min) ──► /api/cron/briefing
  send daily/weekly briefing emails whose local delivery time has passed
```

Design decisions:
- **Both classify, Claude breaks ties.** Claude's severity and category always win on the card. Laya's job is to say whether it agrees; when it does not, or is not confident (`LAYA_MIN_CONFIDENCE`, default 0.7), the change is held as *Needs review* in the app instead of being emailed. A critical alert never fires on a disagreement.
- **Laya is optional.** If `LAYA_URL` is unset or the service is down, the pipeline runs Claude-only and records `classification.method = "llm_only"`.
- **The first fetch of a source is a baseline.** Nothing is reported until a later fetch differs.
- **Snapshots are stored before classification**, so a Claude or Laya failure never re-triggers the same diff.

Run it by hand:
```bash
npm run pipeline:run             # due sources
npm run pipeline:run -- --force  # every source
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/check?force=1"
```

### Laya service

See `services/laya/README.md`. Short version:
```bash
cd services/laya && uv sync && uv run uvicorn main:app --port 8000
```
Set `LAYA_URL=http://localhost:8000` (and `LAYA_API_KEY` on both sides if you want auth). Deploy the Dockerfile to Railway / Fly / Render with 2 GB RAM.

### Claude

`ANTHROPIC_API_KEY` is required for classification. The model defaults to `claude-opus-5-5` (`CLAUDE_MODEL` overrides). Requests use structured outputs (Zod schema) and cache the system prompt.

### Resend

`RESEND_API_KEY` and `RESEND_FROM_EMAIL` (a verified domain sender). Two emails exist: the critical alert (immediate, owner + recipients) and the briefing (daily/weekly, owner only, filtered by the severity threshold in Settings).

### Vercel Cron

`vercel.json` schedules `/api/cron/check` hourly and `/api/cron/briefing` every 15 minutes. Set `CRON_SECRET` in the Vercel project; Vercel sends it as `Authorization: Bearer`. Sources with an hourly cadence are checked each run; daily and weekly ones only when due.

### Stripe

1. Create two recurring prices (Starter $49/mo, Pro $149/mo) and put their IDs in `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO`.
2. Add a webhook endpoint at `https://your-domain/api/stripe/webhook` for `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
3. Enable the Customer Portal in the Stripe dashboard.

Plan limits live in `src/lib/plans.ts` (sources and crew recipients per tier; a free allowance of 3 sources before checkout).

## Project layout

```
src/app/(marketing)/      marketing pages + /guides
src/app/app/              the product (Home, History, Sources, Settings)
src/app/api/cron/         pipeline and briefing entry points
src/app/api/stripe/       checkout, portal, webhook
src/components/app/       ChangeCard, ChangeFeed, WeeklySummary, forms
src/components/marketing/ nav, footer, demo cards, mockup
src/components/guides/    JSON-LD, markdown body, FAQ, related guides
src/lib/pipeline/         fetch, diff, laya, claude, classify, run, alerts, briefing
src/lib/email/            templates + Resend sender
src/lib/guides/           data access, schema builders, seed content
supabase/migrations/      schema, RLS, triggers (slug redirects, new-user bootstrap)
services/laya/            FastAPI sidecar + Dockerfile
scripts/                  seed.ts, run-pipeline.ts
```

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build |
| `npm run typecheck` / `npm run lint` | Checks |
| `npm run seed` | Demo data + guides |
| `npm run pipeline:run` | Run the monitoring pipeline locally |
