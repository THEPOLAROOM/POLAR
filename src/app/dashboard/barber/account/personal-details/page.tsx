import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { PersonalDetailsForm } from "../personal-details-form";
import { AddressesForm } from "../addresses-form";

// Split out of the old single-page /dashboard/barber/account so the
// new My Profile hub (page.tsx one level up) can link to it as its
// "Personal Details" card, per the mastered My Profile design. The
// forms themselves are unchanged — same components, same fields, same
// updateBarberProfile()/updateBarberAddresses() actions.
export default async function BarberPersonalDetailsPage() {
  const { supabase, user } = await requireRole("barber");

  const [{ data: profile }, { data: addresses }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
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
      <Link href="/dashboard/barber/account" className="text-sm text-polar-text underline">
        ← Back to My Profile
      </Link>

      <h1 className="mt-4 text-xl font-semibold text-polar-text">Personal Details</h1>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">Personal details</h2>
        <PersonalDetailsForm
          fullName={profile?.full_name ?? ""}
          phone={profile?.phone ?? ""}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">Addresses</h2>
        <AddressesForm addresses={addresses ?? null} />
      </section>
    </main>
  );
}
