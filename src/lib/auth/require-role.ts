import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PolarRole } from "@/lib/types";

/**
 * The authoritative, server-side gate for any page that requires a
 * signed-in user. Always re-checks the session against Supabase
 * itself (getUser(), not getSession()) rather than trusting any
 * client-reported state. Call this as the FIRST statement in a
 * protected Server Component — nothing barber/client-specific should
 * be computed or rendered before this check runs.
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return { supabase, user };
}

/**
 * The authoritative, server-side role gate. Calls Stage 2's has_role()
 * database function (RLS/security-definer enforced) rather than
 * trusting any role value passed around in the app layer. A user who
 * does not hold the required role is redirected before the page
 * renders anything — this is what actually stops direct-URL access,
 * not the login redirect, which is UX only.
 */
export async function requireRole(role: PolarRole) {
  const { supabase, user } = await requireAuth();

  const { data: hasRole, error } = await supabase.rpc("has_role", {
    check_role: role,
  });

  if (error || !hasRole) {
    redirect("/login");
  }

  return { supabase, user };
}
