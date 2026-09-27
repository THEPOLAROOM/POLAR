import Image from "next/image";
import { requireRole } from "@/lib/auth/require-role";
import { POLAR_BARBER_PROFILE_ID } from "@/lib/config";
import { formatTime12h } from "@/lib/dates";

// Same centred, room-photo composition as the Client Dashboard, My
// Appointments and the just-approved Client Services page (aspect-
// [1672/941] background, content scaled down and centred within
// equal insets, shifted down to clear the wall signage) — reused so
// this page sits inside the same visual frame as its siblings rather
// than inventing a new one. No bespoke mastered UI overlay exists for
// Your Barber yet, so the content panel below is real markup styled
// with the same colour/typography tokens already used throughout the
// Client Dashboard, not a new visual language.
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

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

type BarberInfo = { barberName: string | null; shopName: string | null };
type WorkAddress = {
  line1: string;
  line2: string | null;
  town: string;
  county: string | null;
  postcode: string;
  country: string;
};
type HourRange = { start: string; end: string };

// Server-side ROLE check happens FIRST, same as every other protected
// dashboard page. Read-only, solo-barber V1: every read below targets
// the one fixed POLAR_BARBER_PROFILE_ID, same as Book/My Appointments.
//
// Barber identity (name/shop) and work address both come from the
// existing get_barber_display_info() / get_barber_work_address()
// SECURITY DEFINER RPCs — the exact same ones My Appointments already
// calls (get_barber_display_info) or that already exist live for
// this purpose (get_barber_work_address, previously unused by any
// page). No new RPC, table, or column was added. Both RPCs are
// intentionally gated on the caller having a CONFIRMED booking with
// this barber — a real, pre-existing constraint documented further
// in this task's final report, not something worked around here.
//
// Weekly availability is read directly from barber_availability,
// which — unlike the two RPCs above — already has a broad
// "any client reads active" RLS policy requiring no booking at all
// (the same table Book already reads for its calendar).
export default async function YourBarberPage() {
  const { supabase } = await requireRole("client");

  const [{ data: infoRows }, { data: addressRows }, { data: availabilityRows }] = await Promise.all([
    supabase.rpc("get_barber_display_info", { target_barber_id: POLAR_BARBER_PROFILE_ID }),
    supabase.rpc("get_barber_work_address", { target_barber_id: POLAR_BARBER_PROFILE_ID }),
    supabase
      .from("barber_availability")
      .select("day_of_week, start_time, end_time")
      .eq("barber_profile_id", POLAR_BARBER_PROFILE_ID)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  const info: BarberInfo | null =
    (infoRows as { barber_name: string | null; shop_name: string | null }[] | null)?.[0]
      ? {
          barberName: (infoRows as { barber_name: string | null }[])[0].barber_name,
          shopName: (infoRows as { shop_name: string | null }[])[0].shop_name,
        }
      : null;

  const address: WorkAddress | null =
    (
      addressRows as
        | {
            work_address_line_1: string;
            work_address_line_2: string | null;
            work_town_city: string;
            work_county_region: string | null;
            work_postcode: string;
            work_country: string;
          }[]
        | null
    )?.[0]
      ? {
          line1: (addressRows as { work_address_line_1: string }[])[0].work_address_line_1,
          line2: (addressRows as { work_address_line_2: string | null }[])[0].work_address_line_2,
          town: (addressRows as { work_town_city: string }[])[0].work_town_city,
          county: (addressRows as { work_county_region: string | null }[])[0].work_county_region,
          postcode: (addressRows as { work_postcode: string }[])[0].work_postcode,
          country: (addressRows as { work_country: string }[])[0].work_country,
        }
      : null;

  const hoursByDay = new Map<number, HourRange[]>();
  for (const row of (availabilityRows ?? []) as { day_of_week: number; start_time: string; end_time: string }[]) {
    const list = hoursByDay.get(row.day_of_week) ?? [];
    list.push({ start: row.start_time, end: row.end_time });
    hoursByDay.set(row.day_of_week, list);
  }
  const hasAnyHours = hoursByDay.size > 0;

  const barberDisplayName = info?.barberName ?? null;
  const shopDisplayName = info?.shopName ?? null;

  return (
    <>
      {/* Mobile — plain functional placeholder, same established
          pattern already used elsewhere (Book, My Services, Client
          Services) for a page with no bespoke mobile asset yet. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">Your Barber</h1>

        <section className="mt-4 rounded border border-polar-border px-3 py-3">
          {barberDisplayName ? (
            <>
              <p className="text-sm font-semibold text-polar-text">{barberDisplayName}</p>
              {shopDisplayName && <p className="text-sm text-polar-muted">{shopDisplayName}</p>}
            </>
          ) : (
            <p className="text-sm text-polar-muted">
              Your barber&apos;s details will appear here once you have a confirmed appointment.
            </p>
          )}
        </section>

        {address && (
          <section className="mt-4 rounded border border-polar-border px-3 py-3">
            <p className="text-sm font-semibold text-polar-text">Work address</p>
            <p className="mt-1 text-sm text-polar-text">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}, {address.town}
              {address.county ? `, ${address.county}` : ""}, {address.postcode}, {address.country}
            </p>
          </section>
        )}

        <section className="mt-4 rounded border border-polar-border px-3 py-3">
          <p className="text-sm font-semibold text-polar-text">Opening hours</p>
          {hasAnyHours ? (
            <ul className="mt-1 space-y-1">
              {DAY_NAMES.map((dayName, dow) => {
                const ranges = hoursByDay.get(dow);
                if (!ranges) return null;
                return (
                  <li key={dow} className="flex justify-between text-sm text-polar-text">
                    <span>{dayName}</span>
                    <span className="text-polar-muted">
                      {ranges.map((r) => `${formatTime12h(r.start)}–${formatTime12h(r.end)}`).join(", ")}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-polar-muted">No availability configured yet.</p>
          )}
        </section>
      </main>

      {/* Desktop — same POLAR Room background + centred, scaled
          content frame as the Client Dashboard, My Appointments and
          Client Services. No mastered overlay exists for Your Barber
          yet, so the panel is real markup using the same tokens those
          pages already use, not a new design language. */}
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
              <h1 className="font-display text-white" style={{ fontSize: `${2.2 * OVERLAY_SCALE}vw` }}>
                Your Barber
              </h1>

              <div className="mt-[2%] flex-1 overflow-y-auto" style={{ display: "flex", flexDirection: "column", gap: "2%" }}>
                {/* Identity panel */}
                <div className="rounded-xl border border-white/10" style={{ backgroundColor: PANEL_BG, padding: "3%" }}>
                  {barberDisplayName ? (
                    <>
                      <p className="font-display text-white" style={{ fontSize: `${1.5 * OVERLAY_SCALE}vw` }}>
                        {barberDisplayName}
                      </p>
                      {shopDisplayName && (
                        <p className="mt-[0.5%] font-body text-white/60" style={{ fontSize: `${1 * OVERLAY_SCALE}vw` }}>
                          {shopDisplayName}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="font-body text-white/50" style={{ fontSize: `${1 * OVERLAY_SCALE}vw` }}>
                      Your barber&apos;s details will appear here once you have a confirmed appointment.
                    </p>
                  )}
                </div>

                {/* Work address panel — omitted entirely (not shown as
                    an empty state) when the barber has no separate
                    work address on file or none can be shared yet,
                    matching get_barber_work_address()'s own design:
                    it never falls back to exposing the home address. */}
                {address && (
                  <div className="rounded-xl border border-white/10" style={{ backgroundColor: PANEL_BG, padding: "3%" }}>
                    <p className="font-display text-white" style={{ fontSize: `${1.1 * OVERLAY_SCALE}vw` }}>
                      Work address
                    </p>
                    <p className="mt-[1%] font-body text-white/70" style={{ fontSize: `${0.95 * OVERLAY_SCALE}vw` }}>
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}, {address.town}
                      {address.county ? `, ${address.county}` : ""}, {address.postcode}, {address.country}
                    </p>
                  </div>
                )}

                {/* Opening hours panel — always shown; ungated by
                    booking status, same RLS-permitted read Book
                    already relies on. */}
                <div className="rounded-xl border border-white/10" style={{ backgroundColor: PANEL_BG, padding: "3%" }}>
                  <p className="font-display text-white" style={{ fontSize: `${1.1 * OVERLAY_SCALE}vw` }}>
                    Opening hours
                  </p>
                  {hasAnyHours ? (
                    <ul className="mt-[1%]">
                      {DAY_NAMES.map((dayName, dow) => {
                        const ranges = hoursByDay.get(dow);
                        if (!ranges) return null;
                        return (
                          <li
                            key={dow}
                            className="flex items-center justify-between border-b border-white/5 last:border-b-0 font-body text-white/80"
                            style={{ padding: "1% 0", fontSize: `${0.9 * OVERLAY_SCALE}vw` }}
                          >
                            <span>{dayName}</span>
                            <span className="text-white/50">
                              {ranges.map((r) => `${formatTime12h(r.start)}–${formatTime12h(r.end)}`).join(", ")}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-[1%] font-body text-white/50" style={{ fontSize: `${0.9 * OVERLAY_SCALE}vw` }}>
                      No availability configured yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
