"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { POLAR_BARBER_PROFILE_ID } from "@/lib/config";

const BOOK_PATH = "/dashboard/client/book";
const BOOKINGS_PATH = "/dashboard/client/bookings";

type ActionResult = { error: string } | void;

/**
 * Books a free slot for the calling client via create_or_reschedule_booking()
 * — the sole create path (SECURITY DEFINER, advisory-locked, four-case
 * conflict check, all enforced in the database). This action performs
 * no overlap/availability logic of its own; a rejection from the
 * function (e.g. "Slot already booked" if it was taken between page
 * load and submission) is passed straight through as a plain message.
 *
 * The client chooses a service and a start time only — the finish
 * time is always computed by the database from that service's
 * duration, never accepted from the client here.
 *
 * The barber is always POLAR_BARBER_PROFILE_ID, decided server-side —
 * never taken from the submitted form, so a client cannot direct a
 * booking at any other account.
 */
export async function bookSlot(formData: FormData): Promise<ActionResult> {
  const recurrence = String(formData.get("recurrence") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const serviceId = String(formData.get("service_id") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();

  if (!date || !serviceId || !startTime) {
    return { error: "Choose a service and a start time." };
  }
  if (recurrence !== "one_off" && recurrence !== "weekly") {
    return { error: "Choose a booking type." };
  }

  const { supabase } = await requireRole("client");

  const { error } = await supabase.rpc("create_or_reschedule_booking", {
    p_booking_id: null,
    p_barber_profile_id: POLAR_BARBER_PROFILE_ID,
    p_recurrence: recurrence,
    p_start_date: date,
    p_end_date: null, // weekly stays open-ended until cancelled — no end-date input in this minimal UI
    p_service_id: serviceId,
    p_start_time: startTime,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(BOOK_PATH);
}

/**
 * Cancels one of the calling client's own bookings via cancel_booking()
 * — a one-way confirmed -> cancelled transition; applies to the whole
 * row, so a weekly booking is cancelled as a whole series (there are
 * no per-occurrence rows to cancel individually).
 */
export async function cancelBooking(formData: FormData): Promise<ActionResult> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    return { error: "Missing booking." };
  }

  const { supabase } = await requireRole("client");

  const { data, error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
  });

  if (error) {
    return { error: error.message };
  }
  if (data !== true) {
    return { error: "Could not cancel that booking." };
  }

  revalidatePath(BOOKINGS_PATH);
}

/**
 * Reschedules one of the calling client's own confirmed bookings to a
 * new date/time via create_or_reschedule_booking() — the barber stays
 * POLAR_BARBER_PROFILE_ID, and the booking's own existing recurrence,
 * end_date (for weekly), and service are all read back from the
 * database and reused as-is rather than trusted from the submitted
 * form, so this can never change a booking's recurrence type, service,
 * or hand it to a different barber — only the date/time move. The
 * service is also re-verified/preserved inside the function itself
 * even if it's since been deactivated, so rescheduling never breaks
 * just because a service was made inactive. Applies to the whole row
 * — a weekly booking's entire series moves, there is no
 * per-occurrence exception.
 */
export async function rescheduleBooking(
  formData: FormData
): Promise<ActionResult> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();

  if (!bookingId || !date || !startTime) {
    return { error: "Missing reschedule details." };
  }

  const { supabase, user } = await requireRole("client");

  const { data: existing } = await supabase
    .from("bookings")
    .select("recurrence, end_date, service_id")
    .eq("id", bookingId)
    .eq("client_profile_id", user.id)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!existing) {
    return { error: "Booking not found or not active." };
  }

  const { error } = await supabase.rpc("create_or_reschedule_booking", {
    p_booking_id: bookingId,
    p_barber_profile_id: POLAR_BARBER_PROFILE_ID,
    p_recurrence: existing.recurrence,
    p_end_date: existing.recurrence === "weekly" ? existing.end_date : null,
    p_service_id: existing.service_id,
    p_start_date: date,
    p_start_time: startTime,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(BOOKINGS_PATH);
}
