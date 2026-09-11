import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { ProfessionalDetailsForm } from "../professional-details-form";

// Split out of the old single-page /dashboard/barber/account so the
// new My Profile hub (page.tsx one level up) can link to it as its
// "Professional Profile & CV" card. The form itself is unchanged —
// same component, same fields, same updateBarberProfessionalDetails()
// action.
export default async function BarberProfessionalProfilePage() {
  const { supabase, user } = await requireRole("barber");

  const { data: professional } = await supabase
    .from("barber_professional_details")
    .select("barber_name, business_name, years_experience, work_location")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <Link href="/dashboard/barber/account" className="text-sm text-polar-text underline">
        ← Back to My Profile
      </Link>

      <h1 className="mt-4 text-xl font-semibold text-polar-text">Professional Profile &amp; CV</h1>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">Professional details</h2>
        <ProfessionalDetailsForm
          barberName={professional?.barber_name ?? null}
          businessName={professional?.business_name ?? null}
          yearsExperience={professional?.years_experience ?? null}
          workLocation={professional?.work_location ?? null}
        />
      </section>
    </main>
  );
}
