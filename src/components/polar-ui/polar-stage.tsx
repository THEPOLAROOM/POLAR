"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";

// POLAR Barber UI stage — the approved CALENDAR-UI master system.
//
// The page is authored at the master's native canvas (1672 × 941 CSS
// px) and the whole stage is scaled uniformly to fit the viewport, so
// every control, font and grid line keeps the master's exact geometry
// at any screen size. The frame, paint drips and page artwork come
// from a "chrome" layer cut from the master itself (navy-tinted, with
// holes where live UI sits); everything interactive is real HTML.
//
// Two exits, as before: ⛶ / Esc toggles Full Screen (remembered for
// the tab); ✕ leaves the feature.

export const POLAR = {
  navy: "#060b1e",
  pink: "#fd12c8",
  pinkRgb: "253,18,200",
  cyan: "#1fd6ff",
  cyanRgb: "31,214,255",
  grid: "#be0676",
  gridStrong: "#e0098a",
} as const;

export const STAGE_W = 1672;
export const STAGE_H = 941;

type Box = [x: number, y: number, w: number, h: number];

const storageKey = (id: string) => `polar-focus-fullscreen:${id}`;
// The live scale lives in its own <style> in <head>, outside React's tree.
const SCALE_STYLE_ID = "polar-stage-scale";

function setStageScale(s: number) {
  let el = document.getElementById(SCALE_STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = SCALE_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `:root{--polar-stage-scale:${s}}`;
}
// Share of the viewport the stage fills in normal Focus Mode / Full Screen.
const FIT = { normal: 0.97, full: 1 };

function fitScale(full: boolean) {
  const f = full ? FIT.full : FIT.normal;
  return Math.min((window.innerWidth * f) / STAGE_W, (window.innerHeight * f) / STAGE_H);
}

export function PolarStage({
  id,
  chromeSrc,
  room,
  body = [97, 86, 1488, 784],
  fullScreenBox = [1367, 112, 78, 77],
  closeBox = [1470, 112, 78, 77],
  backHref = "/dashboard/barber",
  className,
  children,
}: {
  /** Stable feature id — scopes the Full Screen memory. */
  id: string;
  /** Navy-tinted chrome cut from the master (frame, drips, page artwork). */
  chromeSrc: string;
  /** The room behind the stage, normally <BarberRoom decorative />. */
  room: React.ReactNode;
  /** The panel body under the chrome, in native px. */
  body?: Box;
  fullScreenBox?: Box;
  closeBox?: Box;
  backHref?: string;
  className?: string;
  /** Stage content, absolutely positioned in native master px. */
  children: React.ReactNode;
}) {
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

  // Scale to the viewport before paint, and on every resize.
  useLayoutEffect(() => {
    const apply = () => setStageScale(fitScale(fullScreen));
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [fullScreen]);

  useEffect(() => {
    if (!fullScreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) setFs(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullScreen, setFs]);

  const at = ([x, y, w, h]: Box): React.CSSProperties => ({ position: "absolute", left: x, top: y, width: w, height: h });

  return (
    <main className={`polar-stage-root relative hidden h-[100dvh] overflow-hidden sm:block ${className ?? ""}`} style={{ background: POLAR.navy }}>
      {/* Initial scale on first paint (server HTML), before hydration. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var f=sessionStorage.getItem(${JSON.stringify(storageKey(id))})==="1"?${FIT.full}:${FIT.normal};var s=Math.min(innerWidth*f/${STAGE_W},innerHeight*f/${STAGE_H});var el=document.getElementById("${SCALE_STYLE_ID}")||document.head.appendChild(Object.assign(document.createElement("style"),{id:"${SCALE_STYLE_ID}"}));el.textContent=":root{--polar-stage-scale:"+s+"}"}catch(e){}})();`,
        }}
      />
      <style>{STAGE_CSS}</style>

      {/* The POLAR Room, lights off, under a deep-navy night. */}
      <div aria-hidden="true" className="absolute inset-0" style={{ filter: "saturate(0.15) brightness(0.4) blur(2.5px)" }}>
        {room}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-[background-color] duration-500"
        style={{ backgroundColor: fullScreen ? "rgba(3,6,18,0.995)" : "rgba(3,6,18,0.9)" }}
      />

      <div className="polar-stage" style={{ width: STAGE_W, height: STAGE_H }}>
        <div aria-hidden="true" style={{ ...at(body), borderRadius: 44, background: POLAR.navy }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={chromeSrc} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute inset-0 select-none" width={STAGE_W} height={STAGE_H} />

        <button
          type="button"
          onClick={() => setFs(!fullScreen)}
          aria-label={fullScreen ? "Exit full screen" : "Full screen"}
          title={fullScreen ? "Exit full screen (Esc)" : "Full screen"}
          className="polar-icon-btn text-white"
          style={at(fullScreenBox)}
        >
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square" aria-hidden="true">
            {fullScreen ? <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" /> : <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />}
          </svg>
        </button>
        <Link href={backHref} aria-label="Close and return to dashboard" title="Back to dashboard" className="polar-icon-btn" style={{ ...at(closeBox), color: POLAR.pink }}>
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </Link>

        {children}
      </div>
    </main>
  );
}

const STAGE_CSS = `
.polar-stage {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%) scale(var(--polar-stage-scale, 0.8));
  transform-origin: 50% 50%;
}
.polar-icon-btn {
  display: grid; place-items: center; border-radius: 13px;
  border: 2.5px solid ${POLAR.pink}; background: ${POLAR.navy};
  box-shadow: 0 0 12px rgba(${POLAR.pinkRgb},0.6), inset 0 0 9px rgba(${POLAR.pinkRgb},0.28);
  transition: filter .15s, background-color .15s;
}
.polar-icon-btn:hover { filter: brightness(1.25); background-color: #0b1330; }
.polar-stage-root :focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.polar-stage-root ::selection { background: rgba(${POLAR.pinkRgb},0.45); color: #fff; }
.polar-stage-root * { scrollbar-width: thin; scrollbar-color: rgba(${POLAR.pinkRgb},0.7) transparent; }
`;
