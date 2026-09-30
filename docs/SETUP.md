# Vigilancai setup, step by step

Follow these in order. Each step ends with the exact value to paste into `.env`. Budget about 45 minutes the first time.
Names in **bold** are things you type; names in `code` are labels you click in a dashboard.

The `.env` file you are filling in is `.env` at the repo root (copy it from `.env.example` first):

```bash
cp .env.example .env
```

---

## 1. Supabase (database + sign-in)

### 1a. Create the project

1. Go to https://supabase.com/dashboard and sign in (GitHub login is fine).
2. If you have no organization yet, it asks you to create one. Name it **Vigilancai** (or your company name), plan **Free**.
3. Click `New project`.
4. Fill in:
   - `Organization`: the one you just made.
   - `Project name`: **vigilancai**  
     (Make a second project later named **vigilancai-dev** if you want a sandbox. One project is enough to start.)
   - `Database password`: click `Generate a password`, then copy it somewhere safe. You only need it for the CLI or a SQL client; the app never uses it.
   - `Region`: **West US (North California)**. Closest to Tucson; keep the app and the database in the same region.
   - `Security options` / `Data API`: leave defaults.
5. Click `Create new project`. Wait for the green "Project is ready" state (about 2 minutes).

There is no database to name. Every Supabase project has one Postgres database called `postgres`; the tables you create in the next step live in its `public` schema.

### 1b. Copy the keys

