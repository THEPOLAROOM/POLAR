import { requireRole } from "@/lib/auth/require-role";
import { getWorkflowBookingsForDate } from "@/lib/queries/barber-workflow";
import { getShopToday, getShopTimeNow } from "@/lib/dates";
import { WorkflowView } from "./workflow-view";

// Server-side ROLE check happens FIRST, same as every other protected
// barber page. Always today — this is the live active-shift view, not
// a schedule browser (that's /dashboard/barber/schedule). Route stays
// at /dashboard/barber/shift (the dashboard home's "Workflow Mode"
// card already links here) even though the feature is now presented
// as "Workflow" — renaming the URL would break that existing link for
// no functional benefit.
export default async function BarberShiftPage() {
  const { supabase, user } = await requireRole("barber");

  const today = getShopToday();
  const now = getShopTimeNow();
  const bookings = await getWorkflowBookingsForDate(supabase, user.id, today);

  // Default to the first booking that hasn't finished yet, so the
  // Countdown Timer starts pointed at something real instead of
  // always the day's first (possibly already-finished) appointment.
  // Falls back to the last booking if every appointment today is
  // already over, and to 0 (unused — WorkflowView renders its own
  // empty state) when there are none at all.
  const firstUnfinished = bookings.findIndex((b) => b.endTime > now);
  const initialIndex = bookings.length === 0 ? 0 : firstUnfinished === -1 ? bookings.length - 1 : firstUnfinished;

  return <WorkflowView bookings={bookings} initialIndex={initialIndex} />;
}
