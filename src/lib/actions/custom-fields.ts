"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import type { CustomFieldType } from "@/lib/types";

const CUSTOM_FIELD_TYPES: CustomFieldType[] = [
  "text",
  "number",
  "boolean",
  "single_select",
  "multi_select",
  "date",
];

const CUSTOM_FIELDS_PATH = "/dashboard/barber/custom-fields";

/**
 * Creates a custom field definition owned by the calling barber.
 * Relies entirely on the existing RLS policy (custom_field_definitions:
 * barber creates own, which checks barber_profile_id = auth.uid()) —
 * this action adds no additional app-level authorization on top of
 * setting that column to the barber's own id.
 *
 * Bound directly via a <form action={...}> prop (no client component),
 * so this must return void — invalid input or a failed insert is
 * simply not persisted rather than surfaced as an error message, per
 * this page's intentionally minimal scope. The <select> already only
 * offers valid field types, and label is browser-required.
 */
export async function createCustomFieldDefinition(
  formData: FormData
): Promise<void> {
  const label = String(formData.get("label") ?? "").trim();
  const fieldType = String(formData.get("field_type") ?? "");

  if (!label || !CUSTOM_FIELD_TYPES.includes(fieldType as CustomFieldType)) {
    return;
  }

  const { supabase, user } = await requireRole("barber");

  await supabase.from("custom_field_definitions").insert({
    barber_profile_id: user.id,
    label,
    field_type: fieldType,
  });

  revalidatePath(CUSTOM_FIELDS_PATH);
}

/**
 * Activates or deactivates one of the calling barber's own custom
 * field definitions. Relies entirely on the existing RLS policy
 * (custom_field_definitions: barber updates own) to enforce that the
 * field actually belongs to this barber. See createCustomFieldDefinition
 * above for why this returns void.
 */
export async function setCustomFieldActive(formData: FormData): Promise<void> {
  const fieldId = String(formData.get("field_id") ?? "").trim();
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!fieldId) {
    return;
  }

  const { supabase } = await requireRole("barber");

  await supabase
    .from("custom_field_definitions")
    .update({ is_active: isActive })
    .eq("id", fieldId);

  revalidatePath(CUSTOM_FIELDS_PATH);
}
