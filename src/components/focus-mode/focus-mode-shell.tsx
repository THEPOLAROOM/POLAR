"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Nunito_Sans, Rubik_Wet_Paint } from "next/font/google";

// Focus Mode — "the room switches off, the selected feature wakes up".
// Reusable shell for the Barber Dashboard's five destinations: the
// exact same POLAR Room (passed in as `room`, drawn with the dashboard's
// own crop behaviour) sits underneath a very strong dark overlay so it
// survives only as faint silhouettes, and ONE large glowing panel holds
// the feature itself. Calendar uses the magenta accent; Clients /
// Workflow Mode / My Profile use cyan; My Services uses magenta.
//
// Two separate exits, by design:
//   ⛶ / Esc  → leave Full Screen, back to normal Focus Mode
//   ✕ Back   → leave the feature, back to the master dashboard

const body = Nunito_Sans({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });
// POLAR graffiti/drip identity for the feature title.
export const dripFont = Rubik_Wet_Paint({ subsets: ["latin"], weight: "400" });

export type FocusAccent = "magenta" | "cyan";

export const ACCENTS: Record<FocusAccent, { hex: string; rgb: string }> = {
  magenta: { hex: "#ff3d9a", rgb: "255,61,154" },
  cyan: { hex: "#22e4ff", rgb: "34,228,255" },
};

// Full Screen is remembered for the browser tab so it survives the
// feature's own in-page navigation (e.g. Calendar's view/date links).
const storageKey = (id: string) => `polar-focus-fullscreen:${id}`;

function Splatter({ rgb, flip = false }: { rgb: string; flip?: boolean }) {
  // Subtle paint splatter + drips hanging off a top corner of the frame.
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 90"
      className="pointer-events-none absolute top-0 h-[44px] w-[80px]"
      style={{ [flip ? "right" : "left"]: flip ? 110 : 18, transform: flip ? "scaleX(-1)" : undefined, opacity: 0.55 }}
    >
      <g fill={`rgb(${rgb})`}>
        <path d="M6 0h70c-4 6-9 8-15 9-3 1-4 4-4 9v26c0 4-2 6-4 6s-4-2-4-6V22c0-3-2-4-4-4s-4 1-4 4v10c0 3-2 5-4 5s-4-2-4-5V14c0-3-3-5-8-5C12 8 8 5 6 0z" />
        <circle cx="92" cy="8" r="3.5" />
        <circle cx="104" cy="15" r="2" />
        <circle cx="84" cy="22" r="1.6" />
        <circle cx="118" cy="6" r="1.4" />
        <circle cx="70" cy="30" r="1.8" />
      </g>
    </svg>
  );
}

export function FocusModeShell({
  id,
  accent,
  room,
  title,
  controls,
  children,
  backHref = "/dashboard/barber",
}: {
  /** Stable feature id, e.g. "calendar" — scopes the Full Screen memory. */
  id: string;
  accent: FocusAccent;
  /** The darkened background, normally <BarberRoom decorative />. */
  room: React.ReactNode;
  title: React.ReactNode;
  /** Feature controls rendered in the panel header, before ⛶ / ✕. */
  controls?: React.ReactNode;
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
    "flex h-9 w-9 items-center justify-center rounded-lg border text-white/75 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  return (
    <main className={`${body.className} relative hidden h-[100dvh] overflow-hidden bg-black sm:block`}>
      {/* The POLAR Room, lights off: still recognisable as silhouettes in
          Focus Mode, almost fully blacked out in Full Screen. */}
      {room}
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-[background-color] duration-500"
        style={{ backgroundColor: fullScreen ? "rgba(2,2,6,0.97)" : "rgba(2,2,8,0.88)" }}
      />

      <section
        aria-label={typeof title === "string" ? title : undefined}
        className="absolute flex flex-col overflow-hidden border transition-all duration-300 ease-out"
        style={{
          inset: fullScreen ? "0" : "max(6dvh, 16px) max(5vw, 16px)",
          borderRadius: fullScreen ? 0 : 22,
          borderColor: fullScreen ? `rgba(${rgb},0.35)` : `rgba(${rgb},0.75)`,
          background: "linear-gradient(180deg, rgba(10,6,18,0.92) 0%, rgba(4,4,12,0.95) 100%)",
          backdropFilter: "blur(6px)",
          boxShadow: fullScreen
            ? "none"
            : `0 0 0 1px rgba(${rgb},0.15), 0 0 38px -8px rgba(${rgb},0.55), inset 0 0 60px -30px rgba(${rgb},0.35)`,
        }}
      >
        {!fullScreen && (
          <>
            <Splatter rgb={rgb} />
            <Splatter rgb={rgb} flip />
          </>
        )}

        <header className="relative flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3 px-6 pb-4 pt-5">
          <div className={`${dripFont.className} leading-none`} style={{ fontSize: "clamp(28px, 2.6vw, 44px)", color: hex, textShadow: `0 0 16px rgba(${rgb},0.55)` }}>
            {title}
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-3">{controls}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFs(!fullScreen)}
              aria-label={fullScreen ? "Exit full screen" : "Full screen"}
              title={fullScreen ? "Exit full screen (Esc)" : "Full screen"}
              className={iconBtn}
              style={{ borderColor: `rgba(${rgb},0.4)`, outlineColor: hex }}
            >
              {fullScreen ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                style={{ borderColor: "rgba(255,255,255,0.14)", outlineColor: hex }}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </Link>
            )}
          </div>
        </header>
        <div className="mx-6 h-px shrink-0" style={{ background: `linear-gradient(90deg, rgba(${rgb},0.5), rgba(${rgb},0.08))` }} aria-hidden="true" />

        <div className="relative flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">{children}</div>
      </section>
    </main>
  );
}
