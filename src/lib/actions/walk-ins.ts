"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

const CALENDAR_PATH = "/dashboard/barber/calendar";

type ActionResult = { error: string } | void;

/**
 * Creates a quick walk-in block on the calling barber's own calendar,
 * via the proposed create_walk_in() RPC. A walk-in is explicitly NOT
 * a POLAR client — no auth account, no profile, no Client Profile
 * Card; just an entry on the barber's own bookings row with a null
 * client_profile_id and a free-text label. Uses the chosen service's
 * duration to compute the finish time automatically, same as the
 * proposed client/barber booking logic.
 *
 * NOTE: create_walk_in() does not exist live yet — this is a proposed
 * migration awaiting approval. Until applied, calling it returns a
 * plain Postgres "function does not exist" error, surfaced here as a
 * normal error message rather than a crash.
 */
export async function createWalkIn(formData: FormData): Promise<ActionResult> {
  const serviceId = String(formData.get("service_id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();

  if (!serviceId || !date || !startTime) {
    return { error: "Choose a service and start time." };
  }

  const { supabase } = await requireRole("barber");

  const { error } = await supabase.rpc("create_walk_in", {
    p_service_id: serviceId,
    p_start_date: date,
    p_start_time: startTime,
    p_label: label === "" ? null : label,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(CALENDAR_PATH);
}
