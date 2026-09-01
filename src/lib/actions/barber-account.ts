"use server";

import { requireRole } from "@/lib/auth/require-role";

type ActionResult = { error: string } | void;

function readRequiredText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalText(formData: FormData, key: string): string | null {
  const value = readRequiredText(formData, key);
  return value === "" ? null : value;
}

function readChecked(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

/**
 * Updates the calling barber's own profiles row (full_name, phone).
 * Relies entirely on the existing "profiles: update own" RLS policy
 * (auth.uid() = id) — this action adds no additional authorization.
 */
export async function updateBarberProfile(
  formData: FormData
): Promise<ActionResult> {
  const fullName = readRequiredText(formData, "full_name");
  const phone = readRequiredText(formData, "phone");

  if (!fullName || !phone) {
    return { error: "Name and phone are required." };
  }

  const { supabase, user } = await requireRole("barber");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }
}

/**
 * Updates the calling barber's own barber_professional_details row.
 * Relies entirely on the existing "barber_details: update own" RLS
 * policy (auth.uid() = profile_id).
 */
export async function updateBarberProfessionalDetails(
  formData: FormData
): Promise<ActionResult> {
  const barberName = readOptionalText(formData, "barber_name");
  const businessName = readOptionalText(formData, "business_name");
  const yearsExperienceRaw = readOptionalText(formData, "years_experience");
  const workLocation = readOptionalText(formData, "work_location");

  let yearsExperience: number | null = null;
  if (yearsExperienceRaw !== null) {
    const parsed = Number(yearsExperienceRaw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return { error: "Enter a valid number of years." };
    }
    yearsExperience = parsed;
  }

  const { supabase, user } = await requireRole("barber");

  const { error } = await supabase
    .from("barber_professional_details")
    .update({
      barber_name: barberName,
      business_name: businessName,
      years_experience: yearsExperience,
      work_location: workLocation,
    })
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }
}

/**
 * Updates the calling barber's own barber_addresses row. Mirrors the
 * same home/work-address validation already used at barber signup
 * (signUpBarber in auth.ts) — home address always required; work
 * address required in full unless explicitly marked same as home —
 * since the table's own CHECK constraint enforces exactly this and
 * would otherwise surface as a raw database error. Relies entirely on
 * the existing "barber_addresses: update own" RLS policy.
 */
export async function updateBarberAddresses(
  formData: FormData
): Promise<ActionResult> {
  const homeLine1 = readRequiredText(formData, "home_address_line_1");
  const homeLine2 = readOptionalText(formData, "home_address_line_2");
  const homeTown = readRequiredText(formData, "home_town_city");
  const homeCounty = readOptionalText(formData, "home_county_region");
  const homePostcode = readRequiredText(formData, "home_postcode");
  const homeCountry = readRequiredText(formData, "home_country");

  if (!homeLine1 || !homeTown || !homePostcode || !homeCountry) {
    return {
      error:
        "Home address line 1, town/city, postcode and country are required.",
    };
  }

  const workSameAsHome = readChecked(formData, "work_same_as_home");
  const workLine1 = readRequiredText(formData, "work_address_line_1");
  const workLine2 = readOptionalText(formData, "work_address_line_2");
  const workTown = readRequiredText(formData, "work_town_city");
  const workCounty = readOptionalText(formData, "work_county_region");
  const workPostcode = readRequiredText(formData, "work_postcode");
  const workCountry = readRequiredText(formData, "work_country");

  if (!workSameAsHome && (!workLine1 || !workTown || !workPostcode || !workCountry)) {
    return {
      error:
        'Fill in your work address, or tick "Same as my home address".',
    };
  }

  const { supabase, user } = await requireRole("barber");

  const { error } = await supabase
    .from("barber_addresses")
    .update({
      home_address_line_1: homeLine1,
      home_address_line_2: homeLine2,
      home_town_city: homeTown,
      home_county_region: homeCounty,
      home_postcode: homePostcode,
      home_country: homeCountry,
      work_same_as_home: workSameAsHome,
      work_address_line_1: workSameAsHome ? null : workLine1,
      work_address_line_2: workSameAsHome ? null : workLine2,
      work_town_city: workSameAsHome ? null : workTown,
      work_county_region: workSameAsHome ? null : workCounty,
      work_postcode: workSameAsHome ? null : workPostcode,
      work_country: workSameAsHome ? null : workCountry,
    })
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }
}
