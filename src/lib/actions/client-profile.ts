"use server";

import { requireRole } from "@/lib/auth/require-role";

type ActionResult = { error: string } | void;

function readOptionalText(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

/**
 * Creates or updates the calling barber's client_profile_details row
 * for one linked client. Relies entirely on the existing RLS policies
 * (client_profile_details: linked barber creates / linked barber
 * updates) to enforce that the barber is actually linked to this
 * client via barber_client_links — this action adds no additional
 * app-level authorization check on top of that.
 */
export async function updateClientProfileDetails(
  formData: FormData
): Promise<ActionResult> {
  const clientId = String(formData.get("client_id") ?? "").trim();
  if (!clientId) {
    return { error: "Missing client." };
  }

  const { supabase } = await requireRole("barber");

  const { error } = await supabase.from("client_profile_details").upsert({
    profile_id: clientId,
    hair_type: readOptionalText(formData, "hair_type"),
    hair_colour: readOptionalText(formData, "hair_colour"),
    scalp_condition: readOptionalText(formData, "scalp_condition"),
    skin_sensitivity: readOptionalText(formData, "skin_sensitivity"),
    allergies: readOptionalText(formData, "allergies"),
    emergency_contact: readOptionalText(formData, "emergency_contact"),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  // No revalidatePath: this route already reads cookies/auth on every
  // request (fully dynamic), and calling it here raced the client's
  // own post-save "Saved" state with an automatic router refresh,
  // clobbering it before it could render.
}
