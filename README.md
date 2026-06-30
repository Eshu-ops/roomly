# Roomly — setup guide

This is a real Next.js + Supabase app: genuine email/password auth, a Postgres
database with row-level security, and live realtime sync across every
roommate's device. Follow these steps in order — total time is about 15–20
minutes, no coding required for setup.

## 1. Create a Supabase project (your database + auth)

1. Go to https://supabase.com and sign up (free).
2. Click **New project**. Pick any name (e.g. "roomly"), set a database
   password (save it somewhere), pick the region closest to your house, and
   click **Create new project**. Wait ~2 minutes for it to provision.
3. In the left sidebar, open **SQL Editor** → **New query**.
4. Open `supabase/schema.sql` from this project, copy the entire file, paste
   it into the SQL editor, and click **Run**. This creates every table
   (houses, members, expenses, meals, payments, notes, events, attachments,
   activity log), turns on row-level security so each house's data is
   private to its members, and creates a storage bucket for receipts.
5. In the left sidebar, open **Authentication → Providers**, confirm
   **Email** is enabled (it is by default). If you don't want new sign-ups
   to require clicking a confirmation email while testing, go to
   **Authentication → Settings** and turn off "Confirm email" — turn it back
   on before sharing with real roommates.
6. In the left sidebar, open **Project Settings → API**. You'll need two
   values from this page in step 3 below: **Project URL** and the
   **anon public** key.

## 2. Get the code running locally (optional, to test first)

```bash
npm install
cp .env.local.example .env.local
# paste your Project URL and anon key into .env.local
npm run dev
```

Open http://localhost:3000 — sign up with an email and password, create a
house, and you're in. Open the same URL in a second browser (or your phone)
and sign up as a second person using the invite code shown on the
Roommates page — add an expense in one window and watch it appear instantly
in the other. That's the real Supabase Realtime connection at work, not a
simulation.

## 3. Deploy it live with Vercel (free)

1. Push this folder to a GitHub repository (create one at github.com/new,
   then `git init && git add . && git commit -m "roomly" && git remote add
   origin <your repo url> && git push -u origin main`).
2. Go to https://vercel.com, sign up with GitHub, click **Add New → Project**,
   and import the repository you just pushed.
3. In the import screen, expand **Environment Variables** and add the same
   two values from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. In about a minute you'll get a live URL like
   `roomly-yourname.vercel.app` — that's your real, shareable site.
5. Share that URL plus your house's invite code (Roommates page) with your
   roommates. Anyone who signs up and enters the code joins your live house
   instantly.

## What's real here

- **Auth**: genuine Supabase email/password accounts, not a demo login.
- **Database**: real Postgres with row-level security — each house's data
  is invisible to anyone not in `members` for that house.
- **Live sync**: Supabase Realtime subscriptions push every insert/update/
  delete to all connected browsers within roughly a second, no refresh.
- **Meal rate, balances, splits**: computed in `lib/calc.js`, the same
  logic used by the dashboard, balances page, and reports — one source of
  truth.
- **PWA**: `manifest.json` + `next-pwa` make it installable to a phone home
  screen with offline caching of already-visited pages.

## What's intentionally lighter than the original full spec

These are stubbed, simplified, or left as a clear next step rather than
fully built, to keep this a working v1 you can actually deploy today:

- **Google OAuth** — not wired up (you asked for email/password only this
  round). Adding it later is a few lines in Supabase's Auth → Providers
  panel plus a button in `app/login/page.js`.
- **Percentage / custom-amount splits** — the schema (`expense_splits`
  table) and calculation function support them, but the add-expense form
  only exposes Equal and Selected-roommates splits; a finer UI for entering
  percentages per person is the natural next addition.
- **QR code invites** — the invite code exists and copies to clipboard; the
  QR image itself isn't generated yet (a `qrcode.react` component would do
  it in ~10 lines).
- **Offline write queue** — next-pwa caches pages for offline *viewing*;
  offline *adding* an expense that syncs once you're back online isn't
  implemented (would need a local outbox table + sync-on-reconnect logic).
- **Undo last action** — `activity_log` records every action so the data
  for an undo feature exists, but the one-click "undo" button isn't wired
  up yet.
- **Monthly archive/lock** — `ledgers` table groups expenses by month and
  has a `locked` flag; the admin UI to lock a month and browse past months
  isn't built yet, only the current month is shown.

I built the full database schema for all of these on purpose, so none of
this needs a redesign later — it's additive work on top of what's here.
