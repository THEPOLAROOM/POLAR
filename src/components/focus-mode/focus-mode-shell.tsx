"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

// Focus Mode — "the room switches off, the selected feature wakes up".
// Restyled to the approved CALENDAR-UI master system (see PRODUCT.md):
// the panel frame, corner paint and drips are the master's own artwork,
// applied as a 9-slice that scales with the panel; POLAR navy base,
// hot-pink neon. Behaviour and API are unchanged.
// Reusable shell for the Barber Dashboard's five destinations: the
// exact same POLAR Room (passed in as `room`, drawn with the dashboard's
// own crop behaviour) sits underneath a very strong dark overlay so it
// survives only as faint silhouettes, and ONE large neon-framed panel
// holds the feature itself. Calendar uses the magenta accent; Clients /
// Workflow Mode / My Profile use cyan; My Services uses magenta.
//
// Two separate exits, by design:
//   ⛶ / Esc  → leave Full Screen, back to normal Focus Mode
//   ✕ Back   → leave the feature, back to the master dashboard

export type FocusAccent = "magenta" | "cyan" | "blue";

export const ACCENTS: Record<FocusAccent, { hex: string; rgb: string }> = {
  // POLAR Barber hot pink (the master's neon) and selective cyan.
  magenta: { hex: "#fd12c8", rgb: "253,18,200" },
  cyan: { hex: "#1fd6ff", rgb: "31,214,255" },
  // POLAR electric blue — Clients / Workflow Mode / My Profile.
  blue: { hex: "#1e7bff", rgb: "30,123,255" },
};

/** Paint splatter for the four frame corners: transparent WebP pieces
 *  (paint only — no text, no UI) anchored so the frame corner sits at
 *  `corner` px inside each piece. Sized in cqw of the panel so they
 *  scale with it and never distort. */
export type FrameSplatter = {
  src: { tl: string; tr: string; bl: string; br: string };
  /** Native piece size (px). */
  size: [number, number];
  /** Frame-corner position inside each piece (native px). */
  corner: { tl: [number, number]; tr: [number, number]; bl: [number, number]; br: [number, number] };
  /** Native frame width the pieces were cut against, for scaling. */
  frameWidth: number;
};

// POLAR navy panel base (never black).
const NAVY = "#060b1e";
const PINK = ACCENTS.magenta;

// The master's frame ring (1672 × 941, panel body at 97,86 → 1585,870).
// Sizes below are master px, expressed in cqw of the panel so the art
// scales with the panel instead of distorting.
const FRAME_SRC = "/dashboard/polar-ui/polar-frame.webp";
const BODY_W = 1488;
const cq = (px: number) => `${((px / BODY_W) * 100).toFixed(4)}cqw`;
const FRAME_STYLE: React.CSSProperties = {
  borderStyle: "solid",
  borderWidth: 0,
  borderImageSource: `url(${FRAME_SRC})`,
  borderImageSlice: "130 340 120 340",
  borderImageWidth: `${cq(130)} ${cq(340)} ${cq(120)} ${cq(340)}`,
  borderImageOutset: `${cq(86)} ${cq(87)} ${cq(71)} ${cq(97)}`,
  borderImageRepeat: "stretch",
};

// The master's header bar (dark bar + neon rails), 3-sliced so its ends keep their shape.
const HEADER_BAR_STYLE: React.CSSProperties = {
  borderStyle: "solid",
  borderWidth: 0,
  borderImageSource: "url(/dashboard/polar-ui/polar-header-bar.webp)",
  borderImageSlice: "0 40 0 40 fill",
  borderImageWidth: `0 ${cq(40)} 0 ${cq(40)}`,
  borderImageRepeat: "stretch",
};

// Focus Mode backdrop ("lights off" under a deep-navy night).
const FOCUS_ROOM_FILTER = "saturate(0.15) brightness(0.4) blur(2.5px)";
const FOCUS_OVERLAY = "rgba(3,6,18,0.9)";

// Full Screen is remembered for the browser tab so it survives the
// feature's own in-page navigation (e.g. Calendar's view/date links).
const storageKey = (id: string) => `polar-focus-fullscreen:${id}`;

