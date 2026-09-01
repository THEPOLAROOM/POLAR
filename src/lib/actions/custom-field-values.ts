"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import type { CustomFieldType } from "@/lib/types";

function parseValue(
  fieldType: CustomFieldType,
  formData: FormData,
  key: string
): unknown {
  if (fieldType === "multi_select") {
    const values = formData.getAll(key).map((v) => String(v));
    return values.length > 0 ? values : null;
  }

  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") {
    return null;
  }

  if (fieldType === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  if (fieldType === "boolean") {
    return raw === "true" ? true : raw === "false" ? false : null;
  }

  // text, date, single_select all store the raw string as-is.
  return raw;
}

/**
 * Creates or updates this barber's client_custom_field_values rows for
 * one linked client — one upsert per currently active custom field
 * definition the barber owns. Relies entirely on the existing RLS
 * policies (custom_field_values: owning barber writes / owning barber
 * updates, which check both field ownership and the client link via
 * barber_client_links) — this action adds no additional app-level
 * authorization beyond requireRole and scoping the definitions query
 * to the calling barber's own id.
 *
 * Bound directly via a <form action={...}> prop (no client component),
 * so this returns void, matching custom-fields.ts's actions.
 */
export async function updateClientCustomFieldValues(
  formData: FormData
): Promise<void> {
  const clientId = String(formData.get("client_id") ?? "").trim();
  if (!clientId) {
    return;
  }

  const { supabase, user } = await requireRole("barber");

  const { data: definitions } = await supabase
    .from("custom_field_definitions")
    .select("id, field_type")
    .eq("barber_profile_id", user.id)
    .eq("is_active", true);

  if (!definitions || definitions.length === 0) {
    return;
  }

  const rows = definitions.map((definition) => ({
    field_id: definition.id,
    client_profile_id: clientId,
    value: parseValue(
      definition.field_type as CustomFieldType,
      formData,
      `field_${definition.id}`
    ),
    updated_at: new Date().toISOString(),
  }));

  await supabase
    .from("custom_field_values")
    .upsert(rows, { onConflict: "field_id,client_profile_id" });

  revalidatePath(`/dashboard/barber/clients/${clientId}`);
}
