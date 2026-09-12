"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

const SERVICES_PATH = "/dashboard/barber/services";
const IMAGE_BUCKET = "service-images";

type ActionResult = { error: string } | { id: string } | void;

/**
 * Creates or updates a service owned by the calling barber, depending
 * on whether `service_id` is present. RLS ("services: barber manages
 * own") scopes every read/write to the caller's own rows regardless —
 * this is the only app-level check.
 */
export async function saveService(formData: FormData): Promise<ActionResult> {
  const serviceId = String(formData.get("service_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "0").trim();
  const hours = Number(formData.get("duration_hours") ?? 0);
  const minutes = Number(formData.get("duration_minutes") ?? 0);
  const description = String(formData.get("description") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  // An unchecked checkbox is simply absent from FormData, so its
  // absence genuinely means "inactive" here, not a missing default.
  const isActive = String(formData.get("is_active") ?? "") === "true";

  const price = Number(priceRaw);
  const durationMinutes = hours * 60 + minutes;

  if (!name) return { error: "Service name is required." };
  if (!Number.isFinite(price) || price < 0) return { error: "Enter a valid price." };
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return { error: "Set a duration greater than 0." };
  }

  const { supabase, user } = await requireRole("barber");

  const row = {
    name,
    price,
    duration_minutes: durationMinutes,
    description: description || null,
    notes: notes || null,
    is_active: isActive,
  };

  if (serviceId) {
    const { error } = await supabase.from("services").update(row).eq("id", serviceId);
    if (error) return { error: error.message };
    revalidatePath(SERVICES_PATH);
    return { id: serviceId };
  }

  const { count } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("barber_profile_id", user.id);

  const { data, error } = await supabase
    .from("services")
    .insert({ ...row, barber_profile_id: user.id, display_order: count ?? 0 })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not create service." };
  revalidatePath(SERVICES_PATH);
  return { id: data.id as string };
}

/**
 * Activates or deactivates one of the calling barber's own services.
 * Unchanged from before this redesign.
 */
export async function setServiceActive(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("service_id") ?? "").trim();
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!serviceId) return;

  const { supabase } = await requireRole("barber");

  await supabase.from("services").update({ is_active: isActive }).eq("id", serviceId);

  revalidatePath(SERVICES_PATH);
}

/**
 * Deletes one of the calling barber's own services, immediately (no
 * confirmation step — the barber-facing UI has none by design). Its
 * uploaded images are removed from storage first (service_images rows
 * cascade-delete with the service, but the underlying storage objects
 * do not clean themselves up).
 */
export async function deleteService(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("service_id") ?? "").trim();
  if (!serviceId) return;

  const { supabase } = await requireRole("barber");

  const { data: images } = await supabase
    .from("service_images")
    .select("storage_path")
    .eq("service_id", serviceId);

  const paths = (images ?? []).map((i) => i.storage_path as string);
  if (paths.length > 0) {
    await supabase.storage.from(IMAGE_BUCKET).remove(paths);
  }

  await supabase.from("services").delete().eq("id", serviceId);

  revalidatePath(SERVICES_PATH);
}

/**
 * Moves a service one place up or down in the barber's own manual
 * ordering, by swapping display_order with its neighbour in the
 * caller-supplied current order (the order the barber was actually
 * looking at when they clicked — not re-derived server-side, so it
 * matches what's on screen even mid-search/filter).
 */
export async function reorderService(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("service_id") ?? "").trim();
  const direction = String(formData.get("direction") ?? "");
  const orderedIds = String(formData.get("ordered_ids") ?? "")
    .split(",")
    .filter(Boolean);

  const index = orderedIds.indexOf(serviceId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= orderedIds.length) return;

  const otherId = orderedIds[swapIndex];

  const { supabase } = await requireRole("barber");

  const { data: rows } = await supabase
    .from("services")
    .select("id, display_order")
    .in("id", [serviceId, otherId]);

  const a = rows?.find((r) => r.id === serviceId);
  const b = rows?.find((r) => r.id === otherId);
  if (!a || !b) return;

  await Promise.all([
    supabase.from("services").update({ display_order: b.display_order }).eq("id", a.id),
    supabase.from("services").update({ display_order: a.display_order }).eq("id", b.id),
  ]);

  revalidatePath(SERVICES_PATH);
}

/**
 * Uploads one image for a service the caller owns (storage RLS
 * enforces the `${barberId}/...` path prefix independently of this
 * check). The very first image uploaded for a service becomes its
 * cover automatically; later ones are chosen via setCoverImage.
 */
export async function uploadServiceImage(formData: FormData): Promise<ActionResult> {
  const serviceId = String(formData.get("service_id") ?? "").trim();
  const file = formData.get("file");

  if (!serviceId || !(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }

  const { supabase, user } = await requireRole("barber");

  const { count } = await supabase
    .from("service_images")
    .select("id", { count: "exact", head: true })
    .eq("service_id", serviceId);

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${user.id}/${serviceId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type || undefined });

  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("service_images").insert({
    service_id: serviceId,
    storage_path: path,
    is_cover: (count ?? 0) === 0,
    display_order: count ?? 0,
  });

  if (error) return { error: error.message };

  revalidatePath(SERVICES_PATH);
}

/**
 * Removes one service image. If it was the cover image and others
 * remain, the next one (lowest display_order) is promoted so a
 * service with photos is never left without a cover.
 */
export async function deleteServiceImage(formData: FormData): Promise<void> {
  const imageId = String(formData.get("image_id") ?? "").trim();
  if (!imageId) return;

  const { supabase } = await requireRole("barber");

  const { data: image } = await supabase
    .from("service_images")
    .select("id, service_id, storage_path, is_cover")
    .eq("id", imageId)
    .maybeSingle();

  if (!image) return;

  await supabase.storage.from(IMAGE_BUCKET).remove([image.storage_path as string]);
  await supabase.from("service_images").delete().eq("id", imageId);

  if (image.is_cover) {
    const { data: next } = await supabase
      .from("service_images")
      .select("id")
      .eq("service_id", image.service_id as string)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (next) {
      await supabase.from("service_images").update({ is_cover: true }).eq("id", next.id);
    }
  }

  revalidatePath(SERVICES_PATH);
}

/** Designates one image as the cover, unsetting any previous cover. */
export async function setCoverImage(formData: FormData): Promise<void> {
  const imageId = String(formData.get("image_id") ?? "").trim();
  const serviceId = String(formData.get("service_id") ?? "").trim();
  if (!imageId || !serviceId) return;

  const { supabase } = await requireRole("barber");

  await supabase.from("service_images").update({ is_cover: false }).eq("service_id", serviceId);
  await supabase.from("service_images").update({ is_cover: true }).eq("id", imageId);

  revalidatePath(SERVICES_PATH);
}