export function FocusModeShell({
  id,
  accent,
  room,
  heading,
  toolbar,
  splatter,
  className,
  children,
  backHref = "/dashboard/barber",
  backdrop = "off",
  frameInset = "max(6dvh, 28px) max(5vw, 28px)",
}: {
  /** Stable feature id, e.g. "calendar" — scopes the Full Screen memory. */
  id: string;
  accent: FocusAccent;
  /** The darkened background, normally <BarberRoom decorative />. */
  room: React.ReactNode;
  /** Title row content (left), before the ⛶ / ✕ buttons. */
  heading: React.ReactNode;
  /** Optional second header row for the feature's own controls. */
  toolbar?: React.ReactNode;
  splatter?: FrameSplatter;
  /** Extra classes on the <main> (e.g. a font). */
  className?: string;
  children: React.ReactNode;
  backHref?: string;
  /** "off" (default): room powered down. "lit": the room is a dedicated
   *  scene for this feature and stays lit (e.g. My Profile with POLAR). */
  backdrop?: "off" | "lit";
  /** Panel position in normal Focus Mode (CSS inset). Default: centred ~90%. */
  frameInset?: string;
}) {
  // Every destination now wears the master's pink frame; `accent` is kept for API compatibility.
  void accent;
  const { hex, rgb } = PINK;
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    try {
      setFullScreen(sessionStorage.getItem(storageKey(id)) === "1");
    } catch {}
  }, [id]);

  const setFs = useCallback(
    (next: boolean) => {
      setFullScreen(next);
      try {
        sessionStorage.setItem(storageKey(id), next ? "1" : "0");
      } catch {}
    },
    [id]
  );

  useEffect(() => {
    if (!fullScreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) setFs(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullScreen, setFs]);

  const iconBtn =
    "flex h-14 w-14 shrink-0 items-center justify-center rounded-[13px] border-[2.5px] transition hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const neon = `0 0 12px rgba(${rgb},0.6), inset 0 0 9px rgba(${rgb},0.28)`;

  return (
    <main className={`relative hidden h-[100dvh] overflow-hidden sm:block ${className ?? ""}`} style={{ background: NAVY }}>
      {/* The POLAR Room, lights OFF. Applied uniformly to the whole room
          layer (never object-by-object): colour is drained and brightness
          cut so no neon label, sign or object can glow through, then a
          near-black overlay leaves only faint silhouettes. Full Screen
          blacks it out completely. */}
      <div aria-hidden="true" className="absolute inset-0" style={{ filter: backdrop === "off" ? FOCUS_ROOM_FILTER : undefined }}>
        {room}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-[background-color] duration-500"
        style={{ backgroundColor: fullScreen ? "rgba(3,6,18,0.995)" : backdrop === "off" ? FOCUS_OVERLAY : "transparent" }}
      />

      {/* Frame wrapper: positions the panel and carries the corner paint,
          which is allowed to spill outside the panel (not clipped). */}
      <div
        className="absolute transition-all duration-300 ease-out"
        style={{ inset: fullScreen ? "0" : frameInset, containerType: "inline-size" }}
      >
        {/* The master's frame now carries the corner paint; per-page splatter is retired. */}
        {splatter && null}

        <section
          aria-label={id}
          className="absolute inset-0 flex flex-col overflow-hidden"
          style={
            fullScreen
              ? { borderRadius: 0, border: `2px solid rgba(${rgb},0.4)`, background: NAVY }
              : { ...FRAME_STYLE, borderRadius: cq(44), background: NAVY, overflow: "visible" }
          }
        >
          {!fullScreen && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/dashboard/polar-ui/polar-header-drips.webp" alt="" aria-hidden="true" className="pointer-events-none absolute select-none" style={{ right: cq(233), top: cq(20), width: cq(130) }} />
          )}
          <header
            className="relative flex shrink-0 items-center gap-4 px-8 pb-4 pt-4"
            style={fullScreen ? undefined : { ...HEADER_BAR_STYLE, margin: `${cq(20)} ${cq(15)} ${cq(4)} ${cq(21)}` }}
          >
            <div className="flex min-w-0 flex-1 items-center">{heading}</div>
            <button
              type="button"
              onClick={() => setFs(!fullScreen)}
              aria-label={fullScreen ? "Exit full screen" : "Full screen"}
              title={fullScreen ? "Exit full screen (Esc)" : "Full screen"}
              className={`${iconBtn} text-white`}
              style={{ borderColor: hex, boxShadow: neon, outlineColor: hex, background: NAVY }}
            >
              {fullScreen ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                </svg>
              )}
            </button>
            {!fullScreen && (
              <Link
                href={backHref}
                aria-label="Close and return to dashboard"
                title="Back to dashboard"
                className={iconBtn}
                style={{ borderColor: hex, boxShadow: neon, color: hex, outlineColor: hex, background: NAVY }}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </Link>
            )}
          </header>
          <div
            className={`mx-8 h-[2px] shrink-0 rounded-full ${fullScreen ? "" : "hidden"}`}
            style={{ background: hex, boxShadow: `0 0 8px rgba(${rgb},0.7)` }}
            aria-hidden="true"
          />

          {toolbar && <div className="relative flex shrink-0 flex-wrap items-center gap-3 px-8 pb-3 pt-4">{toolbar}</div>}

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-8 pb-7">{children}</div>
        </section>
      </div>
    </main>
  );
}

function CornerSplatter({ splatter }: { splatter: FrameSplatter }) {
  const { src, size, corner, frameWidth } = splatter;
  const u = (n: number) => `${((n / frameWidth) * 100).toFixed(3)}cqw`;
  // Each piece fades out towards the frame so no straight cut edge shows.
  const fade = (at: string) => {
    const m = `radial-gradient(ellipse 85% 85% at ${at}, #000 40%, transparent 78%)`;
    return { maskImage: m, WebkitMaskImage: m };
  };
  const common = { width: u(size[0]), height: u(size[1]) };
  /* eslint-disable @next/next/no-img-element */
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <img src={src.tl} alt="" className="absolute" style={{ ...common, ...fade("0% 0%"), left: u(-corner.tl[0]), top: u(-corner.tl[1]) }} />
      <img src={src.tr} alt="" className="absolute" style={{ ...common, ...fade("100% 0%"), right: u(-(size[0] - corner.tr[0])), top: u(-corner.tr[1]) }} />
      <img src={src.bl} alt="" className="absolute" style={{ ...common, ...fade("0% 100%"), left: u(-corner.bl[0]), bottom: u(-(size[1] - corner.bl[1])) }} />
      <img src={src.br} alt="" className="absolute" style={{ ...common, ...fade("100% 100%"), right: u(-(size[0] - corner.br[0])), bottom: u(-(size[1] - corner.br[1])) }} />
    </div>
  );
  /* eslint-enable @next/next/no-img-element */
}
