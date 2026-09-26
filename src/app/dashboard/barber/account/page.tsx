import { requireRole } from "@/lib/auth/require-role";
import { ProfileView } from "./profile-view";

// My Profile hub. Server-side ROLE check happens FIRST, same as every
// other protected barber page — reaching this page at all means the
// account holds the barber role, which is what the header's "official
// POLAR Barber" verification mark represents. Only real stored data is
// shown: the account's full name and the professional work location.
export default async function BarberAccountPage() {
  const { supabase, user } = await requireRole("barber");

  const [{ data: profile }, { data: professional }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("barber_professional_details").select("work_location").eq("profile_id", user.id).maybeSingle(),
  ]);

  return (
    <ProfileView
      name={(profile?.full_name as string | null) ?? null}
      location={(professional?.work_location as string | null) ?? null}
      email={user.email ?? ""}
    />
  );
}
