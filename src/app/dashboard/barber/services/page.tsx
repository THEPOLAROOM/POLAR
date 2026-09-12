import { requireRole } from "@/lib/auth/require-role";
import { ServicesManager, type ServiceWithImages } from "./services-manager";

const IMAGE_BUCKET = "service-images";

// Server-side ROLE check happens FIRST, same as every other protected
// barber page. Services + their images are both scoped to the caller
// via RLS ("services: barber manages own" / "service_images: barber
// manages own"); the query filters explicitly too, same belt-and-
// braces pattern used everywhere else in this codebase.
export default async function MyServicesPage() {
  const { supabase, user } = await requireRole("barber");

  const { data: services } = await supabase
    .from("services")
    .select("id, name, price, duration_minutes, description, notes, is_active, display_order")
    .eq("barber_profile_id", user.id)
    .order("display_order", { ascending: true });

  const serviceIds = (services ?? []).map((s) => s.id as string);

  const { data: images } =
    serviceIds.length > 0
      ? await supabase
          .from("service_images")
          .select("id, service_id, storage_path, is_cover, display_order")
          .in("service_id", serviceIds)
          .order("display_order", { ascending: true })
      : { data: [] as { id: string; service_id: string; storage_path: string; is_cover: boolean; display_order: number }[] };

  const imagesByService = new Map<string, ServiceWithImages["images"]>();
  for (const img of images ?? []) {
    const list = imagesByService.get(img.service_id as string) ?? [];
    list.push({
      id: img.id as string,
      url: supabase.storage.from(IMAGE_BUCKET).getPublicUrl(img.storage_path as string).data.publicUrl,
      isCover: img.is_cover as boolean,
    });
    imagesByService.set(img.service_id as string, list);
  }

  const myServices: ServiceWithImages[] = (services ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    price: Number(s.price),
    durationMinutes: s.duration_minutes as number,
    description: (s.description as string | null) ?? "",
    notes: (s.notes as string | null) ?? "",
    isActive: s.is_active as boolean,
    displayOrder: s.display_order as number,
    images: imagesByService.get(s.id as string) ?? [],
  }));

  return <ServicesManager services={myServices} />;
}
