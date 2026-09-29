"use client";

import { useLayoutEffect } from "react";
import Link from "next/link";
import { Barlow_Condensed } from "next/font/google";
import SPEC from "./profile-hub-spec.json";

// MY PROFILE — built to the approved visual master
// (design-masters/my-profile-hub-concept.png). Every position and size
// comes from profile-hub-spec.json, measured from that master by the
// design-masters/tools/my-profile-*.cjs scripts; don't hand-tune it here.
// design-masters/tools/my-profile-fidelity.cjs scores the render against the master.
//
// Layer stack (back → front), all on the 1672 × 941 authored stage:
//   1 room        — profile-room-v1.webp, untouched, positioned 1:1 so POLAR stands centred
//   2 treatment   — CSS fades into the navy base + dimming of the chair beside POLAR
//   3 back-glow   — blue light behind POLAR
//   4 POLAR       — the same untouched file again, clipped to his silhouette matte,
//                   so his original pixels sit above every room treatment
//   5 connectors  — SVG, measured from the master
//   6–8 strips    — CSS panel, frame/splatter art cut from the master, live icon/label/chevron
//   9 title       — official POLAR display lettering at the master's letter height
//  10 ✕           — back to the dashboard
// The hub shows no data; each area holds its own information.

const ui = Barlow_Condensed({ subsets: ["latin"], weight: ["600"] });

const STAGE_W = SPEC.stage.width;
const STAGE_H = SPEC.stage.height;
const BG = "#03060f";
const BG_RGB = "3,6,15";
const rgb = (c: number[]) => `rgb(${c.join(",")})`;
const ICON_C = rgb(SPEC.colours.icon);
const CHEV_C = rgb(SPEC.colours.chevron);
const CYAN = "#1fd6ff";

type Key = keyof typeof SPEC.strips;

const AREAS: { key: Key; label: string; href: string }[] = [
  { key: "details", label: "DETAILS", href: "/dashboard/barber/account/personal-details" },
  { key: "career", label: "CAREER", href: "/dashboard/barber/account/professional-profile" },
  { key: "eportfolio", label: "ePORTFOLIO", href: "/dashboard/barber/account/eportfolio" },
  { key: "analytics", label: "ANALYTICS", href: "/dashboard/barber/calendar/analytics" },
  { key: "settings", label: "SETTINGS", href: "/dashboard/barber/account/settings" },
];

// Outline glyphs drawn to match the master's icons (24-unit grid).
const GLYPHS: Record<Key, React.ReactNode> = {
  details: (
    <>
      <circle cx="12" cy="7" r="4.4" />
      <path d="M3.6 21.2v-.9a6.9 6.9 0 0 1 6.9-6.9h3a6.9 6.9 0 0 1 6.9 6.9v.9z" />
    </>
  ),
  career: (
    <>
      <rect x="2.4" y="6.8" width="19.2" height="14" rx="2" />
      <path d="M8.6 6.8V4.9a1.6 1.6 0 0 1 1.6-1.6h3.6a1.6 1.6 0 0 1 1.6 1.6v1.9M2.4 12.6h8.1M13.5 12.6h8.1" />
      <rect x="10.5" y="11" width="3" height="3.4" rx=".6" />
    </>
  ),
  eportfolio: (
    <>
      <rect x="2.5" y="3.6" width="19" height="16.8" rx="1.6" />
      <circle cx="8.3" cy="8.6" r="1.4" />
      <circle cx="15.9" cy="8.6" r="1.4" />
      <path d="M4.6 18.4l5.4-6.2 3.4 3.8 2.6-2.8 3.6 4.4" />
    </>
  ),
  analytics: (
    <g fill="currentColor" stroke="none">
      <rect x="2.5" y="13" width="4.6" height="9" rx="1.3" />
      <rect x="9.7" y="7.6" width="4.6" height="14.4" rx="1.3" />
      <rect x="16.9" y="2" width="4.6" height="20" rx="1.3" />
    </g>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.3" />
      <path d="M10.3 2.5h3.4l.5 2.6 1.6.7 2.2-1.5 2.4 2.4-1.5 2.2.7 1.6 2.6.5v3.4l-2.6.5-.7 1.6 1.5 2.2-2.4 2.4-2.2-1.5-1.6.7-.5 2.6h-3.4l-.5-2.6-1.6-.7-2.2 1.5-2.4-2.4 1.5-2.2-.7-1.6-2.6-.5v-3.4l2.6-.5.7-1.6-1.5-2.2 2.4-2.4 2.2 1.5 1.6-.7z" />
    </>
  ),
};

