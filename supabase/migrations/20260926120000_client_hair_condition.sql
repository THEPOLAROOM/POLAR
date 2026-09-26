-- Workflow Mode: Hair Condition, a stored client-profile field distinct
-- from scalp_condition. Additive only. Lives on client_profile_details
-- beside the other hair fields, so it inherits that table's existing RLS
-- unchanged (the client reads/updates their own row; a linked barber
-- reads/creates/updates). No existing data is altered.
alter table public.client_profile_details
  add column if not exists hair_condition text;
