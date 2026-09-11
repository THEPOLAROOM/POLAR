import Link from "next/link";
import Image from "next/image";
import { requireRole } from "@/lib/auth/require-role";
import { getBarberBookingsForDate } from "@/lib/queries/barber-schedule";
import { getShopToday, getShopTimeNow, formatTime12h } from "@/lib/dates";

// Same proven two-asset layered architecture as the Client Dashboard:
// Layer 1 = mastered background room, Layer 2 = mastered transparent
// UI overlay (drawn once, never recreated in CSS), Layer 3 = real
// click targets / live data patched on top at the exact coordinates
// measured against the overlay's own native 1672x941 canvas (pixel-
// level scan of each panel's border, same technique used for the
// Client Dashboard overlay).

// The overlay (plus every click target/patch below, all measured
// against its own 1672x941 canvas) renders at this fraction of the
// background's width and is centred via equal insets on every side —
// same technique/value as the Client Dashboard overlay. The
// background itself is untouched (still full-bleed, no scale/inset),
// so shrinking only the overlay is what reveals room around it and
// keeps the whole functional UI safely inside typical viewport
// heights without needing to scroll.
const OVERLAY_SCALE = 0.76;
const OVERLAY_INSET_PCT = `${((1 - OVERLAY_SCALE) / 2) * 100}%`;
const OVERLAY_INSET = {
  left: OVERLAY_INSET_PCT,
  right: OVERLAY_INSET_PCT,
  top: OVERLAY_INSET_PCT,
  bottom: OVERLAY_INSET_PCT,
};

const CARD_ROW = { top: "17.11%", height: "34.64%" };
const CARDS = [
  { href: "/dashboard/barber/clients", label: "Clients", box: { left: "1.38%", width: "19.08%" } },
  { href: "/dashboard/barber/services", label: "My Services", box: { left: "20.87%", width: "19.26%" } },
  { href: "/dashboard/barber/calendar", label: "Calendar", box: { left: "40.61%", width: "18.72%" } },
  { href: "/dashboard/barber/shift", label: "Workflow Mode", box: { left: "59.75%", width: "19.32%" } },
  { href: "/dashboard/barber/account", label: "My Profile", box: { left: "79.49%", width: "19.14%" } },
] as const;

// Quick Actions buttons share the same horizontal box (measured from
// the panel's own left/right button edges); only top/height differ
// per button. Emergency has no real backend yet, so it stays a
// visual-only inert hover target, same treatment as the Client
// Dashboard's inert (routeless) panels.
const QUICK_ACTION_BOX = { left: "40.28%", width: "19.74%" };
const ADD_WALK_IN_BOX = { ...QUICK_ACTION_BOX, top: "61.58%", height: "8.24%" };
const BLOCK_TIME_BOX = { ...QUICK_ACTION_BOX, top: "71.52%", height: "7.86%" };
const EMERGENCY_BOX = { ...QUICK_ACTION_BOX, top: "81.24%", height: "10.36%" };

const PANEL_HOVER_CLASS =
  "absolute rounded-2xl bg-transparent transition duration-200 ease-out hover:bg-white/[0.06] hover:shadow-[0_0_0_2px_rgba(91,155,255,0.55),0_0_28px_6px_rgba(91,155,255,0.5)]";

// Today's Schedule — the overlay's own baked illustration/copy ("No
// appointments scheduled" / "You're all clear for today.") is only
// accurate when there really are zero bookings today, so it is left
// untouched in that case. When there are real bookings, this box
// (the panel's inner content area) is covered with the panel's own
// sampled background colour and the genuine bookings are listed
// instead — never a mix of baked placeholder copy and real data.
const SCHEDULE_CONTENT_BOX = { left: "3.32%", top: "62.11%", width: "32.75%", height: "29.49%" };
const PANEL_FILL = "#02142e";

