"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/auth/require-role";

// The barber's PRIVATE record about one linked client (Key Notes + the
// client photo) — table barber_client_records, bucket client-photos
// (private). RLS enforces that only the owning barber, while linked to
// the client, can read/write either; clients have no access at all.
// These actions add requireRole("barber") and scope every write to the
// caller's own id on top of that.

type ActionResult = { error: string } | void;

const CLIENT_PHOTO_BUCKET = "client-photos";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const clientPath = (clientId: string) => `/dashboard/barber/clients/${clientId}`;

export async function saveClientKeyNotes(formData: FormData): Promise<ActionResult> {
  const clientId = String(formData.get("client_id") ?? "").trim();
  if (!clientId) return { error: "Missing client." };
  const notes = String(formData.get("key_notes") ?? "").trim();

  const { supabase, user } = await requireRole("barber");

  const { error } = await supabase.from("barber_client_records").upsert(
    {
      barber_profile_id: user.id,
      client_profile_id: clientId,
      key_notes: notes === "" ? null : notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "barber_profile_id,client_profile_id" }
  );
  if (error) return { error: error.message };
  revalidatePath(clientPath(clientId));
}

export async function uploadClientPhoto(formData: FormData): Promise<ActionResult> {
  const clientId = String(formData.get("client_id") ?? "").trim();
  const file = formData.get("file");
  if (!clientId) return { error: "Missing client." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo to upload." };
  const ext = PHOTO_TYPES[file.type];
  if (!ext) return { error: "Photo must be a JPEG, PNG or WebP image." };
  if (file.size > MAX_PHOTO_BYTES) return { error: "Photo must be 5 MB or smaller." };

  const { supabase, user } = await requireRole("barber");

  const { data: existing } = await supabase
    .from("barber_client_records")
    .select("photo_path")
    .eq("barber_profile_id", user.id)
    .eq("client_profile_id", clientId)
    .maybeSingle();

  // {barber}/{client}/{file} — the storage policies check both segments.
  const path = `${user.id}/${clientId}/${randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(CLIENT_PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("barber_client_records").upsert(
    { barber_profile_id: user.id, client_profile_id: clientId, photo_path: path, updated_at: new Date().toISOString() },
    { onConflict: "barber_profile_id,client_profile_id" }
  );
  if (error) {
    await supabase.storage.from(CLIENT_PHOTO_BUCKET).remove([path]);
    return { error: error.message };
  }

  const old = existing?.photo_path as string | null | undefined;
  if (old && old !== path) {
    const { error: removeError } = await supabase.storage.from(CLIENT_PHOTO_BUCKET).remove([old]);
    if (removeError) console.error("uploadClientPhoto old photo cleanup failed:", removeError.message);
  }
  revalidatePath(clientPath(clientId));
}

export async function removeClientPhoto(formData: FormData): Promise<ActionResult> {
  const clientId = String(formData.get("client_id") ?? "").trim();
  if (!clientId) return { error: "Missing client." };

  const { supabase, user } = await requireRole("barber");

  const { data: existing } = await supabase
    .from("barber_client_records")
    .select("photo_path")
    .eq("barber_profile_id", user.id)
    .eq("client_profile_id", clientId)
    .maybeSingle();
  const old = existing?.photo_path as string | null | undefined;
  if (!old) return;

  const { error } = await supabase
    .from("barber_client_records")
    .update({ photo_path: null, updated_at: new Date().toISOString() })
    .eq("barber_profile_id", user.id)
    .eq("client_profile_id", clientId);
  if (error) return { error: error.message };

  const { error: removeError } = await supabase.storage.from(CLIENT_PHOTO_BUCKET).remove([old]);
  if (removeError) console.error("removeClientPhoto storage remove failed:", removeError.message);
  revalidatePath(clientPath(clientId));
}
