# POLAR V1 — Stage 1: Project Foundation

This is the initial scaffold only. No login, roles, profiles, or booking
exist yet — those are Stages 2+. This stage exists purely to prove the
pipeline (Next.js → Vercel → Supabase, with RLS default-deny) works end
to end before anything real is built on top of it.

## What's in this stage

- Next.js (App Router, TypeScript, Tailwind) scaffold
- Supabase browser + server client helpers (`src/lib/supabase/`)
- Middleware that keeps the Supabase session cookie fresh
- One SQL migration (`supabase/migrations/0001_stage1_foundation.sql`)
  that enables Row-Level Security with **no policies** on a placeholder
  table — proving default-deny is active
- A single status page (`/`) that checks all three things and shows
  OK/FAILED — this is the whole Stage 1 test

## Setup

1. **Install dependencies** (needs internet — this sandbox doesn't have
   it, so run this on your own machine):
   ```
   npm install
   ```

2. **Create a Supabase project** at supabase.com (you do this — I can't
   create accounts on your behalf). Free tier is enough for V1.

3. **Run the migration.** Easiest path: open your Supabase project →
   SQL Editor → paste the contents of
   `supabase/migrations/0001_stage1_foundation.sql` → Run.
   (Once you're comfortable with it, the Supabase CLI can run migrations
   from this folder directly instead — happy to set that up when useful.)

4. **Set environment variables.** Copy `.env.local.example` to
   `.env.local` and fill in your Project URL and anon public key from
   Supabase → Project Settings → API.

5. **Run locally:**
   ```
   npm run dev
   ```
   Open http://localhost:3000 — you should see three green "OK" rows.

6. **Deploy to Vercel.** Import this repo in Vercel, add the same two
   environment variables in the Vercel project settings, deploy.

## Stage 1 test (what you should be able to confirm)

- [ ] The app deploys and loads without errors, locally and on Vercel
- [ ] "Next.js app deployed" — OK
- [ ] "Supabase connection reachable" — OK (proves the app can talk to
      the database)
- [ ] "RLS default-deny active (no data exposed)" — OK (proves that a
      table with RLS on and no policy is correctly unreadable — this
      is the security baseline every future table starts from)

If any row shows FAILED, that's a Stage 1 bug — log it against Section
19.1 before moving on, per the agreed build order.

## Rule for every future migration

Any new table must enable RLS in the same migration that creates it,
with no policies until access is deliberately and explicitly granted.
See the comment header in `0001_stage1_foundation.sql`.

## Not in this stage

No roles, sign-up, login, client profiles, booking, or any other
POLAR HQ 2 feature. Those begin at Stage 2 once this stage is
confirmed working.
