"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { POLAR_BARBER_PROFILE_ID } from "@/lib/config";

const BOOK_PATH = "/dashboard/client/book";

type ActionResult = { error: string } | void;

/**
 * Books a free slot for the calling client via create_or_reschedule_booking()
 * — the sole create path (SECURITY DEFINER, advisory-locked, four-case
 * conflict check, all enforced in the database). This action performs
 * no overlap/availability logic of its own; a rejection from the
 * function (e.g. "Slot already booked" if it was taken between page
 * load and submission) is passed straight through as a plain message.
 *
 * The barber is always POLAR_BARBER_PROFILE_ID, decided server-side —
 * never taken from the submitted form, so a client cannot direct a
 * booking at any other account.
 */
export async function bookSlot(formData: FormData): Promise<ActionResult> {
  const recurrence = String(formData.get("recurrence") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const endTime = String(formData.get("end_time") ?? "").trim();

  if (!date || !startTime || !endTime) {
    return { error: "Missing booking details." };
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
    p_start_time: startTime,
    p_end_time: endTime,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(BOOK_PATH);
}
