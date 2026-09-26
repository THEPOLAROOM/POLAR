"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

// Barber Insights — PRIVATE, barber-defined dropdown questions about
// clients (e.g. "Hair Difficulty": Easy / Medium / Hard). Stored in the
// existing custom_field_definitions (field_type 'single_select', answers
// in `options`) and custom_field_values tables, whose existing RLS
// already makes both barber-owned and barber-only: a question belongs to
// the barber who created it, and an answer is readable/writable only by
// that question's owner while linked to the client. Clients have no
// access to either table.

type ActionResult = { error: string } | void;

const INSIGHTS_PATH = "/dashboard/barber/insights";
const MAX_OPTIONS = 12;

function readOptions(formData: FormData): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of formData.getAll("options")) {
    const v = String(raw).trim().slice(0, 60);
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      out.push(v);
    }
  }
  return out.slice(0, MAX_OPTIONS);
}

export async function createInsightField(formData: FormData): Promise<ActionResult> {
  const label = String(formData.get("label") ?? "").trim().slice(0, 80);
  const options = readOptions(formData);
  if (!label) return { error: "Give the insight a name." };
  if (options.length < 2) return { error: "Add at least two dropdown answers." };

  const { supabase, user } = await requireRole("barber");

  const { data: last } = await supabase
    .from("custom_field_definitions")
    .select("display_order")
    .eq("barber_profile_id", user.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("custom_field_definitions").insert({
    barber_profile_id: user.id,
    label,
    field_type: "single_select",
    options,
    display_order: ((last?.display_order as number | undefined) ?? 0) + 1,
  });
  if (error) return { error: error.message };
  revalidatePath(INSIGHTS_PATH);
}

export async function updateInsightField(formData: FormData): Promise<ActionResult> {
  const fieldId = String(formData.get("field_id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim().slice(0, 80);
  const options = readOptions(formData);
  if (!fieldId) return { error: "Missing insight." };
  if (!label) return { error: "Give the insight a name." };
  if (options.length < 2) return { error: "Keep at least two dropdown answers." };

  const { supabase, user } = await requireRole("barber");

  const { error } = await supabase
    .from("custom_field_definitions")
    .update({ label, options })
    .eq("id", fieldId)
    .eq("barber_profile_id", user.id)
    .eq("field_type", "single_select");
  if (error) return { error: error.message };
  revalidatePath(INSIGHTS_PATH);
}

export async function setInsightFieldActive(formData: FormData): Promise<ActionResult> {
  const fieldId = String(formData.get("field_id") ?? "").trim();
  const isActive = String(formData.get("is_active") ?? "") === "true";
  if (!fieldId) return { error: "Missing insight." };

  const { supabase, user } = await requireRole("barber");

  const { error } = await supabase
    .from("custom_field_definitions")
    .update({ is_active: isActive })
    .eq("id", fieldId)
    .eq("barber_profile_id", user.id)
    .eq("field_type", "single_select");
  if (error) return { error: error.message };
  revalidatePath(INSIGHTS_PATH);
}

/** Saves this barber's insight answers for one linked client (one per active question). */
export async function saveClientInsights(formData: FormData): Promise<ActionResult> {
  const clientId = String(formData.get("client_id") ?? "").trim();
  if (!clientId) return { error: "Missing client." };

  const { supabase, user } = await requireRole("barber");

  const { data: fields } = await supabase
    .from("custom_field_definitions")
    .select("id, options")
    .eq("barber_profile_id", user.id)
    .eq("field_type", "single_select")
    .eq("is_active", true);
  if (!fields || fields.length === 0) return;

  const rows = fields.map((f) => {
    const raw = String(formData.get(`insight_${f.id}`) ?? "").trim();
    const allowed = (f.options as string[] | null) ?? [];
    return {
      field_id: f.id,
      client_profile_id: clientId,
      value: raw && allowed.includes(raw) ? raw : null,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from("custom_field_values").upsert(rows, { onConflict: "field_id,client_profile_id" });
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/barber/clients/${clientId}`);
}
