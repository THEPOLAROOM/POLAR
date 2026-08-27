# POLAR V1 — Stage 3 Address Addendum Testing

## 1. Deploy

1. Add `0004_stage3_addresses.sql` to `supabase/migrations/` (after
   `0003_stage3_accounts.sql`), and the four updated files to their
   existing paths (`src/lib/actions/auth.ts`,
   `src/app/signup/client/page.tsx`, `src/app/signup/barber/page.tsx`,
   `src/app/legal/privacy/page.tsx`).
2. Commit, push, run the new migration in Supabase SQL Editor.
3. Redeploy on Vercel.

## 2. Test procedure

**a. Client address required and private**
Sign up a fresh client account without filling the address fields.
Expect: blocked client-side with the address error message before
`signUp()` is even called. Fill it in, submit successfully. Check:
```sql
select * from public.client_addresses order by profile_id desc limit 1;
```
Expect: one row with your address. Then, as a *second* client account
(via the app, not SQL Editor), confirm you cannot read the first
client's `client_addresses` row.

**b. Barber home address required**
Sign up a fresh barber account, leave home address blank. Expect:
blocked client-side. Fill in home address only, leave "Same as my
Personal/Home Address" unchecked, leave work address blank, submit.
Expect: blocked (work address required unless same-as-home is
ticked).

**c. Barber "same as home" path**
Same signup, this time tick "Same as my Personal/Home Address" and
submit with no work fields filled. Expect: succeeds. Check:
```sql
select work_same_as_home, work_address_line_1 from public.barber_addresses order by profile_id desc limit 1;
```
Expect: `work_same_as_home = true`, `work_address_line_1 = null` (the
DB constraint permits this specific combination only).

**d. Barber distinct work address path**
Sign up another barber account, fill in a different work address, leave
the checkbox unticked. Expect: succeeds, and the row shows
`work_same_as_home = false` with all work_* fields populated.

**e. owner_admin visibility**
Promote one test account to `owner_admin` (Stage 2 command). Confirm
that account (via the app's Supabase client, authenticated) can read
`client_addresses` and `barber_addresses` rows belonging to *other*
accounts. This is one of two intentional cross-account reads in this
addendum — the other is the authorised-barber link below.

**e2. Authorised barber access (the corrected behaviour)**
This is the important one. With a test barber account (promoted via
Stage 2's command) and a test client account both created:

1. **Before linking**, confirm the barber account **cannot** read the
   client's `client_addresses` row via the app's Supabase client —
   holding the `barber` role alone must not be enough.
2. Create the link (elevated access, e.g. SQL Editor):
   ```sql
   insert into public.barber_client_links (barber_profile_id, client_profile_id)
   values ('<barber profile id>', '<client profile id>');
   ```
3. **After linking**, confirm the same barber account can now read
   that specific client's address.
4. Create a *second* client account, do **not** link it to the
   barber. Confirm the barber still cannot read this second client's
   address — the link is per-client, not blanket role access.
5. When ready to grant Rahim access to a real client, use the same
   pattern with his real profile id.

**f. Confirm barber's own home address stays private from clients**
There is currently no policy that would let a client read any
`barber_addresses` row at all (home or work) — confirm this by
attempting the read as an authenticated client account and getting
zero rows. This is expected and correct for V1; work-address exposure
to a client with a real booking is Stage 8, not this addendum.

**g. Regression**
```sql
select * from public._health_check; -- still blocked (Stage 1)
select cmd from pg_policies where tablename = 'user_roles'; -- still SELECT-only (Stage 2)
select * from public.terms_acceptances where user_id = '<a test account>'; -- still 3 rows, unaffected by this change
```

## 3. What I could not execute myself

Same limitation as the rest of Stage 3: no live Supabase connection or
internet in this sandbox, so I could not run this migration or create
real test accounts. I re-ran the same static balance/import checks
used for the rest of Stage 3 on every file touched here.

## 4. Explicit reminder for Stage 8

When Stage 8 (Booking System) is built, it must add a `barber_addresses`
SELECT policy scoped to a confirmed booking relationship, exposing only
`work_*` columns to the specific client with a live booking — never
`home_*`. That policy does not exist yet, by design.

## 5. Why this design stays safe at multi-barber

`barber_client_links` is a per-pair, explicitly-granted table — not a
role check. A second barber account, even after being promoted to
`barber`, has zero access to any client's address until a link row
naming that specific barber-client pair is created. Nothing in this
migration grants access based on role membership alone.
