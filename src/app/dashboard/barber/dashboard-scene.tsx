import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";

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

/* ------------------------------------------------------------------ */
/* Barber Dashboard home, corridor rebuild (2026-10-04). The owner
   supplied a new plain POLAR Room background (a deeper corridor, not the
   old shallow room) plus four new furniture pieces. Unlike
   BarberDashboardScene above, this is NOT one flattened image: the
   background, the four furniture pieces, the original POLAR/LONDON logo,
   the five nav signs and POLAR are five independent image layers. Only
   the background and the four furniture pieces are new; everything else
   is extracted unmodified from the original furnished master
   (barber-dashboard-master.png) and placed at the SAME artwork-px boxes
   as DESTINATIONS/MASCOT above — nothing moved, only the pixels under it
   changed. This component is used only by the Barber Dashboard Home;
   BarberDashboardScene (and My Profile, which calls it) are untouched. */

const CORRIDOR_BG_SRC = "/dashboard/polar-room/barber-dashboard-corridor.webp";
const LOGO_SRC = "/dashboard/polar-room/polar-logo-wordmark.webp";
const LOGO_BOX: Box = [860, 0, 290, 205];

/* ------------------------------------------------------------------ */
/* Integration refinement (2026-10-04) — ONE switch. Set REFINEMENT_ON to
   false to restore the corridor scene exactly as it shipped on 2026-10-04
   before this pass: original chair size, plain furniture images, no
   shadows/glow/reflections/shade. Every tunable value lives in
   REFINEMENT below, grouped by what it controls. Nothing here touches
   the original image files, BarberDashboardScene, DESTINATIONS, MASCOT,
   LOGO_BOX or the five sign/furniture source boxes above — nothing is
   flattened, and this is additive layers only. */
const REFINEMENT_ON = true;

const REFINEMENT = {
  chairScale: 1.22, // ~20-25% larger, anchored to its own floor contact point
  shade: {
    // Per-asset overlay images: same silhouette (alpha) as the furniture,
    // so the darken never produces a rectangular patch — see
    // design-masters/tools or the generation note in the handoff doc.
    tabletToolbox: "/dashboard/polar-room/furniture-tablet-toolbox-shade.webp",
    chair: "/dashboard/polar-room/furniture-chair-shade.webp",
    toolbox: "/dashboard/polar-room/furniture-toolbox-shade.webp",
  },
  contactShadow: { opacity: 0.5, blur: 5 }, // tight, under wheels/base
  floorShadow: { opacity: 0.22, blur: 20 }, // wide, soft, under the cabinet
  neonSpill: { opacity: 0.13, blur: 26, color: "#1fd6ff" }, // both toolboxes' own blue trim
  chairGlowPool: { opacity: 0.17, blur: 24, color: "#2fd8ff" },
  reflection: { opacity: 0.13, blurPx: 2 }, // faint, faded floor mirror
  calendarBloom: { opacity: 0.26, blur: 7, color: "#ff2ec4" }, // restrained, not heavily blurred
  // Optional, OFF by default — see §5 of the brief: compare only, never
  // ship enabled without separate approval, and never touch the main
  // pink/POLAR/LONDON branding.
  crownDim: { enabled: false, opacity: 0.32, box: [860, 150, 340, 230] as Box },
};

function enlargeFromBottomCenter([x, y, w, h]: Box, scale: number): Box {
  const nw = w * scale, nh = h * scale;
  return [x + w / 2 - nw / 2, y + h - nh, nw, nh];
}

// The chair's pre-refinement box — restored exactly when REFINEMENT_ON
// is false.
const CHAIR_BASE_BOX: Box = [828, 415, 338, 290];
const CHAIR_BOX: Box = REFINEMENT_ON ? enlargeFromBottomCenter(CHAIR_BASE_BOX, REFINEMENT.chairScale) : CHAIR_BASE_BOX;

// Each furniture piece's box is the old object's zone (DESTINATIONS
// zones[1]) with the new asset's own trimmed content fitted inside it —
// width- or height-constrained, whichever keeps it inside the old
// footprint — and floor-aligned to the zone's bottom edge. The chair
// alone uses CHAIR_BOX (enlarged when REFINEMENT_ON, original otherwise);
// everything else is unchanged from the 2026-10-04 corridor build.
const CORRIDOR_FURNITURE: readonly { key: string; src: string; box: Box; shadeSrc?: string }[] = [
  { key: "clients", src: "/dashboard/polar-room/furniture-tablet-toolbox.webp", box: [7, 352, 313, 348], shadeSrc: REFINEMENT_ON ? REFINEMENT.shade.tabletToolbox : undefined },
  { key: "calendar", src: "/dashboard/polar-room/furniture-calendar.webp", box: [387, 259, 273, 246] },
  { key: "workflow", src: "/dashboard/polar-room/furniture-chair.webp", box: CHAIR_BOX, shadeSrc: REFINEMENT_ON ? REFINEMENT.shade.chair : undefined },
  { key: "services", src: "/dashboard/polar-room/furniture-toolbox.webp", box: [1623, 350, 362, 350], shadeSrc: REFINEMENT_ON ? REFINEMENT.shade.toolbox : undefined },
];

