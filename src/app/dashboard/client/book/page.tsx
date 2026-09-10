import { requireRole } from "@/lib/auth/require-role";
import { POLAR_BARBER_PROFILE_ID } from "@/lib/config";
import { getShopToday } from "@/lib/dates";
import { BookAppointmentForm } from "./book-appointment-form";

export type ServiceOption = { id: string; name: string; durationMinutes: number };

// Server-side ROLE check happens FIRST, same as every other protected
// dashboard page. Solo-barber V1: the barber is always the fixed
// POLAR_BARBER_PROFILE_ID — no barber directory/search. Only two
// small, cheap queries happen here (active services, and which
// weekdays the barber has any availability configured for, used to
// colour the calendar) — everything date-specific (actual free/
// booked time slots) is fetched on demand from the client component
// via the getBookableSlots() server action as the client navigates
// the calendar, rather than re-rendering the whole page per date.
export default async function ClientBookingPage() {
  const { supabase } = await requireRole("client");

  const [{ data: activeServices }, { data: availabilityRows }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, duration_minutes")
      .eq("barber_profile_id", POLAR_BARBER_PROFILE_ID)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("barber_availability")
      .select("day_of_week")
      .eq("barber_profile_id", POLAR_BARBER_PROFILE_ID)
      .eq("is_active", true),
  ]);

  const services: ServiceOption[] = (activeServices ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.duration_minutes,
  }));

  const availableDaysOfWeek = [
    ...new Set(
      ((availabilityRows ?? []) as { day_of_week: number }[]).map(
        (row) => row.day_of_week
      )
    ),
  ];

  return (
    <BookAppointmentForm
      services={services}
      availableDaysOfWeek={availableDaysOfWeek}
      today={getShopToday()}
    />
  );
}
