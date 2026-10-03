import Link from "next/link";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/* The darkened POLAR Room behind Calendar, Clients, Services and
   Workflow Mode (<BarberRoom decorative />). Unchanged: it still uses
   the earlier dashboard artwork (barber-dashboard-v3.webp, 1942x809). */

const BG_RATIO = 1942 / 809;

// Responsive fill — same strategy as /signup/barber and /signup/client.
// The stage covers the window and crops dynamically by viewport aspect
// ratio, but never into SAFE (fractions of the artwork): the Clients
// pill/tablet on the left to the My Services pill/workstation on the
// right, the top of the pills to POLAR's feet. This artwork is very wide
// (2.4:1), so on 16:9 / 16:10 screens the stage stops growing once SAFE
// fills the width; the remaining height is filled with the artwork's own
// sampled edge colours (EDGE_FILL), not navy.
const SAFE = { x0: 0.045, x1: 0.982, y0: 0.1, y1: 0.95 };
const STAGE_W = `min(max(100vw, calc(100dvh * ${BG_RATIO})), calc(100vw / ${SAFE.x1 - SAFE.x0}), calc(100dvh * ${BG_RATIO} / ${SAFE.y1 - SAFE.y0}))`;
const STAGE_H = `calc(var(--stage-w) / ${BG_RATIO})`;
const offset = (view: string, size: string, centre: number) =>
  `clamp(min(calc(${view} - ${size}), calc((${view} - ${size}) / 2)), calc(${view} / 2 - ${size} * ${centre}), max(0px, calc((${view} - ${size}) / 2)))`;
const STAGE_STYLE = {
  "--stage-w": STAGE_W,
  width: "var(--stage-w)",
  height: STAGE_H,
  left: offset("100vw", "var(--stage-w)", (SAFE.x0 + SAFE.x1) / 2),
  top: offset("100dvh", STAGE_H, (SAFE.y0 + SAFE.y1) / 2),
} as React.CSSProperties;
// Sampled from the artwork's own top / bottom edge rows.
const EDGE_FILL = "linear-gradient(180deg, #040308 0%, #040308 50%, #260f2d 100%)";

/**
 * The POLAR Room itself — artwork + responsive stage, filling its
 * positioned parent. Used by the Focus Mode / POLAR UI pages as their
 * darkened background (decorative, no children).
 */
export function BarberRoom({
  children,
  decorative = false,
  src = "/dashboard/barber-dashboard-v3.webp",
}: {
  children?: React.ReactNode;
  decorative?: boolean;
  /** A dedicated scene derived from the dashboard (same size/aspect), e.g. My Profile. */
  src?: string;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: EDGE_FILL }} aria-hidden={decorative || undefined}>
      <div className="absolute" style={STAGE_STYLE}>
        <Image
          src={src}
          alt={decorative ? "" : "POLAR's barber shop: Clients tablet, Calendar board, Workflow Mode chair, POLAR for My Profile, and the My Services workstation."}
          fill
          unoptimized
          priority
          className="object-contain"
        />
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barber Dashboard home (/dashboard/barber), desktop.
   Two layers, both the owner's supplied artwork, never redrawn:
     1. DASHBOARD — barber-dashboard-dark.webp (design-masters/
        barber-dashboard-master.png, 2018x779, pixel-identical): room,
        furniture, chair, workstation, calendar, navigation pills, lighting.
     2. POLAR — polar-mascot.webp (design-masters/polar-mascot.png,
        transparent, pixel-identical), a separate layer placed by MASCOT so
        he can be moved/scaled without touching the dashboard artwork.
   The five destinations are transparent links laid over the artwork's own
   pills and objects. All boxes are native artwork px. */

const ART = { w: 2018, h: 779 };
const DASHBOARD_SRC = "/dashboard/polar-room/barber-dashboard-dark.webp";
const MASCOT_SRC = "/dashboard/polar-room/polar-mascot.webp";

// POLAR's placement on the dashboard (artwork px). His image is 1024x1536;
// at this size his soles meet the floor line by the chair/workstation and
// he stands under the MY PROFILE pill. Adjust here only.
const MASCOT = { left: 1240, top: 189, width: 347, height: 520 };

