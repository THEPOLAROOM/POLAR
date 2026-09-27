import { requireRole } from "@/lib/auth/require-role";
import { CvView } from "./cv-view";

// Professional Profile / POLAR CV — the barber's own CV editor, linked
// from My Profile's "Professional" card. The four professional values
// stay in barber_professional_details (same row, same columns); the CV
// sections live in the barber-only barber_work_experience /
// barber_qualifications / barber_achievements tables.
export default async function BarberProfessionalProfilePage() {
  const { supabase, user } = await requireRole("barber");

  const [{ data: professional }, { data: work }, { data: qualifications }, { data: achievements }] = await Promise.all([
    supabase
      .from("barber_professional_details")
      .select("barber_name, business_name, years_experience, work_location, additional_info")
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase
      .from("barber_work_experience")
      .select("id, workplace, position, from_year, to_year")
      .eq("barber_profile_id", user.id)
      .order("display_order"),
    supabase
      .from("barber_qualifications")
      .select("id, name, provider, year")
      .eq("barber_profile_id", user.id)
      .order("display_order"),
    supabase
      .from("barber_achievements")
      .select("id, name, result, year")
      .eq("barber_profile_id", user.id)
      .order("display_order"),
  ]);

  return (
    <CvView
      initial={{
        barberName: professional?.barber_name ?? "",
        businessName: professional?.business_name ?? "",
        yearsExperience: professional?.years_experience ?? null,
        workLocation: professional?.work_location ?? "",
        additionalInfo: professional?.additional_info ?? "",
        work: (work ?? []).map((w) => ({
          id: w.id,
          workplace: w.workplace ?? "",
          position: w.position ?? "",
          fromYear: w.from_year,
          toYear: w.to_year,
        })),
        qualifications: (qualifications ?? []).map((q) => ({ id: q.id, name: q.name ?? "", provider: q.provider ?? "", year: q.year })),
        achievements: (achievements ?? []).map((a) => ({ id: a.id, name: a.name ?? "", result: a.result ?? "", year: a.year })),
      }}
    />
  );
}
