// These strings MUST exactly match the values seeded into
// public.legal_documents in supabase/migrations/0003_stage3_accounts.sql.
// The signup server actions send these as the user's "claim" of what
// version they read and accepted; the database trigger independently
// re-checks the claim against legal_documents.current_version and
// REJECTS the signup if they don't match — so a stale value here fails
// safely (signup blocked with an error) rather than silently accepting
// an out-of-date acceptance.
//
// If you publish a new Terms/Privacy/Age-declaration version: update
// BOTH this file and a new migration that updates
// legal_documents.current_version. They are two separate places by
// design (app display vs. database source of truth) — see
// STAGE3_TESTING.md for the exact procedure.
export const LEGAL_VERSIONS = {
  terms: "v1-trial-draft-2026-08-26",
  privacy: "v1-trial-draft-2026-08-26",
  age_declaration: "v1-2026-08-26",
} as const;
