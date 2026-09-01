import { requireRole } from "@/lib/auth/require-role";
import { PersonalDetailsForm } from "./personal-details-form";
import { ProfessionalDetailsForm } from "./professional-details-form";
import { AddressesForm } from "./addresses-form";

// Server-side ROLE check happens FIRST, same as every other protected
// barber page. Every read below is the barber's own row, via the
// existing "read own"/"update own" RLS policies already in place on
// profiles, barber_professional_details and barber_addresses since
// Stage 3 — no new schema, no new policies, nothing barber-account
// specific was invented here.
export default async function BarberAccountPage() {
  const { supabase, user } = await requireRole("barber");

  const [{ data: profile }, { data: professional }, { data: addresses }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("barber_professional_details")
        .select("barber_name, business_name, years_experience, work_location")
        .eq("profile_id", user.id)
        .maybeSingle(),
      supabase
        .from("barber_addresses")
        .select(
          "home_address_line_1, home_address_line_2, home_town_city, home_county_region, home_postcode, home_country, work_same_as_home, work_address_line_1, work_address_line_2, work_town_city, work_county_region, work_postcode, work_country"
        )
        .eq("profile_id", user.id)
        .maybeSingle(),
    ]);

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        My Profile / Account
      </h1>
      <p className="mt-1 text-sm text-polar-muted">
        Signed in as {user.email}.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">
          Personal details
        </h2>
        <PersonalDetailsForm
          fullName={profile?.full_name ?? ""}
          phone={profile?.phone ?? ""}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">
          Professional details
        </h2>
        <ProfessionalDetailsForm
          barberName={professional?.barber_name ?? null}
          businessName={professional?.business_name ?? null}
          yearsExperience={professional?.years_experience ?? null}
          workLocation={professional?.work_location ?? null}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">Addresses</h2>
        <AddressesForm addresses={addresses ?? null} />
      </section>
    </main>
  );
}
