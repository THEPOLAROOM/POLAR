"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

const SCHEDULE_PATH = "/dashboard/barber/schedule";

type ActionResult = { error: string } | void;

/**
 * Cancels one of the calling barber's own bookings via
 * cancel_booking_as_barber() — a one-way confirmed -> cancelled
 * transition, applying to the whole row (a weekly booking's entire
 * series). Does not touch cancel_booking(), the client-facing
 * function, in any way.
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
}

/**
 * Reschedules one of the calling barber's own confirmed bookings via
 * reschedule_booking_as_barber() — that function itself preserves the
 * existing client identity and recurrence type (it doesn't accept
 * them as parameters and never writes to those columns), so this
 * action has nothing extra to enforce on that front. Applies to the
 * whole row for weekly bookings, same as cancel.
 */
export async function rescheduleBookingAsBarber(
  formData: FormData
): Promise<ActionResult> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const endTime = String(formData.get("end_time") ?? "").trim();

  if (!bookingId || !date || !startTime || !endTime) {
    return { error: "Missing reschedule details." };
  }

  const { supabase } = await requireRole("barber");

  const { error } = await supabase.rpc("reschedule_booking_as_barber", {
    p_booking_id: bookingId,
    p_start_date: date,
    p_start_time: startTime,
    p_end_time: endTime,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`${SCHEDULE_PATH}?date=${date}`);
}
