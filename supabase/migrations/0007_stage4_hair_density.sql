-- ============================================================
-- POLAR V1 — Stage 4: Client Details hair_density
-- ============================================================
-- Purpose: adds a second simple dropdown field (Low / Normal / High)
-- alongside the existing hair_type field, per the approved decision
-- to keep V1 Client Details fast, simple dropdown choices rather than
-- deeper hair-analysis concepts (deferred to a future stage).
--
-- Nullable, no default, no CHECK constraint — kept unconstrained at
-- the database level like every other client_profile_details column,
-- matching hair_type. The four/three allowed dropdown values for
-- hair_type and hair_density are enforced in the UI only for V1.
--
-- No RLS change: the existing linked-barber create/read/update
-- policies on client_profile_details are row-level, not column-
-- scoped, so they already cover this new column.
-- ============================================================

alter table public.client_profile_details
  add column hair_density text;