// The enlarged chair pushes its floor contact point up; the WORKFLOW MODE
// sign stays exactly where it is (its zones[0] box is untouched), only
// its connector's lower endpoint follows the chair's new top edge.
const CONNECTOR_OVERRIDE: Record<string, { x: number; y: number }> = REFINEMENT_ON
  ? { "/dashboard/barber/shift": { x: CHAIR_BOX[0] + CHAIR_BOX[2] / 2, y: CHAIR_BOX[1] } }
  : {};

/** Contact shadow + floor shadow + blue neon spill for a toolbox-shaped piece. */
function ToolboxFX({ box, fxKey }: { box: Box; fxKey: string }) {
  const [x, y, w, h] = box;
  const cx = x + w / 2, bottom = y + h;
  return (
    <g key={fxKey}>
      <ellipse cx={cx} cy={bottom - h * 0.03} rx={w * 0.58} ry={h * 0.14} fill={REFINEMENT.neonSpill.color} opacity={REFINEMENT.neonSpill.opacity} style={{ filter: `blur(${REFINEMENT.neonSpill.blur}px)` }} />
      <ellipse cx={cx} cy={bottom + h * 0.015} rx={w * 0.62} ry={h * 0.07} fill="#01030a" opacity={REFINEMENT.floorShadow.opacity} style={{ filter: `blur(${REFINEMENT.floorShadow.blur}px)` }} />
      <ellipse cx={cx} cy={bottom} rx={w * 0.4} ry={h * 0.035} fill="#000103" opacity={REFINEMENT.contactShadow.opacity} style={{ filter: `blur(${REFINEMENT.contactShadow.blur}px)` }} />
    </g>
  );
}

/** Contact shadow + soft blue light pool for the chair (its neon ring is part of the asset itself). */
function ChairFX({ box }: { box: Box }) {
  const [x, y, w, h] = box;
  const cx = x + w / 2, bottom = y + h;
  return (
    <g>
      <ellipse cx={cx} cy={bottom - h * 0.04} rx={w * 0.5} ry={h * 0.16} fill={REFINEMENT.chairGlowPool.color} opacity={REFINEMENT.chairGlowPool.opacity} style={{ filter: `blur(${REFINEMENT.chairGlowPool.blur}px)` }} />
      <ellipse cx={cx} cy={bottom + h * 0.01} rx={w * 0.46} ry={h * 0.05} fill="#01030a" opacity={REFINEMENT.floorShadow.opacity} style={{ filter: `blur(${REFINEMENT.floorShadow.blur}px)` }} />
      <ellipse cx={cx} cy={bottom} rx={w * 0.28} ry={h * 0.028} fill="#000103" opacity={REFINEMENT.contactShadow.opacity} style={{ filter: `blur(${REFINEMENT.contactShadow.blur * 0.8}px)` }} />
    </g>
  );
}

/** Restrained pink bloom around the calendar's own border — no shade/shadow/reflection for this piece. */
function CalendarFX({ box }: { box: Box }) {
  const [x, y, w, h] = box;
  const pad = 6;
  return (
    <rect x={x - pad} y={y - pad} width={w + pad * 2} height={h + pad * 2} rx={14} fill="none" stroke={REFINEMENT.calendarBloom.color} strokeWidth={9} opacity={REFINEMENT.calendarBloom.opacity} style={{ filter: `blur(${REFINEMENT.calendarBloom.blur}px)` }} />
  );
}

/** Faint, fading mirror of a furniture piece below its own floor contact line. */
function FloorReflection({ src, box }: { src: string; box: Box }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute max-w-none select-none"
      style={{
        ...artPct(box),
        transform: "scaleY(-1)",
        transformOrigin: "50% 100%",
        opacity: REFINEMENT.reflection.opacity,
        filter: `blur(${REFINEMENT.reflection.blurPx}px)`,
        maskImage: "linear-gradient(to top, rgba(0,0,0,0.85), transparent 62%)",
        WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.85), transparent 62%)",
      }}
    />
  );
}

// The five original pills, extracted from the furnished master at their
// exact DESTINATIONS zones[0] boxes (expanded a few px for a feathered
// edge, so they blend into the new background with no hard crop seam).
const CORRIDOR_SIGNS: readonly { src: string; box: Box; color: string }[] = [
  { src: "/dashboard/polar-room/sign-clients.webp", box: [28, 230, 280, 111], color: "#1fd6ff" },
  { src: "/dashboard/polar-room/sign-calendar.webp", box: [370, 115, 317, 107], color: "#ff2ec4" },
  { src: "/dashboard/polar-room/sign-workflow.webp", box: [851, 209, 316, 105], color: "#1fd6ff" },
  { src: "/dashboard/polar-room/sign-myprofile.webp", box: [1256, 50, 314, 108], color: "#1fd6ff" },
  { src: "/dashboard/polar-room/sign-services.webp", box: [1662, 209, 348, 116], color: "#ff2ec4" },
];

