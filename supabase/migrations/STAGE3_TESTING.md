# POLAR V1 — Stage 3 Testing Guide

## 1. Deploy

1. Add these to the existing repo (no existing file is modified —
   everything below is new):
   ```
   supabase/migrations/0003_stage3_accounts.sql
   src/lib/types.ts
   src/lib/legal/versions.ts
   src/lib/auth/require-role.ts
   src/lib/actions/auth.ts
   src/components/form.tsx
   src/app/signup/client/page.tsx
   src/app/signup/barber/page.tsx
   src/app/login/page.tsx
   src/app/verify-email/page.tsx
   src/app/auth/callback/route.ts
   src/app/dashboard/client/page.tsx
   src/app/dashboard/barber/page.tsx
   src/app/legal/terms/page.tsx
   src/app/legal/privacy/page.tsx
   ```
2. Commit and push to `main`.
3. Run the migration: Supabase → SQL Editor → paste the full contents
   of `0003_stage3_accounts.sql` → Run.
4. **Required manual dashboard step (I cannot do this myself):**
   Supabase → Authentication → Providers → Email → confirm **"Confirm
   email"** is enabled. Also check Authentication → URL Configuration
   → Site URL and Redirect URLs include your deployed domain plus
   `/auth/callback` (e.g. `https://<your-app>.vercel.app/auth/callback`
   and `http://localhost:3000/auth/callback` for local testing).
5. `npm run build` locally to confirm it compiles (I ran static
   brace/import checks here, but this sandbox has no internet, so I
   could not run the real Next.js compiler or type-checker — please
   run this before/while deploying).
6. Deploy to Vercel as usual — no new environment variables needed.

## 2. Exact test procedure

**a. Client sign-up**
Go to `/signup/client`, fill the form, submit. Expect: redirected to
`/verify-email`. In Supabase → SQL Editor:
```sql
select * from public.profiles order by created_at desc limit 1;
select * from public.user_roles where user_id = (select id from public.profiles order by created_at desc limit 1);
select * from public.terms_acceptances where user_id = (select id from public.profiles order by created_at desc limit 1);
```
Expect: one `profiles` row with your name/phone; `user_roles` shows
**only** `client`; `terms_acceptances` shows **three** rows (`terms`,
`privacy`, `age_declaration`) with matching versions and a real
timestamp.

**b. Barber sign-up (critical test)**
Go to `/signup/barber`, fill all fields, submit. Expect: same
`/verify-email` redirect. Check:
```sql
select * from public.barber_professional_details order by profile_id desc limit 1;
select * from public.user_roles where user_id = (select id from public.profiles order by created_at desc limit 1);
```
Expect: `barber_professional_details` row exists with your submitted
fields — **but `user_roles` still shows only `client`.** If this shows
`barber`, stop and flag it — that would be a broken self-promotion
path.

**c. Email verification**
Click the real verification link received by email. Expect: browser
lands on `/login` (not a dashboard — confirms Decision B). Attempting
to log in *before* clicking the link should be refused by Supabase
with an "email not confirmed" error.

**d. Legal version tamper check**
This confirms the trigger actually validates rather than trusting the
client. Temporarily edit `LEGAL_VERSIONS.terms` in
`src/lib/legal/versions.ts` to a wrong value (e.g. add `-test`),
redeploy, attempt a fresh sign-up. Expect: sign-up fails with a
Postgres error surfaced as the Supabase error message, and **no**
`auth.users` row is created at all (transaction fully rolled back).
Revert the change afterward.

**e. Direct-URL authorization test (Required Fix 2)**
Log in as a plain client account. While logged in, manually type
`/dashboard/barber` into the browser address bar. Expect: redirected
to `/login`, no barber content ever visible. Then manually promote
that same account to barber (Stage 2 command), log out, log back in —
expect normal redirect to `/dashboard/barber`, and now direct
navigation to `/dashboard/barber` succeeds.

**f. Cross-account privacy check**
With two different accounts, confirm (via the app, not the SQL
Editor, since the Editor bypasses RLS) that Account A cannot read
Account B's `profiles`, `barber_professional_details`, or
`terms_acceptances` rows.

**g. Public legal page check**
Visit `/legal/terms` and `/legal/privacy` while logged out. Expect:
both load and are readable without an account, per Section 14's
requirement that users can read the Terms before agreeing.

**h. Regression checks**
```sql
select * from public._health_check; -- still blocked (Stage 1)
select cmd from pg_policies where tablename = 'user_roles'; -- still SELECT-only (Stage 2)
```
Also confirm Stage 2's `handle_new_user()` trigger and its grant of
`client` on signup are unchanged — Stage 3 added a second, independent
trigger rather than modifying it.

## 3. What I could not execute myself

- No live Supabase/Postgres connection and no internet in this
  sandbox — I could not run the migration, could not send or receive
  a real verification email, and could not click a real confirmation
  link. Steps 2a–2g above must be run by you/ChatGPT against the real
  environment.
- I could not run `npm run build`, `tsc`, or Next.js's dev server
  here (no internet to install dependencies) — I only ran manual
  balanced-brace/paren checks and confirmed every `@/...` import
  resolves to a real file on disk. Please run a real build before or
  during deployment to catch anything a static text check can't (type
  errors, JSX issues, etc.).
- The Supabase Auth dashboard toggles (email confirmation, redirect
  URLs) in step 1.4 require your dashboard access — I have no way to
  set those myself.

## 4. Scope confirmation

Nothing in this stage touches client profile cards, client directory,
booking, calendar, Workflow Mode, payments, Shop, or any V2+/future
concept. This is strictly: create account (client or barber-applicant)
→ verify email → log in/out → role stays client-only until manually
promoted → Terms/Privacy/age declaration recorded immutably →
dashboards enforce their own access server-side.