const SCALE_STYLE_ID = "profile-hub-scale";
// Uniform "contain" scale, with the stage placed on whole pixels: a half-pixel
// offset (e.g. centring 941 px by 50%) would make the browser resample every layer.
function setScale() {
  const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  const x = Math.round((window.innerWidth - STAGE_W * s) / 2);
  const y = Math.round((window.innerHeight - STAGE_H * s) / 2);
  let el = document.getElementById(SCALE_STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = SCALE_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `:root{--profile-hub-scale:${s};--profile-hub-x:${x}px;--profile-hub-y:${y}px}`;
}

const R = SPEC.room;
const P = SPEC.polar;

export function ProfileView() {
  useLayoutEffect(() => {
    setScale();
    window.addEventListener("resize", setScale);
    return () => window.removeEventListener("resize", setScale);
  }, []);

  return (
    <div id="barber-profile-page">
      <style>{`
        div:has(> #barber-profile-page) > nav { display: none; }
        .ph-stage { position: absolute; left: 0; top: 0; width: ${STAGE_W}px; height: ${STAGE_H}px;
          transform: translate(var(--profile-hub-x, 0px), var(--profile-hub-y, 0px)) scale(var(--profile-hub-scale, 0.8)); transform-origin: 0 0; }
        .ph-abs { position: absolute; max-width: none; pointer-events: none; user-select: none; }
        .ph-polar { background: url(${R.src}) -${P.srcBox.x}px -${P.srcBox.y}px / ${R.width}px ${R.height}px no-repeat;
          -webkit-mask: url(${P.matte}) 0 0 / 100% 100% no-repeat; mask: url(${P.matte}) 0 0 / 100% 100% no-repeat; }
        .ph-strip { position: absolute; display: block; color: #fff; }
        .ph-strip .ph-art { transition: filter .18s ease-out; }
        .ph-strip:hover .ph-art { filter: brightness(1.28) saturate(1.1); }
        .ph-strip:hover .ph-label { text-shadow: 0 0 12px rgba(31,214,255,.55); }
        .ph-strip:focus-visible { outline: 2px solid #fff; outline-offset: 8px; border-radius: 6px; }
        .ph-panel { position: absolute; inset: 3px; background: rgba(0,6,16,.96);
          clip-path: polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px); }
        .ph-label { position: absolute; font-size: 33px; font-weight: 600; line-height: 1; letter-spacing: -1.8px; white-space: nowrap; }
        .ph-x { position: absolute; right: 44px; top: 34px; display: grid; place-items: center; width: 58px; height: 58px; border-radius: 13px;
          border: 2.5px solid ${CYAN}; color: ${CYAN}; background: rgba(3,6,15,0.7);
          box-shadow: 0 0 12px rgba(31,214,255,0.5), inset 0 0 9px rgba(31,214,255,0.22); transition: filter .15s; }
        .ph-x:hover { filter: brightness(1.3); }
        .ph-x:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { .ph-strip .ph-art, .ph-x { transition: none; } }
      `}</style>

      {/* Phone and small tablet — same five areas, simple list. */}
      <main className={`min-h-[100dvh] px-6 py-10 text-white lg:hidden ${ui.className}`} style={{ background: BG }}>
        <div className="flex items-start justify-between gap-4">
          <h1 className="min-w-0">
            <span className="sr-only">My Profile</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SPEC.title.asset} alt="" aria-hidden="true" className="h-auto w-full max-w-[280px]" />
          </h1>
          <Link href="/dashboard/barber" aria-label="Close and return to dashboard" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2" style={{ borderColor: CYAN, color: CYAN }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </Link>
        </div>
        <ul className="mt-8 space-y-3">
          {AREAS.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className="flex items-center gap-4 rounded-xl border-2 px-4 py-3 text-2xl font-semibold" style={{ borderColor: CYAN, background: "rgba(6,11,30,0.9)" }}>
                <Glyph k={a.key} size={34} />
                <span className="flex-1">{a.label}</span>
                <Chevron width={14} height={26} />
              </Link>
            </li>
          ))}
        </ul>
      </main>

      {/* Desktop — the approved master's composition. */}
      <main className={`relative hidden h-[100dvh] overflow-hidden lg:block ${ui.className}`} style={{ background: BG }}>
        <div className="ph-stage">
          {/* 1 room — untouched production scene, positioned (not altered). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={R.src} alt="" aria-hidden="true" className="ph-abs" style={{ left: R.left, top: R.top, width: R.width, height: R.height }} />

          {/* 2 treatment — fade the scene's edges into the navy base; darken the clear zone either side of POLAR (the master's composition). */}
          <div className="ph-abs" aria-hidden="true" style={{ left: R.left, top: 0, width: 170, height: STAGE_H, background: `linear-gradient(to right, ${BG}, rgba(${BG_RGB},0))` }} />
          <div className="ph-abs" aria-hidden="true" style={{ left: R.left, top: R.top, width: R.width, height: 80, background: `linear-gradient(to bottom, ${BG}, rgba(${BG_RGB},0))` }} />
          <div className="ph-abs" aria-hidden="true" style={{ left: R.left, top: R.top + R.height - 84, width: R.width, height: 84, background: `linear-gradient(to top, ${BG}, rgba(${BG_RGB},0))` }} />
          <div className="ph-abs" aria-hidden="true" style={{ left: STAGE_W - 72, top: 0, width: 200, height: STAGE_H, background: `linear-gradient(to right, rgba(${BG_RGB},0), ${BG})` }} />
          <div className="ph-abs" aria-hidden="true" style={{ left: STAGE_W + 128, top: 0, width: R.left + R.width - STAGE_W, height: STAGE_H, background: BG }} />
          <div className="ph-abs" aria-hidden="true" style={{ left: 330, top: 140, width: 520, height: 680, background: `radial-gradient(ellipse at 52% 50%, rgba(${BG_RGB},.9) 0%, rgba(${BG_RGB},.9) 46%, rgba(${BG_RGB},0) 74%)` }} />
          <div className="ph-abs" aria-hidden="true" style={{ left: 880, top: 180, width: 420, height: 600, background: `radial-gradient(ellipse at 45% 50%, rgba(${BG_RGB},.8) 0%, rgba(${BG_RGB},.8) 40%, rgba(${BG_RGB},0) 72%)` }} />

          {/* 3 back-glow — sits under POLAR, so it never tints him. */}
          <div className="ph-abs" aria-hidden="true" style={{ left: P.centreX - 170, top: 170, width: 340, height: 620, background: "radial-gradient(ellipse at 50% 50%, rgba(20,110,255,.2) 0%, rgba(20,110,255,.07) 48%, rgba(20,110,255,0) 70%)" }} />

          {/* 4 POLAR — original pixels, clipped to his silhouette. */}
          <div className="ph-abs ph-polar" aria-hidden="true" style={{ left: R.left + P.srcBox.x, top: R.top + P.srcBox.y, width: P.srcBox.w, height: P.srcBox.h }} />

          {/* 5 connectors */}
          <svg className="ph-abs" width={STAGE_W} height={STAGE_H} style={{ left: 0, top: 0 }} aria-hidden="true">
            <defs>
              <filter id="ph-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>
            {Object.values(SPEC.connectors).map((c, i) => {
              const d = "M" + c.path.map((p) => p.join(" ")).join(" L");
              return (
                <g key={i}>
                  <path d={d} fill="none" stroke={CHEV_C} strokeWidth="6" strokeOpacity=".45" filter="url(#ph-glow)" />
                  <path d={d} fill="none" stroke={CHEV_C} strokeWidth="2.6" />
                  {c.dots.map(([x, y], j) => (
                    <g key={j}>
                      <circle cx={x} cy={y} r="8" fill={CHEV_C} fillOpacity=".5" filter="url(#ph-glow)" />
                      <circle cx={x} cy={y} r="4.8" fill={CHEV_C} />
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>

          {/* 9 title — official POLAR display lettering at the master's letter height. */}
          <h1 className="absolute" style={{ ...SPEC.title.box }}>
            <span className="sr-only">My Profile</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SPEC.title.asset} alt="" aria-hidden="true" width={SPEC.title.box.width} height={SPEC.title.box.height} className="block" />
          </h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SPEC.crown.src} alt="" aria-hidden="true" className="ph-abs" style={{ ...SPEC.crown.box }} />

          {/* 6–8 strips */}
          <nav aria-label="My Profile">
            {AREAS.map((a) => (
              <Strip key={a.key} area={a} />
            ))}
          </nav>

          {/* 10 ✕ */}
          <Link href="/dashboard/barber" aria-label="Close and return to dashboard" title="Back to dashboard" className="ph-x">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </Link>
        </div>
      </main>
    </div>
  );
}

function Glyph({ k, size }: { k: Key; size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ color: ICON_C }} aria-hidden="true">
      {GLYPHS[k]}
    </svg>
  );
}

function Chevron({ width, height }: { width: number; height: number }) {
  return (
    <svg viewBox="0 0 17 31" width={width} height={height} fill="none" stroke={CHEV_C} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l11 12.5L3 28" />
    </svg>
  );
}

// One navigation strip at the master's frame box: dark panel, the master's
// own frame/splatter art, and live icon, label and chevron at measured spots.
function Strip({ area }: { area: (typeof AREAS)[number] }) {
  const s = SPEC.strips[area.key];
  const f = s.frame;
  const [il, it, ir, ib] = s.icon;
  const iconSize = Math.max(ir - il, ib - it) * 1.2;
  const [cl, ct, cr, cb] = s.chevron;
  return (
    <Link href={area.href} className="ph-strip" aria-label={area.label === "ePORTFOLIO" ? "ePortfolio" : area.label.charAt(0) + area.label.slice(1).toLowerCase()} style={{ left: f.left, top: f.top, width: f.right - f.left + 1, height: f.bottom - f.top + 1 }}>
      <span className="ph-panel" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.art.src} alt="" aria-hidden="true" className="ph-abs ph-art" style={{ left: s.art.left - f.left, top: s.art.top - f.top, width: s.art.width, height: s.art.height }} />
      <span className="ph-abs" style={{ left: (il + ir) / 2 - f.left - iconSize / 2, top: (it + ib) / 2 - f.top - iconSize / 2 }}>
        <Glyph k={area.key} size={iconSize} />
      </span>
      <span className="ph-label" style={{ left: s.label[0] - f.left, top: s.label[1] - f.top - 6 }}>
        {area.label}
      </span>
      <span className="ph-abs" style={{ left: cl - f.left, top: ct - f.top }}>
        <Chevron width={cr - cl + 1} height={cb - ct + 1} />
      </span>
    </Link>
  );
}
