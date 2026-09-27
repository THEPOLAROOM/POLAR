"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

const SCHEDULE_PATH = "/dashboard/barber/schedule";
const CALENDAR_PATH = "/dashboard/barber/calendar";
const DASHBOARD_HOME_PATH = "/dashboard/barber";

type ActionResult = { error: string } | void;

/**
 * Cancels one of the calling barber's own bookings via
 * cancel_booking_as_barber() — a one-way confirmed -> cancelled
 * transition, applying to the whole row (a weekly booking's entire
 * series). Does not touch cancel_booking(), the client-facing
 * function, in any way.
 *
 * Called from both /dashboard/barber/schedule (cancel-booking-button)
 * and the Calendar day-view modal (calendar-view.tsx) — all three
 * surfaces that read today's bookings must be revalidated, or the
 * cancelled booking keeps rendering as active wherever it wasn't.
 */
export async function cancelBookingAsBarber(
  formData: FormData
): Promise<ActionResult> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    return { error: "Missing booking." };
  }

  const { supabase } = await requireRole("barber");

  const { data, error } = await supabase.rpc("cancel_booking_as_barber", {
    p_booking_id: bookingId,
  });

  if (error) {
    return { error: error.message };
  }
  if (data !== true) {
    return { error: "Could not cancel that booking." };
  }

  revalidatePath(SCHEDULE_PATH);
  revalidatePath(CALENDAR_PATH);
  revalidatePath(DASHBOARD_HOME_PATH);
}

/**
 * Reschedules one of the calling barber's own confirmed bookings via
 * reschedule_booking_as_barber() — that function itself preserves the
 * existing client identity, recurrence type, AND service/duration (it
 * doesn't accept any of them as parameters and never writes to those
 * columns), so this action has nothing extra to enforce on that
 * front. The finish time is always computed by the database from the
 * booking's existing service, never accepted here — the function also
 * keeps using that service even if it's since been deactivated, so a
 * deactivated service never blocks rescheduling an appointment that
 * already used it. Applies to the whole row for weekly bookings, same
 * as cancel.
 */
export async function rescheduleBookingAsBarber(
  formData: FormData
): Promise<ActionResult> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();

  if (!bookingId || !date || !startTime) {
    return { error: "Missing reschedule details." };
  }

  const { supabase } = await requireRole("barber");

  const { error } = await supabase.rpc("reschedule_booking_as_barber", {
    p_booking_id: bookingId,
    p_start_date: date,
    p_start_time: startTime,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`${SCHEDULE_PATH}?date=${date}`);
}

/**
 * Calendar's in-place reschedule (Appointment Details → Reschedule).
 * Same reschedule_booking_as_barber() RPC as the old page — it alone
 * enforces ownership, service duration, availability fit, conflicts
 * and the per-barber lock — but returns a result instead of
 * redirecting to the old /schedule page, and refreshes every surface
 * that shows the moved booking.
 */
export async function rescheduleBookingInCalendar(
  formData: FormData
): Promise<ActionResult> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();

  if (!bookingId || !date || !startTime) {
    return { error: "Missing reschedule details." };
  }

  const { supabase } = await requireRole("barber");

  const { error } = await supabase.rpc("reschedule_booking_as_barber", {
    p_booking_id: bookingId,
    p_start_date: date,
    p_start_time: startTime,
  });

  if (error) {
    if (/end_date|check constraint/i.test(error.message)) {
      return { error: "That date is after this weekly booking's end date — pick an earlier date." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/barber/calendar");
  revalidatePath("/dashboard/barber");
}

/**
 * Marks a past, one-off, confirmed appointment as a No Show via the
 * existing mark_booking_no_show() RPC (which enforces all of those
 * rules and ownership). One-way: there is no undo pathway in V1.
 */
export async function markBookingNoShow(
  formData: FormData
): Promise<ActionResult> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    return { error: "Missing booking." };
  }

  const { supabase } = await requireRole("barber");

  const { data, error } = await supabase.rpc("mark_booking_no_show", {
    p_booking_id: bookingId,
  });

  if (error) {
    return { error: error.message };
  }
  if (data !== true) {
    return { error: "Could not mark that appointment as a No Show." };
  }

  revalidatePath("/dashboard/barber/calendar");
  revalidatePath("/dashboard/barber/calendar/analytics");
  revalidatePath("/dashboard/barber");
}
