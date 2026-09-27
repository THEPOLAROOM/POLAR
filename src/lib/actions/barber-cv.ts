"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

type ActionResult = { error: string } | void;

export type CvWorkplace = { id?: string; workplace: string; position: string; fromYear: number | null; toYear: number | null };
export type CvQualification = { id?: string; name: string; provider: string; year: number | null };
export type CvAchievement = { id?: string; name: string; result: string; year: number | null };

export type CvPayload = {
  barberName: string;
  businessName: string;
  yearsExperience: number | null;
  workLocation: string;
  additionalInfo: string;
  work: CvWorkplace[];
  qualifications: CvQualification[];
  achievements: CvAchievement[];
};

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const orNull = (v: string) => (v === "" ? null : v);
const uuid = (v: unknown) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : undefined);
function year(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1950 && n <= new Date().getFullYear() ? n : null;
}

/**
 * Saves the calling barber's POLAR CV. The four existing
 * barber_professional_details values keep their exact storage (the same
 * row, same columns get_barber_display_info reads); additional_info is
 * new. The three repeatable sections are synced: rows the barber
 * removed are deleted, the rest upserted in on-screen order. All writes
 * rely on the barber-only own-row RLS policies.
 */
export async function saveBarberCv(payload: CvPayload): Promise<ActionResult> {
  const { supabase, user } = await requireRole("barber");

  let yearsExperience: number | null = null;
  if (payload.yearsExperience !== null && payload.yearsExperience !== undefined) {
    const n = Number(payload.yearsExperience);
    if (!Number.isInteger(n) || n < 0) return { error: "Years of experience must be a whole number." };
    yearsExperience = n;
  }

  const work = (payload.work ?? [])
    .map((w) => ({ id: uuid(w.id), workplace: text(w.workplace), position: text(w.position), from_year: year(w.fromYear), to_year: year(w.toYear) }))
    .filter((w) => w.workplace || w.position || w.from_year);
  if (work.some((w) => !w.workplace)) return { error: "Each workplace needs a name (Where did you work?)." };
  if (work.some((w) => w.from_year && w.to_year && w.to_year < w.from_year)) return { error: "A workplace's To year can't be before its From year." };

  const qualifications = (payload.qualifications ?? [])
    .map((q) => ({ id: uuid(q.id), name: text(q.name), provider: text(q.provider), year: year(q.year) }))
    .filter((q) => q.name || q.provider || q.year);
  if (qualifications.some((q) => !q.name)) return { error: "Each qualification needs a name." };

  const achievements = (payload.achievements ?? [])
    .map((a) => ({ id: uuid(a.id), name: text(a.name), result: text(a.result), year: year(a.year) }))
    .filter((a) => a.name || a.result || a.year);
  if (achievements.some((a) => !a.name)) return { error: "Each achievement needs a name." };

  const { error: detailsError } = await supabase
    .from("barber_professional_details")
    .update({
      barber_name: orNull(text(payload.barberName)),
      business_name: orNull(text(payload.businessName)),
      years_experience: yearsExperience,
      work_location: orNull(text(payload.workLocation)),
      additional_info: orNull(text(payload.additionalInfo)),
    })
    .eq("profile_id", user.id);
  if (detailsError) return { error: detailsError.message };

  const sync = async (table: string, rows: Array<Record<string, unknown> & { id?: string }>) => {
    const keep = rows.map((r) => r.id).filter((id): id is string => !!id);
    let del = supabase.from(table).delete().eq("barber_profile_id", user.id);
    if (keep.length) del = del.not("id", "in", `(${keep.join(",")})`);
    const { error: e1 } = await del;
    if (e1) return e1.message;
    if (!rows.length) return null;
    const records = rows.map(({ id, ...r }, i) => ({ ...(id ? { id } : {}), ...r, barber_profile_id: user.id, display_order: i }));
    const existing = records.filter((r) => "id" in r);
    const fresh = records.filter((r) => !("id" in r));
    if (existing.length) {
      const { error } = await supabase.from(table).upsert(existing);
      if (error) return error.message;
    }
    if (fresh.length) {
      const { error } = await supabase.from(table).insert(fresh);
      if (error) return error.message;
    }
    return null;
  };

  for (const [table, rows] of [
    ["barber_work_experience", work],
    ["barber_qualifications", qualifications],
    ["barber_achievements", achievements],
  ] as const) {
    const err = await sync(table, rows);
    if (err) return { error: err };
  }

  revalidatePath("/dashboard/barber/account/professional-profile");
  revalidatePath("/dashboard/barber/account");
}
