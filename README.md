# POLAR V1 — Complete Stage 1 + Stage 2 + Stage 3 Package

This is the full, current, authoritative POLAR V1 codebase through the
end of Stage 3. It supersedes any earlier partial/patch delivery —
deploy this whole package as one unit rather than merging files by hand.

**Not included:** anything from Stage 4 onward (client profile cards,
client directory, booking, calendar, Workflow Mode, payments, Shop,
multi-barber). Those begin only once Stage 3 is tested and approved.

## What's included, by stage

**Stage 1 — Project Foundation**
- Next.js (App Router, TypeScript, Tailwind) scaffold
- Supabase browser/server/middleware client helpers (`src/lib/supabase/`)
- `_health_check` RLS default-deny proof table
- Status page at `/`

**Stage 2 — Roles & Account Foundation**
- `polar_role` enum, `user_roles` join table (multi-role capable)
- `has_role()` permission-check function
- Signup trigger granting `client` only, ever, by default

**Stage 3 — Account & Authentication Foundation**
- Client sign-up (`/signup/client`) and Barber sign-up
  (`/signup/barber`), including the four Section 02 professional-detail
  fields for barbers
- Structured Client Address and Barber Home/Work Address, collected at
  sign-up, with address privacy enforced via `barber_client_links`
  (see below)
- Login (`/login`), logout, session handling
- Email verification flow: `/verify-email` (with resend) and
  `/auth/callback` (confirms the email, then always sends the user to
  `/login` — never straight into a dashboard)
- Terms/Privacy/Age-16+ declaration: draft pages at `/legal/terms` and
  `/legal/privacy`, with immutable server-verified acceptance recording
  (`legal_documents` + `terms_acceptances`)
- Two functional-only placeholder dashboards (`/dashboard/client`,
  `/dashboard/barber`), each enforcing its own access **server-side**
  (`src/lib/auth/require-role.ts`) — not just hidden by the UI

## Migrations — run in this exact order

```
supabase/migrations/0001_stage1_foundation.sql
supabase/migrations/0002_stage2_roles.sql
supabase/migrations/0003_stage3_accounts.sql
supabase/migrations/0004_stage3_addresses.sql
```

If `0001`–`0003` are already applied to your Supabase project from
earlier sessions, only `0004` is new — but re-check via SQL Editor
(`select * from public.barber_client_links limit 1;` should not error)
rather than assuming, since your deployed app code was out of sync
with these migrations before this package.

## Setup (from a clean or partially-set-up Supabase/Vercel project)

1. **Install dependencies** (needs internet — do this on your own
   machine, not in a sandbox without network access):
   ```
   npm install
   ```

2. **Supabase project** — if you don't already have one, create it at
   supabase.com. If you do, you're reusing it.

3. **Run all four migrations in order**, via Supabase → SQL Editor,
   pasting each file's full contents and running it one at a time.

4. **Supabase Auth dashboard settings:**
   - Authentication → Providers → Email → confirm **"Confirm email"**
     is enabled.
   - Authentication → URL Configuration → **Site URL** set to your real
     deployed domain (not `localhost`), e.g.
     `https://your-app.vercel.app`.
   - Authentication → URL Configuration → **Redirect URLs** — add both:
     ```
     https://your-app.vercel.app/auth/callback
     http://localhost:3000/auth/callback
     ```

5. **Environment variables.** Copy `.env.local.example` to `.env.local`
   and fill in your Project URL and **publishable key** (Supabase →
   Project Settings → API — note the key is named
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in this codebase, matching
   current Supabase/Vercel naming, not the older `ANON_KEY` name).
   Set the same two variables in Vercel → Project Settings →
   Environment Variables.

6. **Run locally to sanity-check:**
   ```
   npm run build
   npm run dev
   ```
   (`npm run build` catches any real TypeScript/compile issue before
   you deploy — this sandbox has no internet, so I could not run it
   myself; please run it before or during deployment.)

7. **Deploy.** Push this entire package to `main` on GitHub — replacing
   the existing `src/app` contents rather than merging by hand — then
   let Vercel redeploy from the new `main`. See "Deployment procedure"
   below for the exact safe sequence.

## One manual, temporary step: linking Rahim to his clients

`barber_client_links` is the table that lets a barber see their own
clients' addresses — deliberately scoped per barber-client pair, never
by role alone, so a future second barber can never see another
barber's clients by default. For V1, since no client-relationship
feature exists yet (that's Stage 6+/8), each link is created manually:

```sql
insert into public.barber_client_links (barber_profile_id, client_profile_id)
values ('<Rahim profile id>', '<client profile id>')
on conflict do nothing;
```

This is explicitly **temporary V1 setup behaviour**, not intended as
ongoing practice — see the comment block above the table definition in
`0004_stage3_addresses.sql` for the future-stage plan to automate it.

## Testing

Full step-by-step procedures:
- `supabase/migrations/STAGE2_TESTING.md`
- `supabase/migrations/STAGE3_TESTING.md`
- `supabase/migrations/STAGE3_ADDRESSES_TESTING.md`

## Rule for every future migration

Any new table must enable RLS in the same migration that creates it,
with no policies until access is deliberately and explicitly granted.
Every table added since Stage 1 follows this.

## Not in this package

No client profile cards, client directory, calendar/booking, Workflow
Mode, payments, Shop, or multi-barber functionality. Those are Stage 4
onward and begin only after Stage 3 is fully tested and approved.
