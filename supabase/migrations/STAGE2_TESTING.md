# POLAR V1 — Stage 2 Testing & Role-Promotion Guide

## 1. Deploy this stage

1. Add `0002_stage2_roles.sql` to `supabase/migrations/` in the existing
   POLAR repo (same folder as `0001_stage1_foundation.sql`).
2. Commit and push to `main` as usual.
3. Run the migration: Supabase project → SQL Editor → paste the full
   contents of `0002_stage2_roles.sql` → Run.
   (No Vercel changes needed — this stage adds no app code.)

## 2. Create two test accounts first

Use the app's existing Supabase Auth (e.g. via the Supabase dashboard
→ Authentication → Add user, or any temporary sign-up you already have
working) to create:

- **Test Account A** — will stay a plain client
- **Test Account B** — will be promoted to barber

Copy each account's `id` (uuid) from Authentication → Users.

## 3. Exact test procedure

Run each of these in the Supabase SQL Editor.

**a. Confirm auto-grant on signup**
```sql
select * from public.user_roles where user_id = '<Test Account A uuid>';
```
Expect: exactly one row, `role = 'client'`, `granted_by = null`.

**b. Confirm a client cannot self-promote**
Run as Test Account A would only be possible through the app (there is
no UI yet), so instead confirm structurally: check that no INSERT,
UPDATE or DELETE policy exists on `user_roles`.
```sql
select cmd from pg_policies where tablename = 'user_roles';
```
Expect: only one row, `cmd = 'SELECT'`. No insert/update/delete policy
at all confirms there is no app-level path to change a role.

**c. Promote Test Account B to barber**
```sql
insert into public.user_roles (user_id, role, granted_by)
values ('<Test Account B uuid>', 'barber', null)
on conflict (user_id, role) do nothing;
```

**d. Confirm has_role() works**
```sql
select public.has_role('barber');
```
Run this via the app's Supabase client while authenticated as Test
Account B (not the SQL Editor, which bypasses RLS) — expect `true`.
Same call authenticated as Test Account A — expect `false`.

**e. Confirm accounts can't see each other's roles**
While authenticated as Test Account A (via the app's Supabase client,
not the SQL Editor):
```sql
select * from public.user_roles;
```
Expect: only Test Account A's own row — never Test Account B's.

**f. Stage 1 regression check**
```sql
select * from public._health_check;
```
Run this as any authenticated (non-service-role) connection. Expect:
permission denied / zero rows, same as Stage 1. Confirms this
migration didn't loosen anything.

## 4. Granting Rahim's real roles (when ready)

Once Rahim's real account exists (Stage 3+), grant all three roles he
needs for development:
```sql
insert into public.user_roles (user_id, role, granted_by) values
  ('<Rahim uuid>', 'barber', null),
  ('<Rahim uuid>', 'owner_admin', null),
  ('<Rahim uuid>', 'designer_developer', null)
on conflict (user_id, role) do nothing;
```

## 5. What I could not execute myself

- I don't have a live Supabase project or database connection in this
  environment, and this sandbox has no internet access — so I could
  not run the migration, could not connect to Postgres to lint/execute
  the SQL, and could not create the two test accounts myself. Steps
  1–4 above need to be run by you/ChatGPT against your real project.
- I did run a basic structural sanity check on the SQL file locally
  (balanced parentheses, balanced `$$` quoting, statement count) — that
  catches obvious syntax slips but is not a substitute for actually
  running it against Postgres.
- No TypeScript/app files changed in this stage, so there's nothing to
  rebuild or redeploy on Vercel for Stage 2 — the existing Stage 1
  deployment is untouched.
