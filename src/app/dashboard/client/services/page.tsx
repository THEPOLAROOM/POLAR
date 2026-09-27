import Image from "next/image";
import { requireRole } from "@/lib/auth/require-role";
import { POLAR_BARBER_PROFILE_ID } from "@/lib/config";

const IMAGE_BUCKET = "service-images";

// Same centered, room-photo composition as the Client Dashboard and
// My Appointments (aspect-[1672/941] background, content scaled down
// and centred within equal insets) — reused so this page sits inside
// the same visual frame as its siblings rather than inventing a new
// one. Unlike those pages there is no bespoke mastered UI overlay for
// Services yet, so the content panel below is real markup styled with
// the same colour/typography tokens already used throughout the
// Client Dashboard (font-display/font-body, white/royal/magenta,
// dark translucent panels), not a new visual language.
// Same downward shift technique as My Appointments (translateY in
// dvh, not an inset percentage) — clears the room background's
// POLAR LONDON wall signage instead of sitting on top of it.
const OVERLAY_SCALE = 0.62;
const OVERLAY_INSET_PCT = `${((1 - OVERLAY_SCALE) / 2) * 100}%`;
const OVERLAY_INSET = {
  left: OVERLAY_INSET_PCT,
  right: OVERLAY_INSET_PCT,
  top: OVERLAY_INSET_PCT,
  bottom: OVERLAY_INSET_PCT,
  transform: "translateY(6dvh)",
};

const PANEL_BG = "#000E18";

type ActiveService = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description: string;
  coverUrl: string | null;
};

function money(n: number): string {
  return `£${n.toFixed(2)}`;
}

function durationLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

// Server-side ROLE check happens FIRST, same as every other protected
// dashboard page. Read-only: no create/edit/delete/reorder/activate
// action exists on this page at all — the barber's existing My
// Services page (src/app/dashboard/barber/services) remains the sole
// place that data is managed. Scoped to POLAR_BARBER_PROFILE_ID and
// is_active = true, matching exactly how /dashboard/client/book
// already reads the same table for its service dropdown; RLS
// ("services: any client reads active" / "service_images: any client
// reads for active services") independently enforces the same scope.
export default async function ClientServicesPage() {
  const { supabase } = await requireRole("client");

  const { data: activeServices } = await supabase
    .from("services")
    .select("id, name, price, duration_minutes, description")
    .eq("barber_profile_id", POLAR_BARBER_PROFILE_ID)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const serviceIds = (activeServices ?? []).map((s) => s.id as string);

  const { data: coverImages } =
    serviceIds.length > 0
      ? await supabase
          .from("service_images")
          .select("service_id, storage_path")
          .in("service_id", serviceIds)
          .eq("is_cover", true)
      : { data: [] as { service_id: string; storage_path: string }[] };

  const coverUrlByService = new Map<string, string>();
  for (const img of coverImages ?? []) {
    coverUrlByService.set(
      img.service_id as string,
      supabase.storage.from(IMAGE_BUCKET).getPublicUrl(img.storage_path as string).data.publicUrl
    );
  }

  const services: ActiveService[] = (activeServices ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    price: Number(s.price),
    durationMinutes: s.duration_minutes as number,
    description: (s.description as string | null) ?? "",
    coverUrl: coverUrlByService.get(s.id as string) ?? null,
  }));

  return (
    <>
      {/* Mobile — plain functional placeholder, same established
          pattern already used by the barber's own My Services page
          and the Book Appointment form for a page with no bespoke
          mobile asset yet (a mastered mobile design is separate,
          upcoming work) — not a new visual language. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">Services</h1>
        {services.length === 0 ? (
          <p className="mt-4 text-sm text-polar-muted">No services available yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {services.map((s) => (
              <li key={s.id} className="rounded border border-polar-border px-3 py-3">
                <div className="flex items-center gap-3">
                  {s.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.coverUrl} alt="" className="h-12 w-12 flex-none rounded-md object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-polar-text">{s.name}</p>
                    <p className="text-xs text-polar-muted">
                      {money(s.price)} · {durationLabel(s.durationMinutes)}
                    </p>
                  </div>
                </div>
                {s.description && (
                  <p className="mt-2 text-sm text-polar-text">{s.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Desktop — same POLAR Room background + centred, scaled
          content frame as the Client Dashboard and My Appointments.
          No mastered overlay exists for Services yet, so the panel is
          real markup using the same tokens those pages already use
          (font-display/font-body, white/royal/magenta accents, dark
          translucent panel fills) rather than a new design language. */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full aspect-[1672/941]">
            <Image
              src="/dashboard/polar-client-dashboard-desktop-background.png"
              alt=""
              fill
              priority
              className="object-cover"
              aria-hidden="true"
            />

            <div className="absolute flex flex-col" style={OVERLAY_INSET}>
              <h1
                className="font-display text-white"
                style={{ fontSize: `${2.2 * OVERLAY_SCALE}vw` }}
              >
                Services
              </h1>

              <div
                className="mt-[2%] flex-1 overflow-y-auto rounded-xl border border-white/10"
                style={{ backgroundColor: PANEL_BG }}
              >
                {services.length === 0 ? (
                  <p
                    className="font-body text-white/50"
                    style={{ padding: "3%", fontSize: `${1.1 * OVERLAY_SCALE}vw` }}
                  >
                    No services available yet.
                  </p>
                ) : (
                  <ul>
                    {services.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-start border-b border-white/5 last:border-b-0"
                        style={{ gap: "2%", padding: "2.5%" }}
                      >
                        <span
                          className="flex-none overflow-hidden rounded-lg bg-white/5"
                          style={{ width: "5.5vw", height: "5.5vw" }}
                        >
                          {s.coverUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.coverUrl} alt="" className="h-full w-full object-cover" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between" style={{ gap: "2%" }}>
                            <p
                              className="truncate font-display text-white"
                              style={{ fontSize: `${1.15 * OVERLAY_SCALE}vw` }}
                            >
                              {s.name}
                            </p>
                            <p
                              className="flex-none font-body text-royal-light"
                              style={{ fontSize: `${1 * OVERLAY_SCALE}vw` }}
                            >
                              {money(s.price)}
                            </p>
                          </div>
                          <p
                            className="font-body text-white/50"
                            style={{ fontSize: `${0.85 * OVERLAY_SCALE}vw` }}
                          >
                            {durationLabel(s.durationMinutes)}
                          </p>
                          {s.description && (
                            <p
                              className="mt-[1%] font-body text-white/70"
                              style={{ fontSize: `${0.9 * OVERLAY_SCALE}vw` }}
                            >
                              {s.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