export function BarberDashboardCorridorScene() {
  return (
    <main className="relative hidden overflow-hidden sm:block" style={{ height: "100dvh", background: "#040308" }}>
      {/* Background — its own full-bleed cover-fit layer, independent of
          the interactive stage below, so it always fills the window with
          no letterboxed/blurred bands, whatever happens to the stage. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={CORRIDOR_BG_SRC} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover select-none" draggable={false} fetchPriority="high" />

      <div className="absolute" style={DASH_STAGE_STYLE}>
        <h1 className="sr-only">Barber Dashboard</h1>

        {/* Optional, OFF by default: a local dim over the rear blue LED
            crown only, for a reversible before/after comparison. Never
            touches the pink POLAR/LONDON branding. */}
        {REFINEMENT_ON && REFINEMENT.crownDim.enabled && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{ ...artPct(REFINEMENT.crownDim.box), background: `radial-gradient(ellipse at center, rgba(0,0,0,${REFINEMENT.crownDim.opacity}), transparent 70%)` }}
          />
        )}

        {/* Shadows, floor shadows, neon spill and calendar bloom — above
            the room, underneath the furniture that casts them. Positioned
            from each piece's own box, so they stay put as the viewport
            changes, same as everything else on this stage. */}
        {REFINEMENT_ON && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${ART.w} ${ART.h}`} preserveAspectRatio="none" aria-hidden="true">
            <CalendarFX box={CORRIDOR_FURNITURE[1].box} />
            <ToolboxFX box={CORRIDOR_FURNITURE[0].box} fxKey="clients-fx" />
            <ToolboxFX box={CORRIDOR_FURNITURE[3].box} fxKey="services-fx" />
            <ChairFX box={CHAIR_BOX} />
          </svg>
        )}

        {/* Faint floor reflections — tablet toolbox, chair, services
            toolbox only (not the calendar, a wall-mounted panel). */}
        {REFINEMENT_ON && (
          <>
            <FloorReflection src={CORRIDOR_FURNITURE[0].src} box={CORRIDOR_FURNITURE[0].box} />
            <FloorReflection src={CORRIDOR_FURNITURE[2].src} box={CHAIR_BOX} />
            <FloorReflection src={CORRIDOR_FURNITURE[3].src} box={CORRIDOR_FURNITURE[3].box} />
          </>
        )}

        {/* Furniture — the four new pieces, each its own layer, each with
            an optional per-asset shade overlay (same silhouette, so it
            only ever darkens the furniture itself — see REFINEMENT.shade). */}
        {CORRIDOR_FURNITURE.map((f) => (
          <Fragment key={f.src}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.src} alt="" aria-hidden="true" className="pointer-events-none absolute max-w-none select-none" style={artPct(f.box)} draggable={false} />
            {REFINEMENT_ON && f.shadeSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.shadeSrc} alt="" aria-hidden="true" className="pointer-events-none absolute max-w-none select-none" style={artPct(f.box)} draggable={false} />
            )}
          </Fragment>
        ))}

        {/* The original POLAR/LONDON logo, unchanged position and size. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_SRC} alt="" aria-hidden="true" className="pointer-events-none absolute max-w-none select-none" style={artPct(LOGO_BOX)} draggable={false} />

        {/* POLAR — unchanged layer, position and size. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MASCOT_SRC} alt="" aria-hidden="true" className="pointer-events-none absolute max-w-none select-none" style={artPct([MASCOT.left, MASCOT.top, MASCOT.width, MASCOT.height])} draggable={false} data-layer="polar" />

        {/* The five nav signs, each its own layer at its original box. */}
        {CORRIDOR_SIGNS.map((s) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s.src} src={s.src} alt="" aria-hidden="true" className="pointer-events-none absolute max-w-none select-none" style={artPct(s.box)} draggable={false} />
        ))}

        {/* Connector stub + dot from each sign down to its object — the
            originals can't be cleanly lifted off the old furnished master
            (they sit over ambient light bleed, not a clean backdrop), so
            these are redrawn in the same short-stub style and each
            sign's own neon colour. */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${ART.w} ${ART.h}`} preserveAspectRatio="none" aria-hidden="true">
          {DESTINATIONS.map((d, i) => {
            const [sx, sy, sw, sh] = d.zones[0];
            const [ox, oy, ow] = d.zones[1];
            const override = CONNECTOR_OVERRIDE[d.href];
            const x1 = sx + sw / 2, y1 = sy + sh;
            const x2 = override ? override.x : ox + ow / 2;
            const y2 = override ? override.y : oy;
            const color = CORRIDOR_SIGNS[i].color;
            return (
              <g key={d.href}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={3} opacity={0.55} />
                <circle cx={x2} cy={y2} r={5} fill={color} />
                <circle cx={x2} cy={y2} r={2.5} fill="#fff" />
              </g>
            );
          })}
        </svg>

        <nav aria-label="Barber dashboard">
          {DESTINATIONS.map(({ href, label, zones }) => (
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
