"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LEGAL_VERSIONS } from "@/lib/legal/versions";

const MIN_PASSWORD_LENGTH = 12; // Decision D — V1 minimum, mirrors client-side check

type ActionResult = { error: string } | void;

function readRequiredText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function readChecked(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

/**
 * Client sign-up. Only Section 02/03 shared Personal Details fields
 * plus the required legal declarations are collected — no fields are
 * invented. The actual account-creation fields (full_name, phone, and
 * the version claims) are sent as Supabase Auth signup metadata; the
 * database trigger in 0003_stage3_accounts.sql independently verifies
 * every version claim before creating any row, and this function never
 * writes to profiles/terms_acceptances/user_roles directly.
 */
export async function signUpClient(formData: FormData): Promise<ActionResult> {
  const fullName = readRequiredText(formData, "full_name");
  const phone = readRequiredText(formData, "phone");
  const email = readRequiredText(formData, "email");
  const password = String(formData.get("password") ?? "");
  const termsAccepted = readChecked(formData, "terms_accepted");
  const privacyAccepted = readChecked(formData, "privacy_accepted");
  const ageConfirmed = readChecked(formData, "age_confirmed");

  const addressLine1 = readRequiredText(formData, "address_line_1");
  const addressLine2 = readRequiredText(formData, "address_line_2");
  const townCity = readRequiredText(formData, "town_city");
  const countyRegion = readRequiredText(formData, "county_region");
  const postcode = readRequiredText(formData, "postcode");
  const country = readRequiredText(formData, "country");

  if (!fullName || !phone || !email || !password) {
    return { error: "Please fill in every field." };
  }
  if (!addressLine1 || !townCity || !postcode || !country) {
    return { error: "Please fill in your address (Address Line 2 and County/Region are optional)." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (!termsAccepted || !privacyAccepted) {
    return { error: "You must accept the Terms and the Privacy Policy to continue." };
  }
  if (!ageConfirmed) {
    return { error: "You must confirm you are aged 16 or over to continue." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        full_name: fullName,
        phone,
        role_intent: "client", // display/UX only — grants no privilege
        terms_version: LEGAL_VERSIONS.terms,
        privacy_version: LEGAL_VERSIONS.privacy,
        age_declaration_version: LEGAL_VERSIONS.age_declaration,
        // Explicit affirmative claims, sent only because the checks
        // above already confirmed each checkbox was actually ticked.
        // The database trigger re-requires these as literal "true"
        // in addition to the version claims above.
        terms_accepted: "true",
        privacy_accepted: "true",
        age_16_confirmed: "true",
        // Private client address — validated again, server-side, by
        // the database trigger before any account is created.
        client_address_line_1: addressLine1,
        client_address_line_2: addressLine2 || undefined,
        client_town_city: townCity,
        client_county_region: countyRegion || undefined,
        client_postcode: postcode,
        client_country: country,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/verify-email");
}

/**
 * Barber sign-up. Collects the same Personal Details as client
 * sign-up plus the four Section 02 Professional Details fields.
 * Per the approved architecture: this NEVER grants the barber role.
 * The account is created as a plain client (Stage 2's untouched
 * trigger still fires) with professional details attached; Barber
 * privilege is only ever granted manually via the Stage 2 elevated
 * mechanism.
 */
export async function signUpBarber(formData: FormData): Promise<ActionResult> {
  const fullName = readRequiredText(formData, "full_name");
  const phone = readRequiredText(formData, "phone");
  const email = readRequiredText(formData, "email");
  const password = String(formData.get("password") ?? "");
  const barberName = readRequiredText(formData, "barber_name");
  const businessName = readRequiredText(formData, "business_name");
  const yearsExperience = readRequiredText(formData, "years_experience");
  const workLocation = readRequiredText(formData, "work_location");
  const termsAccepted = readChecked(formData, "terms_accepted");
  const privacyAccepted = readChecked(formData, "privacy_accepted");
  const ageConfirmed = readChecked(formData, "age_confirmed");

  const homeLine1 = readRequiredText(formData, "home_address_line_1");
  const homeLine2 = readRequiredText(formData, "home_address_line_2");
  const homeTown = readRequiredText(formData, "home_town_city");
  const homeCounty = readRequiredText(formData, "home_county_region");
  const homePostcode = readRequiredText(formData, "home_postcode");
  const homeCountry = readRequiredText(formData, "home_country");

  const workSameAsHome = readChecked(formData, "work_same_as_home");
  const workLine1 = readRequiredText(formData, "work_address_line_1");
  const workLine2 = readRequiredText(formData, "work_address_line_2");
  const workTown = readRequiredText(formData, "work_town_city");
  const workCounty = readRequiredText(formData, "work_county_region");
  const workPostcode = readRequiredText(formData, "work_postcode");
  const workCountry = readRequiredText(formData, "work_country");

  if (!fullName || !phone || !email || !password) {
    return { error: "Please fill in every personal detail field." };
  }
  if (!homeLine1 || !homeTown || !homePostcode || !homeCountry) {
    return { error: "Please fill in your Personal/Home Address (Address Line 2 and County/Region are optional)." };
  }
  if (!workSameAsHome && (!workLine1 || !workTown || !workPostcode || !workCountry)) {
    return {
      error:
        "Please fill in your Work/Commercial Address, or tick \"Same as my Home Address\".",
    };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (!termsAccepted || !privacyAccepted) {
    return { error: "You must accept the Terms and the Privacy Policy to continue." };
  }
  if (!ageConfirmed) {
    return { error: "You must confirm you are aged 16 or over to continue." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        full_name: fullName,
        phone,
        role_intent: "barber", // display/UX only — grants no privilege
        barber_name: barberName || undefined,
        business_name: businessName || undefined,
        years_experience: yearsExperience || undefined,
        work_location: workLocation || undefined,
        terms_version: LEGAL_VERSIONS.terms,
        privacy_version: LEGAL_VERSIONS.privacy,
        age_declaration_version: LEGAL_VERSIONS.age_declaration,
        // Explicit affirmative claims — see signUpClient for rationale.
        terms_accepted: "true",
        privacy_accepted: "true",
        age_16_confirmed: "true",
        // Personal/Home Address — always private; validated again
        // server-side by the database trigger.
        barber_home_address_line_1: homeLine1,
        barber_home_address_line_2: homeLine2 || undefined,
        barber_home_town_city: homeTown,
        barber_home_county_region: homeCounty || undefined,
        barber_home_postcode: homePostcode,
        barber_home_country: homeCountry,
        // Work/Commercial Address — private for V1 (client-facing
        // exposure is added in Stage 8 once bookings exist).
        barber_work_same_as_home: workSameAsHome ? "true" : "false",
        barber_work_address_line_1: workSameAsHome ? undefined : workLine1,
        barber_work_address_line_2: workSameAsHome ? undefined : workLine2 || undefined,
        barber_work_town_city: workSameAsHome ? undefined : workTown,
        barber_work_county_region: workSameAsHome ? undefined : workCounty || undefined,
        barber_work_postcode: workSameAsHome ? undefined : workPostcode,
        barber_work_country: workSameAsHome ? undefined : workCountry,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/verify-email");
}

/**
 * Login. Role-aware redirect here is UX convenience only — the actual
 * enforcement is requireRole()/requireAuth() running server-side on
 * every protected page itself, regardless of how the user arrived.
 */
export async function login(formData: FormData): Promise<ActionResult> {
  const email = readRequiredText(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Login failed. Please try again." };
  }

  const { data: isBarber } = await supabase.rpc("has_role", {
    check_role: "barber",
  });

  redirect(isBarber ? "/dashboard/barber" : "/dashboard/client");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resendVerification(formData: FormData): Promise<ActionResult> {
  const email = readRequiredText(formData, "email");
  if (!email) {
    return { error: "Enter the email address you signed up with." };
  }

  const supabase = await createClient();
  // Errors are intentionally not surfaced in detail here (e.g. "no such
  // account") to avoid confirming which emails have POLAR accounts.
  await supabase.auth.resend({
  type: "signup",
  email,
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  },
});
}
