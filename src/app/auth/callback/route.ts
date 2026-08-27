import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Hit when the user clicks the email verification link. Exchanges the
 * confirmation code for a session, then — per the approved Decision B
 * — always sends the user to /login rather than any dashboard. This
 * applies to both Client and Barber sign-ups: nobody lands directly
 * on a dashboard from email confirmation. The subsequent login is
 * what performs the role-aware redirect (and every dashboard
 * independently re-checks role server-side regardless).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    // Immediately sign out again: confirming email should not itself
    // leave the browser in an authenticated session. This keeps
    // "verify email" and "log in" as two distinct, explicit steps,
    // matching Decision B's intent that nothing is skipped straight
    // into a dashboard.
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(`${origin}/login`);
}