1. Left sidebar → gear icon `Project Settings` (bottom of the sidebar).
2. Click `Data API`. Copy `Project URL`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   ```
3. Click `API Keys` (in the same settings section).
   - Supabase now shows two tabs: `Publishable and secret keys` and `Legacy anon, service_role`. Use the **legacy** tab; this codebase uses the `anon` and `service_role` JWTs.
   - Copy `anon` `public`:
     ```
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
     ```
   - Click `Reveal` next to `service_role` `secret` and copy it:
     ```
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
     ```
   The service_role key bypasses every security rule. It goes in `.env` and in Vercel's server-side env only. Never put it in a `NEXT_PUBLIC_` variable and never commit it.

### 1c. Create the tables

1. Left sidebar → `SQL Editor`.
2. Click `+ New query` (or the `New SQL Snippet` button).
3. Open `supabase/migrations/0001_init.sql` from this repo, select all, copy, paste into the editor.
4. Click `Run` (bottom right, or Ctrl/Cmd+Enter).
5. You should see `Success. No rows returned`.
6. Confirm: left sidebar → `Table Editor`. You should see `alert_recipients`, `changes`, `guide_pillars`, `guide_redirects`, `guide_spokes`, `pipeline_runs`, `profiles`, `source_snapshots`, `sources`, `subscriptions`, `user_settings`.

If you ever need to re-run it from scratch: `SQL Editor` → run `drop schema public cascade; create schema public; grant all on schema public to postgres, anon, authenticated, service_role;` first, then run the migration again. Only do that on a project with no real data.

Alternative with the CLI (optional): `npm i -g supabase && supabase login && supabase link --project-ref <ref from your Project URL> && supabase db push`. The `--project-ref` is the `xxxxxxxxxxxx` part of the URL.

### 1d. Configure sign-in

1. Left sidebar → `Authentication` → `Sign In / Providers` (older UI: `Providers`).
2. `Email` should already be enabled. Click it and set:
   - `Enable Email provider`: on.
   - `Confirm email`: **off while you are testing locally**, so a new signup lands in the app immediately. Turn it back on before you invite real customers.
   - `Secure email change`, `Secure password change`: leave defaults.
   Click `Save`.
3. Left sidebar → `Authentication` → `URL Configuration`:
   - `Site URL`: **http://localhost:3000** for now. Change it to **https://your-domain.com** when you deploy.
   - `Redirect URLs` → `Add URL`, add both:
     - **http://localhost:3000/auth/callback**
     - **https://your-domain.com/auth/callback** (add it now even if the domain is not live yet)
   Click `Save`.

### 1e. Seed the demo data

```bash
npm install
npm run seed
```

This creates a user **demo@vigilancai.local** with password **vigilancai-demo**, seven sources, nine changes, two crew recipients, and the guide content. Re-running it wipes and re-creates that user's rows. To seed under your own email instead:

```bash
SEED_EMAIL=you@example.com SEED_PASSWORD=pick-something npm run seed
```

Now `npm run dev`, open http://localhost:3000/login, and sign in with those credentials. You should see "Good morning, Lewis." with four cards.

---

## 2. Claude (the writer half of the classifier)

1. Go to https://console.anthropic.com → sign in → `API Keys` (left sidebar) → `Create Key`.
2. Name it **vigilancai-pipeline**. Copy the key; it is shown once.
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
3. `Billing` → add a payment method or credits. Each diff costs a fraction of a cent; a busy account with 25 sources checked daily is a few dollars a month.

Nothing else to configure. The model defaults to `claude-opus-5-5`; set `CLAUDE_MODEL` only if you want a different one.

---

## 3. Laya (the fast half of the classifier)

Optional. Without it the pipeline is Claude-only and every change is marked `llm_only` in "Why we flagged this". With it you get the agree/disagree gate and attribution.

### Run it locally first

```bash
cd services/laya
pip install "fastapi[standard]" laya      # or: uv sync
uvicorn main:app --port 8000
```

The first start downloads the 800 MB checkpoint. When you see `Application startup complete`, test it:

```bash
curl localhost:8000/health
```

Then in `.env`:
```
LAYA_URL=http://localhost:8000
```

### Deploy it (Railway is the least setup)

1. https://railway.app → `New Project` → `Deploy from GitHub repo` → pick **lewybagz/vigilancai**.
2. In the service's `Settings`:
   - `Root Directory`: **services/laya**
   - `Builder`: Dockerfile (Railway detects it).
   - `Networking` → `Generate Domain`. Copy the URL.
3. `Variables` → add:
   - `LAYA_API_KEY` = a long random string (run `openssl rand -hex 24` to make one).
   - `PORT` = **8000**.
4. `Settings` → `Resources`: at least **2 GB** memory, 2 vCPU.
5. Deploy. The first build bakes the model into the image and takes 5 to 10 minutes.

In `.env` (and later in Vercel):
```
LAYA_URL=https://your-service.up.railway.app
LAYA_API_KEY=the same random string
```

Fly.io and Render work the same way: point them at `services/laya/Dockerfile`, give the container 2 GB, set the two variables.

---

## 4. Resend (email)

1. https://resend.com → sign up → `Domains` → `Add Domain` → enter **vigilancai.com** (or whatever domain the briefing should come from).
2. Resend shows DNS records (an MX, a TXT for SPF, and a TXT for DKIM). Add them at your DNS provider, then click `Verify DNS Records`. Verification can take up to an hour.
3. `API Keys` → `Create API Key`:
   - `Name`: **vigilancai**
   - `Permission`: **Sending access**
   - `Domain`: the domain you just verified
   Copy the key.
4. In `.env`:
   ```
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL="Vigilancai <briefing@vigilancai.com>"
   ```
   The address must be on the verified domain; the mailbox does not have to exist.

For testing before DNS is verified, Resend lets you send from `onboarding@resend.dev` to the email you signed up with only. Use that as `RESEND_FROM_EMAIL` and seed with `SEED_EMAIL` set to your own address.

---

## 5. Stripe (billing)

1. https://dashboard.stripe.com → make sure the `Test mode` toggle (top right) is **on** until you are ready for real money.
2. `Product catalog` → `+ Add product`:
   - `Name`: **Vigilancai Starter**, `Recurring`, **49.00 USD**, `Monthly`. Save.
   - Repeat: **Vigilancai Pro**, **149.00 USD**, `Monthly`.
3. Open each product and copy the price ID (starts with `price_`, shown under the price row):
   ```
   STRIPE_PRICE_STARTER=price_...
   STRIPE_PRICE_PRO=price_...
   ```
4. `Developers` (bottom left, or the `</>` icon) → `API keys` → copy `Secret key`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```
5. Webhook. `Developers` → `Webhooks` → `+ Add endpoint`:
   - `Endpoint URL`: **https://your-domain.com/api/stripe/webhook**  
     (For local testing use the Stripe CLI instead: `stripe listen --forward-to localhost:3000/api/stripe/webhook`; it prints a `whsec_` secret.)
   - `Events to send` → `Select events` → check:
     `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
   - `Add endpoint`, then click `Reveal` under `Signing secret`:
     ```
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```
6. `Settings` (gear) → `Billing` → `Customer portal` → `Activate` (defaults are fine; allow customers to cancel and update payment method).

When you go live, repeat steps 2 to 5 with `Test mode` off; live keys and price IDs are different.

---

## 6. Cron secret

Any long random string. The scheduled jobs refuse requests without it.

```bash
openssl rand -hex 32
```
```
CRON_SECRET=<that value>
```

---

## 7. Deploy to Vercel

1. https://vercel.com → `Add New…` → `Project` → import **lewybagz/vigilancai**.
2. `Framework Preset`: Next.js (auto). `Root Directory`: leave as `./`.
3. `Environment Variables`: paste every line from your `.env` except change
   `NEXT_PUBLIC_SITE_URL` to **https://your-domain.com** (or the `*.vercel.app` URL for now). Vercel accepts a pasted `.env` block into the first field and splits it.
4. `Deploy`.
5. After the first deploy: `Settings` → `Cron Jobs` should list `/api/cron/check` (hourly) and `/api/cron/briefing` (every 15 min) from `vercel.json`. Vercel sends `CRON_SECRET` automatically as a bearer token because the variable is named exactly that.
6. `Settings` → `Domains` → add your domain and follow the DNS instructions.
7. Go back and update:
   - Supabase `Authentication` → `URL Configuration` → `Site URL` to your domain.
   - Stripe webhook endpoint URL to your domain (if you created it with a placeholder).
   - Resend nothing; it is domain-based already.

Hobby plan cron runs once a day at most. The hourly schedule needs Vercel Pro. On Hobby, change `vercel.json` to `"schedule": "0 13 * * *"` (6 am Phoenix) for the check job and `"0 14 * * *"` for briefing, or trigger the check manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://your-domain.com/api/cron/check?force=1"
```

