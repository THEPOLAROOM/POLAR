import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Hit when the user clicks the email verification link. Exchanges the
 * confirmation code for a session and preserves it — verifying email
 * now lands the user directly in their authenticated dashboard,
 * role-aware, using the same has_role() check login() already uses.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: isBarber } = await supabase.rpc("has_role", {
        check_role: "barber",
      });
      return NextResponse.redirect(
        `${origin}${isBarber ? "/dashboard/barber" : "/dashboard/client"}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