// Today's Stats — three small digit cells plus the cutting-time row.
// Each is patched the same way the Client Dashboard patches its
// baked POLAR ID placeholder: a solid rect sampled from the cell's
// own background, with the real number drawn on top in the same
// bold white style. Walk-ins has no backing data yet (no schema/RPC
// for it live) so it is left as the overlay's own accurate "0".
const STAT_CELL_TOP = "64.24%";
const STAT_CELL_HEIGHT = "4.25%";
const COMPLETED_PATCH_BOX = { left: "65.25%", top: STAT_CELL_TOP, width: "3.6%", height: STAT_CELL_HEIGHT };
const UPCOMING_PATCH_BOX = { left: "87.17%", top: STAT_CELL_TOP, width: "3.6%", height: STAT_CELL_HEIGHT };
const CUTTING_TIME_PATCH_BOX = { left: "70.39%", top: "82.04%", width: "10.8%", height: "3.45%" };

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Server-side ROLE check happens FIRST, same as every other protected
// barber page.
export default async function BarberDashboardPage() {
  const { supabase, user } = await requireRole("barber");

  const today = getShopToday();
  const todaysBookings = await getBarberBookingsForDate(
    supabase,
    user.id,
    today
  );

  // "Completed"/"upcoming" are derived from each booking's own real
  // start/end time against the current shop time — not a stored
  // status column (none exists) and not invented; just a genuine
  // reading of real data. Total cutting time sums the duration of
  // the completed ones.
  const now = getShopTimeNow();
  const completedBookings = todaysBookings.filter((b) => b.endTime <= now);
  const upcomingCount = todaysBookings.filter((b) => b.startTime > now).length;
  const cuttingMinutes = completedBookings.reduce(
    (sum, b) => sum + Math.max(0, timeToMinutes(b.endTime) - timeToMinutes(b.startTime)),
    0
  );
  const cuttingTimeLabel = `${Math.floor(cuttingMinutes / 60)}h ${cuttingMinutes % 60}m`;

  return (
    <div id="barber-dashboard-page">
      {/* This page's nav lives in the shared barber layout
          (src/app/dashboard/barber/layout.tsx), which every other
          barber route still needs untouched — so rather than editing
          that shared file (or its routes) to remove it there too,
          this plain (non-styled-jsx, since this is a Server
          Component) global style rule reaches out to hide just that
          one sibling `nav` only when this exact page is the one
          rendering, via the stable `#barber-dashboard-page` id
          above. */}
      <style>{`
        div:has(> #barber-dashboard-page) > nav {
          display: none;
        }
      `}</style>

      {/* Mobile — simple functional placeholder; the mastered layered
          design below is desktop-only for this pass. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">Home</h1>
        <p className="mt-2 text-sm text-polar-muted">Signed in as {user.email}.</p>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-polar-text">Today&apos;s Schedule</h2>
          {todaysBookings.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {todaysBookings.map((booking) => (
                <li key={booking.id} className="rounded border border-polar-border px-3 py-2">
                  <Link
                    href={`/dashboard/barber/clients/${booking.clientProfileId}`}
                    className="flex items-center justify-between text-sm text-polar-text"
                  >
                    <span>
                      {formatTime12h(booking.startTime)}–{formatTime12h(booking.endTime)} — {booking.clientName}
                    </span>
                    <span className="text-xs text-polar-muted">
                      {booking.recurrence === "weekly" ? "Weekly" : "One-off"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-polar-muted">No appointments today.</p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-polar-text">Quick links</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {CARDS.map((card) => (
              <li key={card.href}>
                <Link
                  href={card.href}
                  className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text"
                >
                  {card.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* Desktop — mastered background + transparent UI overlay, with
          real click targets and live data patched on top, sized
          responsively by its own aspect ratio rather than forcing
          100dvh. The shared barber nav is hidden for this page only
          via the `:has()` rule above. */}
      <main className="relative hidden w-full overflow-hidden bg-navy sm:block">
        <div className="relative w-full aspect-[1672/941]">
          <Image
            src="/dashboard/polar-barber-dashboard-background.png"
            alt=""
            fill
            priority
            className="object-cover"
            aria-hidden="true"
          />

          <div className="absolute" style={OVERLAY_INSET}>
            <Image
              src="/dashboard/polar-barber-dashboard-ui-mastered.png"
              alt=""
              fill
              priority
              className="object-contain"
              aria-hidden="true"
            />

            {/* Five main cards */}
            {CARDS.map(({ href, label, box }) => (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`${PANEL_HOVER_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light`}
                style={{ ...CARD_ROW, ...box }}
              />
            ))}

            {/* Quick Actions — Add Walk-In / Block Time route to the
                existing pages that hold the real functionality
                (calendar walk-in form / availability). Emergency has
                no backend yet, so it stays an inert hover-only
                target. */}
            <Link
              href="/dashboard/barber/calendar"
              aria-label="Add Walk-In"
              className={`${PANEL_HOVER_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light`}
              style={ADD_WALK_IN_BOX}
            />
            <Link
              href="/dashboard/barber/availability"
              aria-label="Block Time"
              className={`${PANEL_HOVER_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light`}
              style={BLOCK_TIME_BOX}
            />
            <div aria-hidden="true" className={PANEL_HOVER_CLASS} style={EMERGENCY_BOX} />

            {/* Today's Schedule — only overridden with real content
                when there genuinely are bookings today; otherwise the
                overlay's own accurate empty-state art is left as-is. */}
            {todaysBookings.length > 0 && (
              <div className="absolute overflow-hidden rounded-xl" style={SCHEDULE_CONTENT_BOX}>
                <div className="absolute inset-0" style={{ backgroundColor: PANEL_FILL }} aria-hidden="true" />
                <ul
                  className="relative flex h-full flex-col justify-center"
                  style={{ gap: `${0.6 * OVERLAY_SCALE}vw`, paddingLeft: `${OVERLAY_SCALE}vw`, paddingRight: `${OVERLAY_SCALE}vw` }}
                >
                  {todaysBookings.slice(0, 4).map((booking) => (
                    <li
                      key={booking.id}
                      className="flex items-center justify-between gap-2"
                      style={{ fontSize: `${0.85 * OVERLAY_SCALE}vw` }}
                    >
                      <span className="truncate text-white">{booking.clientName}</span>
                      <span className="shrink-0 text-royal-light">
                        {formatTime12h(booking.startTime)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Today's Stats — real counts/duration patched over the
                baked placeholder digits, Client-Dashboard-ID-patch
                style. Walk-ins has no backing data source yet and is
                left as the overlay's own genuine "0". */}
            <div className="absolute flex items-center justify-center" style={COMPLETED_PATCH_BOX}>
              <div className="absolute inset-0" style={{ backgroundColor: PANEL_FILL }} aria-hidden="true" />
              <p className="relative font-body font-black leading-none text-white" style={{ fontSize: `${1.6 * OVERLAY_SCALE}vw` }}>
                {completedBookings.length}
              </p>
            </div>
            <div className="absolute flex items-center justify-center" style={UPCOMING_PATCH_BOX}>
              <div className="absolute inset-0" style={{ backgroundColor: PANEL_FILL }} aria-hidden="true" />
              <p className="relative font-body font-black leading-none text-white" style={{ fontSize: `${1.6 * OVERLAY_SCALE}vw` }}>
                {upcomingCount}
              </p>
            </div>
            <div className="absolute flex items-center justify-center" style={CUTTING_TIME_PATCH_BOX}>
              <div className="absolute inset-0" style={{ backgroundColor: PANEL_FILL }} aria-hidden="true" />
              <p className="relative font-body font-black leading-none text-white" style={{ fontSize: `${1.4 * OVERLAY_SCALE}vw` }}>
                {cuttingTimeLabel}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
