import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

// Public/authenticated separation: this page must never render
// authenticated barber/client content. An already-signed-in visitor
// is redirected to their dashboard server-side (same has_role() check
// login() already uses) before any markup below is produced; a
// signed-out visitor sees the public Landing Page + carousel.
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: isBarber } = await supabase.rpc("has_role", {
      check_role: "barber",
    });
    redirect(isBarber ? "/dashboard/barber" : "/dashboard/client");
  }

  return <LandingPage />;
}
