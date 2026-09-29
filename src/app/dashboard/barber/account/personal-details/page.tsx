import { requireRole } from "@/lib/auth/require-role";
import { PersonalDetailsView } from "./personal-details-view";

// Mastered visual rebuild (same design family as Professional
// Profile/CV and Smart Analytics) of the old plain-page Personal
// Details. Data fetching and the underlying save pathways are
// unchanged — same two queries, same updateBarberProfile()/
// updateBarberAddresses() actions, now presented through one view
// with a single Save Changes control. The old PersonalDetailsForm/
// AddressesForm components are no longer used by this page but have
// been left in place, not deleted, pending approval.
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

  return <PersonalDetailsView name={profile?.full_name ?? ""} phone={profile?.phone ?? ""} addresses={addresses ?? null} />;
}