---

## 8. Smoke test, in order

1. `npm run dev` → http://localhost:3000 loads the marketing site; `/guides` shows two pillars.
2. `/login` with the seeded user → the briefing shows four cards. Tap one; it expands with the diff.
3. `/app/sources` → `Add a source` → paste a page you control (a GitHub gist raw URL works). `Check now` on Home. The first check is a baseline, so nothing appears yet.
4. Edit the page so a dollar amount changes. `Check now` again. A card appears within about 20 seconds. If Laya is running you will see agreement or "Needs review" in "Why we flagged this".
5. `/app/settings` → add your own email under `Critical alerts`. Make a change the classifiers will call critical (a fee increase "effective immediately"). Check now. You should receive the alert email.
6. `/app/settings` → `Starter · $49/mo` → Stripe test checkout with card `4242 4242 4242 4242`, any future date, any CVC. After redirect, the plan shows within a minute (the webhook writes it).

---

## Where each secret goes

| Variable | Local `.env` | Vercel | Railway (Laya) |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | yes | |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | yes | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | yes | |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | yes | |
| `ANTHROPIC_API_KEY` | yes | yes | |
| `LAYA_URL`, `LAYA_API_KEY` | yes | yes | `LAYA_API_KEY` only |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | yes | yes | |
| `CRON_SECRET` | yes | yes | |
| `STRIPE_*` | yes | yes | |
