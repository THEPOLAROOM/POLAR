"use client";

import { useLayoutEffect } from "react";
import Link from "next/link";
import { Barlow_Condensed } from "next/font/google";

// MY PROFILE — POLAR's profile world (desktop): the production POLAR
// profile scene after closing time (profile-hub-room.webp, baked from
// profile-room-v1.webp: room dark, POLAR centred and lit), the MY PROFILE
// title in the official POLAR display lettering, and five compact
// navigation controls around him. The hub shows no data; each area holds
// its own information:
//   DETAILS    → personal/account information (name, phone, addresses)
//   CAREER     → the POLAR CV (experience, qualifications, achievements)
//   ePORTFOLIO → the barber's work
//   ANALYTICS  → Smart Analytics
//   SETTINGS   → account controls (signed-in account, log out)
// Authored at the native 1672 × 941 canvas and scaled to fit.

const ui = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"] });

const STAGE_W = 1672;
const STAGE_H = 941;
const CYAN = "#1fd6ff";
const CYAN_RGB = "31,214,255";
const BG = "#03060f";

type Area = { label: string; href: string; icon: React.ReactNode; place: React.CSSProperties; corner: "tl" | "tr" | "bl" | "br" };

const ICON = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const AREAS: Area[] = [
  {
    label: "Details",
    href: "/dashboard/barber/account/personal-details",
    icon: ICON(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>),
    place: { right: STAGE_W - 545, top: 262 },
    corner: "bl",
  },
  {
    label: "Career",
    href: "/dashboard/barber/account/professional-profile",
    icon: ICON(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M3 12.5h18" /></>),
    place: { left: 1122, top: 262 },
    corner: "tr",
  },
  {
    label: "ePortfolio",
    href: "/dashboard/barber/account/eportfolio",
    icon: ICON(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 8" /></>),
    place: { right: STAGE_W - 565, top: 562 },
    corner: "tl",
  },
  {
    label: "Analytics",
    href: "/dashboard/barber/calendar/analytics",
    icon: ICON(<><path d="M5 20v-6M10 20V10M15 20v-9M20 20V5" strokeWidth="2.6" /></>),
    place: { left: 1108, top: 562 },
    corner: "br",
  },
  {
    label: "Settings",
    href: "/dashboard/barber/account/settings",
    icon: ICON(<><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>),
    place: { left: STAGE_W / 2, top: 808, transform: "translateX(-50%)" },
    corner: "tr",
  },
];

// Connectors: thin, straight, 90° turns; every line stops well clear of
// POLAR (his silhouette spans x ≈ 716–956, y ≈ 203–760 on the stage).
const CONNECTORS: { d: string; end: [number, number] }[] = [
  { d: "M553 303 H620 V372 H660", end: [660, 372] },
  { d: "M1114 303 H1050 V372 H1012", end: [1012, 372] },
  { d: "M573 603 H630 V492 H662", end: [662, 492] },
  { d: "M1100 603 H1044 V492 H1010", end: [1010, 492] },
  { d: "M836 800 V784", end: [836, 784] },
];

const SCALE_STYLE_ID = "profile-hub-scale";
function setScale() {
  const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  let el = document.getElementById(SCALE_STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = SCALE_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `:root{--profile-hub-scale:${s}}`;
}

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
        .ph-stage { position: absolute; left: 50%; top: 50%; width: ${STAGE_W}px; height: ${STAGE_H}px;
          transform: translate(-50%, -50%) scale(var(--profile-hub-scale, 0.8)); transform-origin: 50% 50%; }
        .ph-btn { position: absolute; display: flex; align-items: stretch; height: 74px; color: #fff;
          filter: drop-shadow(0 0 10px rgba(${CYAN_RGB},0.45)); transition: filter .18s ease-out; }
        .ph-btn:hover { filter: drop-shadow(0 0 16px rgba(${CYAN_RGB},0.8)) brightness(1.12); }
        .ph-btn:focus-visible { outline: 2px solid #fff; outline-offset: 6px; }
        .ph-shape { --c: 14px; clip-path: polygon(var(--c) 0, calc(100% - var(--c)) 0, 100% var(--c), 100% calc(100% - var(--c)), calc(100% - var(--c)) 100%, var(--c) 100%, 0 calc(100% - var(--c)), 0 var(--c)); }
        .ph-x { position: absolute; right: 44px; top: 34px; display: grid; place-items: center; width: 58px; height: 58px; border-radius: 13px;
          border: 2.5px solid ${CYAN}; color: ${CYAN}; background: rgba(3,6,15,0.7);
          box-shadow: 0 0 12px rgba(${CYAN_RGB},0.5), inset 0 0 9px rgba(${CYAN_RGB},0.22); transition: filter .15s; }
        .ph-x:hover { filter: brightness(1.3); }
        .ph-x:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
      `}</style>

      {/* Phone — same five areas, simple list. */}
      <main className={`min-h-[100dvh] px-6 py-10 text-white sm:hidden ${ui.className}`} style={{ background: BG }}>
        <div className="flex items-start justify-between gap-4">
          <h1 className="min-w-0">
            <span className="sr-only">My Profile</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dashboard/polar-ui/profile-title.webp" alt="" aria-hidden="true" className="h-auto w-full max-w-[280px]" />
          </h1>
          <Link href="/dashboard/barber" aria-label="Close and return to dashboard" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2" style={{ borderColor: CYAN, color: CYAN }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </Link>
        </div>
        <ul className="mt-8 space-y-3">
          {AREAS.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className="flex items-center gap-4 rounded-xl border-2 px-4 py-3 text-2xl font-bold" style={{ borderColor: CYAN, background: "rgba(6,11,30,0.9)" }}>
                <span style={{ color: CYAN }}>{a.icon}</span>
                <span className="flex-1">{displayLabel(a.label)}</span>
                <Chevron />
              </Link>
            </li>
          ))}
        </ul>
      </main>

      {/* Desktop — POLAR's profile world. */}
      <main className={`relative hidden h-[100dvh] overflow-hidden sm:block ${ui.className}`} style={{ background: BG }}>
        <div className="ph-stage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dashboard/polar-ui/profile-hub-room.webp" alt="" aria-hidden="true" width={STAGE_W} height={STAGE_H} className="pointer-events-none absolute inset-0 select-none" />

          {/* Title — official POLAR display lettering (the only place it appears here). */}
          <h1 className="absolute" style={{ left: 424, top: 36, width: 732, height: 135 }}>
            <span className="sr-only">My Profile</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dashboard/polar-ui/profile-title.webp" alt="" aria-hidden="true" width={732} height={135} className="block" />
          </h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dashboard/polar-ui/clients-crown.webp" alt="" aria-hidden="true" className="absolute" style={{ left: 1164, top: 62 }} width={74} height={65} />

          {/* Connectors — restrained cyan, stop clear of POLAR. */}
          <svg className="pointer-events-none absolute inset-0" width={STAGE_W} height={STAGE_H} aria-hidden="true">
            {CONNECTORS.map((c, i) => (
              <g key={i}>
                <path d={c.d} fill="none" stroke={CYAN} strokeOpacity="0.7" strokeWidth="2" />
                <circle cx={c.end[0]} cy={c.end[1]} r="4.5" fill={CYAN} fillOpacity="0.85" />
              </g>
            ))}
          </svg>

          <nav aria-label="My Profile">
            {AREAS.map((a) => (
              <HubButton key={a.href} area={a} />
            ))}
          </nav>

          <Link href="/dashboard/barber" aria-label="Close and return to dashboard" title="Back to dashboard" className="ph-x">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </Link>
        </div>
      </main>
    </div>
  );
}

// Controls read in caps, except the brand spelling ePORTFOLIO.
function displayLabel(label: string) {
  return label === "ePortfolio" ? "ePORTFOLIO" : label.toUpperCase();
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke={CYAN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ICON | TITLE | >  — content-fitted, chamfered, cyan; a tiny POLAR-pink
// paint fleck at one corner is the page's only pink.
function HubButton({ area }: { area: Area }) {
  const fleck: React.CSSProperties = {
    position: "absolute",
    width: 44,
    height: 31,
    opacity: 0.8,
    ...(area.corner === "tl" ? { left: -12, top: -12, transform: "rotate(180deg)" } : {}),
    ...(area.corner === "tr" ? { right: -12, top: -12, transform: "scaleY(-1)" } : {}),
    ...(area.corner === "bl" ? { left: -12, bottom: -12, transform: "scaleX(-1)" } : {}),
    ...(area.corner === "br" ? { right: -12, bottom: -12 } : {}),
  };
  const label = displayLabel(area.label);
  return (
    <Link href={area.href} className="ph-btn" style={area.place} aria-label={area.label}>
      <span className="ph-shape relative flex items-stretch p-[2px]" style={{ background: CYAN }}>
        <span className="ph-shape flex items-stretch" style={{ background: "linear-gradient(180deg, #081533 0%, #050b1f 100%)" }}>
          <span className="flex w-[74px] items-center justify-center" style={{ color: CYAN, borderRight: `2px solid rgba(${CYAN_RGB},0.55)` }}>
            {area.icon}
          </span>
          <span className="flex items-center gap-7 pl-6 pr-5">
            <span className="whitespace-nowrap text-[30px] font-bold leading-none tracking-wide">{label}</span>
            <Chevron />
          </span>
        </span>
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/dashboard/polar-ui/services-corner-splat.webp" alt="" aria-hidden="true" className="pointer-events-none select-none" style={fleck} />
    </Link>
  );
}