// Always visible: the five pills (CLIENTS 54 → MY SERVICES 1984) and the
// MY PROFILE pill top (76) down to the furniture's feet (705).
const DASH_SAFE = { x0: 46 / ART.w, x1: 1992 / ART.w, y0: 68 / ART.h, y1: 712 / ART.h };
const DASH_RATIO = ART.w / ART.h;
const DASH_STAGE_W = `min(max(100vw, calc(100dvh * ${DASH_RATIO})), calc(100vw / ${DASH_SAFE.x1 - DASH_SAFE.x0}), calc(100dvh * ${DASH_RATIO} / ${DASH_SAFE.y1 - DASH_SAFE.y0}))`;
const DASH_STAGE_H = `calc(var(--stage-w) / ${DASH_RATIO})`;
const DASH_STAGE_STYLE = {
  "--stage-w": DASH_STAGE_W,
  width: "var(--stage-w)",
  height: DASH_STAGE_H,
  left: offset("100vw", "var(--stage-w)", (DASH_SAFE.x0 + DASH_SAFE.x1) / 2),
  top: offset("100dvh", DASH_STAGE_H, (DASH_SAFE.y0 + DASH_SAFE.y1) / 2),
} as React.CSSProperties;

export type Box = readonly [x: number, y: number, w: number, h: number];
export type Destination = { href: string; label: string; zones: readonly Box[] };

// Existing Barber Dashboard routes, mapped 1:1 onto the artwork. Each
// destination is its pill plus its physical object (POLAR for My Profile).
export const DESTINATIONS: readonly Destination[] = [
  { href: "/dashboard/barber/clients", label: "Clients", zones: [[50, 252, 236, 67], [4, 352, 318, 348]] },
  { href: "/dashboard/barber/calendar", label: "Calendar", zones: [[392, 137, 273, 63], [387, 238, 273, 267]] },
  { href: "/dashboard/barber/shift", label: "Workflow Mode", zones: [[873, 231, 272, 61], [828, 326, 338, 379]] },
  { href: "/dashboard/barber/account", label: "My Profile", zones: [[1278, 72, 270, 64], [1258, 190, 316, 500]] },
  { href: "/dashboard/barber/services", label: "My Services", zones: [[1684, 231, 304, 72], [1590, 350, 428, 350]] },
];

const artPct = ([x, y, w, h]: readonly number[]): React.CSSProperties => ({
  left: `${((x / ART.w) * 100).toFixed(4)}%`,
  top: `${((y / ART.h) * 100).toFixed(4)}%`,
  width: `${((w / ART.w) * 100).toFixed(4)}%`,
  height: `${((h / ART.h) * 100).toFixed(4)}%`,
});

// Both of a destination's areas light up together (hover on either).
const ZONE_CLASS =
  "absolute rounded-2xl bg-transparent transition duration-200 ease-out group-hover:bg-white/[0.05] group-hover:shadow-[0_0_0_2px_rgba(91,155,255,0.55),0_0_28px_6px_rgba(91,155,255,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light";

// Reusing the same locked artwork for another hub (e.g. My Profile) only
// ever changes these three things — never the art, geometry or mascot.
export function BarberDashboardScene({
  heading = "Barber Dashboard",
  navLabel = "Barber dashboard",
  destinations = DESTINATIONS,
  backgroundSrc = DASHBOARD_SRC,
}: {
  heading?: string;
  navLabel?: string;
  destinations?: readonly Destination[];
  /** A relabelled duplicate of the dashboard artwork (same geometry), e.g. My Profile. */
  backgroundSrc?: string;
} = {}) {
  return (
    <main className="relative hidden overflow-hidden sm:block" style={{ height: "100dvh", background: "#040308" }}>
      {/* Only visible where the window is taller than the artwork allows (the pills span its full width): a blurred, dimmed copy of the dashboard, so the room carries on. */}
      <div
        className="absolute -inset-[60px] bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundSrc})`, filter: "blur(36px) brightness(.42) saturate(1.1)" }}
        aria-hidden="true"
      />
      <div className="absolute" style={DASH_STAGE_STYLE}>
        <h1 className="sr-only">{heading}</h1>
        {/* Layer 1 — dashboard artwork. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={backgroundSrc} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full max-w-none select-none" draggable={false} fetchPriority="high" />
        {/* Layer 2 — POLAR, independent of the artwork. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MASCOT_SRC} alt="" aria-hidden="true" className="pointer-events-none absolute max-w-none select-none" style={artPct([MASCOT.left, MASCOT.top, MASCOT.width, MASCOT.height])} draggable={false} data-layer="polar" />
        <nav aria-label={navLabel}>
          {destinations.map(({ href, label, zones }) => (
            <span key={href} className="group contents">
              {zones.map((z, i) => (
                <Link
                  key={i}
                  href={href}
                  aria-label={i === 0 ? label : undefined}
                  aria-hidden={i === 0 ? undefined : true}
                  tabIndex={i === 0 ? undefined : -1}
                  title={label}
                  className={ZONE_CLASS}
                  style={artPct(z)}
                />
              ))}
            </span>
          ))}
        </nav>
      </div>
    </main>
  );
}
