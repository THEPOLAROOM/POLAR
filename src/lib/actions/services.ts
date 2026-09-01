"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

const SERVICES_PATH = "/dashboard/barber/services";

/**
 * Creates a service owned by the calling barber. Relies entirely on
 * RLS to scope it to their own account (services: barber manages own,
 * mirroring barber_availability's existing pattern exactly) — this
 * action adds no additional app-level authorization.
 *
 * NOTE: the `services` table does not exist live yet (proposed
 * migration awaiting approval). Until it's applied, this insert
 * resolves with an error that's simply not persisted, per the same
 * void-return / no-client-error-display pattern already used by
 * createCustomFieldDefinition — no crash, just no-op.
 */
export async function createService(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const durationRaw = String(formData.get("duration_minutes") ?? "").trim();
  const duration = Number(durationRaw);

  if (!name || !Number.isInteger(duration) || duration <= 0) {
    return;
  }

  const { supabase, user } = await requireRole("barber");

  await supabase.from("services").insert({
    barber_profile_id: user.id,
    name,
    duration_minutes: duration,
  });

  revalidatePath(SERVICES_PATH);
}

/**
 * Activates or deactivates one of the calling barber's own services.
 * See createService above re: the pending migration.
 */
export async function setServiceActive(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("service_id") ?? "").trim();
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!serviceId) {
    return;
  }

  const { supabase } = await requireRole("barber");

  await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", serviceId);

  revalidatePath(SERVICES_PATH);
}
