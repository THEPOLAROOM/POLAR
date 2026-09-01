import { requireRole } from "@/lib/auth/require-role";
import { getBarberBookingsForDate } from "@/lib/queries/barber-schedule";
import { getShopToday } from "@/lib/dates";
import { ShiftView } from "./shift-view";

// Server-side ROLE check happens FIRST, same as every other protected
// barber page. Always today — this is the live active-shift view, not
// a schedule browser (that's /dashboard/barber/schedule). The
// yes/no/delay workflow itself is pure client-side state (see
// shift-view.tsx) — no new schema/RPC, nothing persisted.
export default async function BarberShiftPage() {
  const { supabase, user } = await requireRole("barber");

  const today = getShopToday();
  const bookings = await getBarberBookingsForDate(supabase, user.id, today);

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        Today&apos;s Shift
      </h1>
      <ShiftView bookings={bookings} />
    </main>
  );
}
