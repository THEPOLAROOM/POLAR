import type { createClient } from "@/lib/supabase/server";
import { getBarberBookingsForDate, type ScheduledBooking } from "@/lib/queries/barber-schedule";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type WorkflowClient = {
  id: string;
  name: string;
  phone: string | null;
  hairType: string | null;
  hairColour: string | null;
  scalpCondition: string | null;
  skinSensitivity: string | null;
  allergies: string | null;
  emergencyContact: string | null;
  clientSince: string | null;
  totalVisits: number;
};

export type WorkflowBooking = ScheduledBooking & { client: WorkflowClient };

/**
 * Today's bookings (same source/ordering as getBarberBookingsForDate,
 * used elsewhere for the dashboard home and the old Shift view) with
 * each occurrence's client enriched with the profile fields the
 * Workflow screen's Client Profile card needs. There is no "email"
 * column available to a barber anywhere in the schema (it lives only
 * in auth.users) and no "key notes" column exists either — both are
 * intentionally left absent here rather than backed by invented data;
 * the view renders its own empty-state for whatever isn't returned.
 *
 * "Client since" is barber_client_links.created_at (when this specific
 * barber/client relationship began) and "total visits" is a count of
 * this client's confirmed bookings with this barber — a real, derived
 * number, not a stored column (none exists). This counts booking ROWS,
 * not expanded weekly occurrences, so a long-running weekly client's
 * true visit count is undercounted; expanding recurrence into a real
 * occurrence count is a bigger feature than this screen needs today.
 */
export async function getWorkflowBookingsForDate(
  supabase: SupabaseClient,
  barberProfileId: string,
  date: string
): Promise<WorkflowBooking[]> {
  const bookings = await getBarberBookingsForDate(supabase, barberProfileId, date);
  const clientIds = [...new Set(bookings.map((b) => b.clientProfileId))];

  if (clientIds.length === 0) {
    return [];
  }

  const [{ data: profiles }, { data: details }, { data: links }, { data: visitRows }] = await Promise.all([
    supabase.from("profiles").select("id, phone").in("id", clientIds),
    supabase
      .from("client_profile_details")
      .select("profile_id, hair_type, hair_colour, scalp_condition, skin_sensitivity, allergies, emergency_contact")
      .in("profile_id", clientIds),
    supabase
      .from("barber_client_links")
      .select("client_profile_id, created_at")
      .eq("barber_profile_id", barberProfileId)
      .in("client_profile_id", clientIds),
    supabase
      .from("bookings")
      .select("client_profile_id")
      .eq("barber_profile_id", barberProfileId)
      .eq("status", "confirmed")
      .in("client_profile_id", clientIds),
  ]);

  const phoneById = new Map(((profiles ?? []) as { id: string; phone: string | null }[]).map((p) => [p.id, p.phone]));
  const detailsById = new Map(
    (
      (details ?? []) as {
        profile_id: string;
        hair_type: string | null;
        hair_colour: string | null;
        scalp_condition: string | null;
        skin_sensitivity: string | null;
        allergies: string | null;
        emergency_contact: string | null;
      }[]
    ).map((d) => [d.profile_id, d])
  );
  const sinceById = new Map(
    ((links ?? []) as { client_profile_id: string; created_at: string }[]).map((l) => [l.client_profile_id, l.created_at])
  );
  const visitCountById = new Map<string, number>();
  for (const row of (visitRows ?? []) as { client_profile_id: string }[]) {
    visitCountById.set(row.client_profile_id, (visitCountById.get(row.client_profile_id) ?? 0) + 1);
  }

  return bookings.map((booking) => {
    const d = detailsById.get(booking.clientProfileId);
    const client: WorkflowClient = {
      id: booking.clientProfileId,
      name: booking.clientName,
      phone: phoneById.get(booking.clientProfileId) ?? null,
      hairType: d?.hair_type ?? null,
      hairColour: d?.hair_colour ?? null,
      scalpCondition: d?.scalp_condition ?? null,
      skinSensitivity: d?.skin_sensitivity ?? null,
      allergies: d?.allergies ?? null,
      emergencyContact: d?.emergency_contact ?? null,
      clientSince: sinceById.get(booking.clientProfileId) ?? null,
      totalVisits: visitCountById.get(booking.clientProfileId) ?? 0,
    };
    return { ...booking, client };
  });
}
