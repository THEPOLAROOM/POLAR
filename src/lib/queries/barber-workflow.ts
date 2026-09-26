import type { createClient } from "@/lib/supabase/server";
import { getDayBookings } from "@/lib/queries/barber-calendar";
import { countVisits, type VisitRow } from "@/lib/calendar/visits";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const PHOTO_BUCKET = "client-photos";
// Signed photo links only need to outlive a working shift on screen.
const PHOTO_URL_TTL_SECONDS = 60 * 60 * 12;

export type WorkflowInsight = { label: string; value: string | null };

export type WorkflowClient = {
  id: string;
  name: string;
  polarId: string | null;
  /** Short-lived signed URL to the barber's private client photo, or null. */
  photoUrl: string | null;
  clientSince: string | null;
  totalVisits: number;
  hairType: string | null;
  hairTexture: string | null;
  hairDensity: string | null;
  hairColour: string | null;
  scalpCondition: string | null;
  skinSensitivity: string | null;
  allergies: string | null;
  emergencyContact: string | null;
  /** This barber's private Key Notes for the client. */
  keyNotes: string | null;
  /** This barber's private Barber Insight answers (active questions, in order). */
  insights: WorkflowInsight[];
};

export type WorkflowBooking = {
  id: string;
  startTime: string;
  endTime: string;
  serviceName: string | null;
  isBarter: boolean;
  client: WorkflowClient;
};

/**
 * Today's client appointments for Workflow, in start-time order, with
 * each client's working profile. Uses the Calendar's getDayBookings (same
 * Europe/London date, recurrence/interval expansion and confirmed-only
 * rules) and keeps only real client appointments — blocked time, breaks
 * and walk-ins without a client are excluded.
 *
 * Everything returned is real stored data or derived from it; anything
 * not set comes back null and the view shows its own empty state.
 * Key Notes, the photo and Barber Insights are this barber's private
 * records (barber-only RLS); none of it is readable by clients.
 */
export async function getWorkflowBookingsForDate(
  supabase: SupabaseClient,
  barberProfileId: string,
  date: string,
  nowTime: string
): Promise<WorkflowBooking[]> {
  const dayBookings = await getDayBookings(supabase, barberProfileId, date);
  const bookings = dayBookings.filter(
    (b): b is typeof b & { clientProfileId: string } => Boolean(b.clientProfileId) && !b.isBlocked && !b.isBreak
  );
  const clientIds = [...new Set(bookings.map((b) => b.clientProfileId))];
  if (clientIds.length === 0) return [];

  const [
    { data: profiles },
    { data: details },
    { data: links },
    { data: visitRows },
    { data: records },
    { data: insightFields },
    { data: insightValues },
  ] = await Promise.all([
    supabase.from("profiles").select("id, polar_id").in("id", clientIds),
    supabase
      .from("client_profile_details")
      .select("profile_id, hair_type, hair_texture, hair_density, hair_colour, scalp_condition, skin_sensitivity, allergies, emergency_contact")
      .in("profile_id", clientIds),
    supabase
      .from("barber_client_links")
      .select("client_profile_id, created_at")
      .eq("barber_profile_id", barberProfileId)
      .in("client_profile_id", clientIds),
    // Total Visits: this barber's confirmed client appointments (not
    // blocked time/breaks), expanded into occurrences by countVisits.
    supabase
      .from("bookings")
      .select("client_profile_id, recurrence, start_date, end_date, recurrence_interval_weeks, end_time, no_show")
      .eq("barber_profile_id", barberProfileId)
      .eq("status", "confirmed")
      .eq("is_blocked", false)
      .eq("is_break", false)
      .in("client_profile_id", clientIds),
    supabase
      .from("barber_client_records")
      .select("client_profile_id, key_notes, photo_path")
      .eq("barber_profile_id", barberProfileId)
      .in("client_profile_id", clientIds),
    supabase
      .from("custom_field_definitions")
      .select("id, label")
      .eq("barber_profile_id", barberProfileId)
      .eq("field_type", "single_select")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase.from("custom_field_values").select("field_id, client_profile_id, value").in("client_profile_id", clientIds),
  ]);

  const polarIdById = new Map(((profiles ?? []) as { id: string; polar_id: string | null }[]).map((p) => [p.id, p.polar_id]));
  type DetailsRow = {
    profile_id: string;
    hair_type: string | null;
    hair_texture: string | null;
    hair_density: string | null;
    hair_colour: string | null;
    scalp_condition: string | null;
    skin_sensitivity: string | null;
    allergies: string | null;
    emergency_contact: string | null;
  };
  const detailsById = new Map(((details ?? []) as DetailsRow[]).map((d) => [d.profile_id, d]));
  const sinceById = new Map(((links ?? []) as { client_profile_id: string; created_at: string }[]).map((l) => [l.client_profile_id, l.created_at]));

  const rowsByClient = new Map<string, VisitRow[]>();
  for (const r of (visitRows ?? []) as (VisitRow & { client_profile_id: string })[]) {
    rowsByClient.set(r.client_profile_id, [...(rowsByClient.get(r.client_profile_id) ?? []), r]);
  }

  const recordById = new Map(
    ((records ?? []) as { client_profile_id: string; key_notes: string | null; photo_path: string | null }[]).map((r) => [r.client_profile_id, r])
  );
  const photoPaths = [...recordById.values()].map((r) => r.photo_path).filter((p): p is string => Boolean(p));
  const urlByPath = new Map<string, string>();
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(photoPaths, PHOTO_URL_TTL_SECONDS);
    for (const s of signed ?? []) if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
  }

  const fields = (insightFields ?? []) as { id: string; label: string }[];
  const answer = new Map(
    ((insightValues ?? []) as { field_id: string; client_profile_id: string; value: unknown }[]).map((v) => [`${v.field_id}:${v.client_profile_id}`, v.value])
  );

  return bookings.map((b) => {
    const d = detailsById.get(b.clientProfileId);
    const rec = recordById.get(b.clientProfileId);
    const client: WorkflowClient = {
      id: b.clientProfileId,
      name: b.clientName ?? "Unknown client",
      polarId: polarIdById.get(b.clientProfileId) ?? null,
      photoUrl: rec?.photo_path ? urlByPath.get(rec.photo_path) ?? null : null,
      clientSince: sinceById.get(b.clientProfileId) ?? null,
      totalVisits: countVisits(rowsByClient.get(b.clientProfileId) ?? [], { today: date, nowTime }),
      hairType: d?.hair_type ?? null,
      hairTexture: d?.hair_texture ?? null,
      hairDensity: d?.hair_density ?? null,
      hairColour: d?.hair_colour ?? null,
      scalpCondition: d?.scalp_condition ?? null,
      skinSensitivity: d?.skin_sensitivity ?? null,
      allergies: d?.allergies ?? null,
      emergencyContact: d?.emergency_contact ?? null,
      keyNotes: rec?.key_notes ?? null,
      insights: fields.map((f) => {
        const v = answer.get(`${f.id}:${b.clientProfileId}`);
        return { label: f.label, value: typeof v === "string" ? v : null };
      }),
    };
    return {
      id: b.id,
      startTime: b.startTime.slice(0, 5),
      endTime: b.endTime.slice(0, 5),
      serviceName: b.serviceName,
      isBarter: b.isBarter,
      client,
    };
  });
}
