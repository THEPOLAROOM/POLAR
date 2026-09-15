"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

const CALENDAR_PATH = "/dashboard/barber/calendar";

type ActionResult = { error: string } | void;

/**
 * Books an appointment directly for one of the calling barber's own
 * already-linked clients, via create_booking_as_barber() — the
 * existing create_or_reschedule_booking() is client-initiated only
 * (requires role 'client', uses auth.uid() as the client), so it
 * can't serve a barber booking on a client's behalf.
 */
export async function createBookingAsBarber(formData: FormData): Promise<ActionResult> {
  const clientProfileId = String(formData.get("client_profile_id") ?? "").trim();
  const serviceId = String(formData.get("service_id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();

  if (!clientProfileId || !serviceId || !date || !startTime) {
    return { error: "Choose a client, service and start time." };
  }

  const { supabase } = await requireRole("barber");

  const { error } = await supabase.rpc("create_booking_as_barber", {
    p_client_profile_id: clientProfileId,
    p_service_id: serviceId,
    p_start_date: date,
    p_start_time: startTime,
  });

  if (error) return { error: error.message };

  revalidatePath(CALENDAR_PATH);
}

/**
 * Creates a barter booking — same shape as a walk-in (no client
 * profile required) via create_barter_booking(), flagged is_barter so
 * it's excluded from cash revenue wherever revenue is computed.
 */
export async function createBarterBooking(formData: FormData): Promise<ActionResult> {
  const serviceId = String(formData.get("service_id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const withLabel = String(formData.get("with_label") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!serviceId || !date || !startTime) {
    return { error: "Choose a service and start time." };
  }

  const { supabase } = await requireRole("barber");

  const { error } = await supabase.rpc("create_barter_booking", {
    p_service_id: serviceId,
    p_start_date: date,
    p_start_time: startTime,
    p_with_label: withLabel || null,
    p_notes: notes || null,
  });

  if (error) return { error: error.message };

  revalidatePath(CALENDAR_PATH);
}

/**
 * Blocks a time range (or a whole day, by passing 00:00-23:59) via
 * create_blocked_time(). Deliberately does not require the range to
 * be inside the barber's own availability template — blocking time
 * off must work regardless of whether it was ever "available".
 */
export async function createBlockedTime(formData: FormData): Promise<ActionResult> {
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const endTime = String(formData.get("end_time") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const isBreak = String(formData.get("is_break") ?? "") === "true";

  if (!date || !startTime || !endTime) {
    return { error: "Choose a start and end time." };
  }

  const { supabase } = await requireRole("barber");

  const { error } = await supabase.rpc("create_blocked_time", {
    p_start_date: date,
    p_start_time: startTime,
    p_end_time: endTime,
    p_label: label || null,
    p_is_break: isBreak,
  });

  if (error) return { error: error.message };

  revalidatePath(CALENDAR_PATH);
}
