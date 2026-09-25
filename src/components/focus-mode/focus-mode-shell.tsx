"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

// Focus Mode — "the room switches off, the selected feature wakes up".
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

export type FocusAccent = "magenta" | "cyan";

export const ACCENTS: Record<FocusAccent, { hex: string; rgb: string }> = {
  magenta: { hex: "#ff1fb4", rgb: "255,31,180" },
  cyan: { hex: "#22e4ff", rgb: "34,228,255" },
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

// Focus Mode backdrop ("lights off"), shared by every destination.
const FOCUS_ROOM_FILTER = "saturate(0.15) brightness(0.42) blur(2.5px)";
const FOCUS_OVERLAY = "rgba(2,2,5,0.92)";

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
}) {
  const { hex, rgb } = ACCENTS[accent];
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
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 bg-black/40 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const neon = `0 0 10px rgba(${rgb},0.55), inset 0 0 8px rgba(${rgb},0.25)`;

  return (
    <main className={`relative hidden h-[100dvh] overflow-hidden bg-black sm:block ${className ?? ""}`}>
      {/* The POLAR Room, lights OFF. Applied uniformly to the whole room
          layer (never object-by-object): colour is drained and brightness
          cut so no neon label, sign or object can glow through, then a
          near-black overlay leaves only faint silhouettes. Full Screen
          blacks it out completely. */}
      <div aria-hidden="true" className="absolute inset-0" style={{ filter: FOCUS_ROOM_FILTER }}>
        {room}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-[background-color] duration-500"
        style={{ backgroundColor: fullScreen ? "rgba(1,1,3,0.99)" : FOCUS_OVERLAY }}
      />

      {/* Frame wrapper: positions the panel and carries the corner paint,
          which is allowed to spill outside the panel (not clipped). */}
      <div
        className="absolute transition-all duration-300 ease-out"
        style={{ inset: fullScreen ? "0" : "max(6dvh, 28px) max(5vw, 28px)", containerType: "inline-size" }}
      >
        {splatter && !fullScreen && <CornerSplatter splatter={splatter} />}

        <section
          aria-label={id}
          className="absolute inset-0 flex flex-col overflow-hidden"
          style={{
            borderRadius: fullScreen ? 0 : 26,
            border: `3px solid ${fullScreen ? `rgba(${rgb},0.35)` : hex}`,
            background: "linear-gradient(180deg, #0c0510 0%, #07030a 100%)",
            boxShadow: fullScreen
              ? "none"
              : `0 0 22px rgba(${rgb},0.75), 0 0 60px -10px rgba(${rgb},0.6), inset 0 0 0 5px #0a0409, inset 0 0 0 6.5px rgba(${rgb},0.55), inset 0 0 40px -12px rgba(${rgb},0.45)`,
          }}
        >
          <header className="relative flex shrink-0 items-center gap-4 px-7 pb-3 pt-5">
            <div className="flex min-w-0 flex-1 items-center">{heading}</div>
            <button
              type="button"
              onClick={() => setFs(!fullScreen)}
              aria-label={fullScreen ? "Exit full screen" : "Full screen"}
              title={fullScreen ? "Exit full screen (Esc)" : "Full screen"}
              className={`${iconBtn} text-white`}
              style={{ borderColor: hex, boxShadow: neon, outlineColor: hex }}
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
                style={{ borderColor: hex, boxShadow: neon, color: hex, outlineColor: hex }}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </Link>
            )}
          </header>
          <div
            className="mx-7 h-[2px] shrink-0 rounded-full"
            style={{ background: `linear-gradient(90deg, rgba(${rgb},0.9), rgba(${rgb},0.25) 70%, rgba(${rgb},0.6))`, boxShadow: `0 0 8px rgba(${rgb},0.6)` }}
            aria-hidden="true"
          />

          {toolbar && <div className="relative flex shrink-0 flex-wrap items-center gap-3 px-7 pb-3 pt-4">{toolbar}</div>}

          <div className="relative flex min-h-0 flex-1 flex-col px-7 pb-6">{children}</div>
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
