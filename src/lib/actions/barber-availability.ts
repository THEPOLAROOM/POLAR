"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

const AVAILABILITY_PATH = "/dashboard/barber/availability";
const EXCLUSION_VIOLATION = "23P01";

type ActionResult = { error: string } | void;

/**
 * Creates one barber_availability slot for the calling barber. The
 * live barber_availability_no_overlap exclusion constraint is the
 * actual enforcement (database-safe, not just this validation) — a
 * violation surfaces here as Postgres error code 23P01, which is
 * translated into a plain message for the UI.
 */
export async function createAvailabilitySlot(
  formData: FormData
): Promise<ActionResult> {
  const dayOfWeekRaw = String(formData.get("day_of_week") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const endTime = String(formData.get("end_time") ?? "").trim();

  const dayOfWeek = Number(dayOfWeekRaw);
  if (
    dayOfWeekRaw === "" ||
    !Number.isInteger(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6
  ) {
    return { error: "Choose a day." };
  }
  if (!startTime || !endTime) {
    return { error: "Start and end time are required." };
  }
  if (endTime <= startTime) {
    return { error: "End time must be after start time." };
  }

  const { supabase, user } = await requireRole("barber");

  const { error } = await supabase.from("barber_availability").insert({
    barber_profile_id: user.id,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
  });

  if (error) {
    if (error.code === EXCLUSION_VIOLATION) {
      return { error: "This overlaps an existing active slot on that day." };
    }
    return { error: "Could not add that slot." };
  }

  revalidatePath(AVAILABILITY_PATH);
}

/**
 * Activates or deactivates one of the calling barber's own slots.
 * Bound directly via a <form action={...}> prop (no client
 * component), so this returns void. Deactivating can never violate
 * the overlap constraint (it only applies to active slots); a
 * reactivation that would violate it is silently not applied — this
 * path has no client-side error display, unlike createAvailabilitySlot.
 */
export async function setAvailabilityActive(formData: FormData): Promise<void> {
  const slotId = String(formData.get("slot_id") ?? "").trim();
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!slotId) {
    return;
  }

  const { supabase } = await requireRole("barber");

  await supabase
    .from("barber_availability")
    .update({ is_active: isActive })
    .eq("id", slotId);

  revalidatePath(AVAILABILITY_PATH);
}
