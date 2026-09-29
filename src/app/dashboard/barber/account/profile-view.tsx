"use client";

import { useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Barlow_Condensed } from "next/font/google";
import SPEC from "./profile-hub-spec.json";

// MY PROFILE hub. On desktop the page IS the owner's approved master image
// (design-masters/my-profile-master.png, 2019 × 779, served pixel-identical as
// my-profile-master-wide.webp): room, POLAR, title, strips, icons, connectors and
// splatter all come from it, never recreated here. The five strips are made
// usable by transparent links laid exactly over the master's own strip frames
// (profile-hub-spec.json). They scale with the image, so they stay aligned.
// Below 1024 px a dedicated list layout is shown instead of crushing the art.
// The hub shows no data; each area holds its own information.

const ui = Barlow_Condensed({ subsets: ["latin"], weight: ["600"] });

const STAGE_W = SPEC.stage.width;
const STAGE_H = SPEC.stage.height;
const BG = "#03060f";
const CYAN = "#1fd6ff";
const ICON_C = "rgb(2,172,248)";
const CHEV_C = "rgb(4,220,249)";

type Key = keyof typeof SPEC.hitAreas;

const AREAS: { key: Key; label: string; name: string; href: string }[] = [
  { key: "details", label: "DETAILS", name: "Details", href: "/dashboard/barber/account/personal-details" },
  { key: "career", label: "CAREER", name: "Career", href: "/dashboard/barber/account/professional-profile" },
  { key: "eportfolio", label: "ePORTFOLIO", name: "ePortfolio", href: "/dashboard/barber/account/eportfolio" },
  { key: "analytics", label: "ANALYTICS", name: "Analytics", href: "/dashboard/barber/calendar/analytics" },
  { key: "settings", label: "SETTINGS", name: "Settings", href: "/dashboard/barber/account/settings" },
];

// Icons for the phone/tablet list only (desktop icons are in the master).
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

// The master is wider than a desktop browser window, so it "covers" the window:
// scaled uniformly to fill it and centred, trimming only room at the far edges.
// The zoom is capped so SPEC.safe (the five strips, the title, POLAR, SETTINGS)
// always stays fully visible; if the cap binds, a thin ambient band shows instead.
// The stage sits on whole pixels: a half-pixel offset would resample the master.
const SAFE = SPEC.safe;
const SCALE_STYLE_ID = "profile-hub-scale";
function setScale() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const cover = Math.max(vw / STAGE_W, vh / STAGE_H);
  const s = Math.min(cover, vw / (SAFE.right - SAFE.left + 1), vh / (SAFE.bottom - SAFE.top + 1));
  // Centre on the safe area; where the master overflows, keep it covering the window.
  const place = (view: number, size: number, centre: number) =>
    size * s >= view ? Math.round(Math.min(0, Math.max(view - size * s, view / 2 - centre * s))) : Math.round((view - size * s) / 2);
  const x = place(vw, STAGE_W, (SAFE.left + SAFE.right + 1) / 2);
  const y = place(vh, STAGE_H, (SAFE.top + SAFE.bottom + 1) / 2);
  let el = document.getElementById(SCALE_STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = SCALE_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `:root{--profile-hub-scale:${s};--profile-hub-x:${x}px;--profile-hub-y:${y}px}`;
}

export function ProfileView() {
  const router = useRouter();

  useLayoutEffect(() => {
    setScale();
    window.addEventListener("resize", setScale);
    return () => window.removeEventListener("resize", setScale);
  }, []);

  // Esc returns to the dashboard, like the ✕.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) router.push("/dashboard/barber");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div id="barber-profile-page">
      <style>{`
        div:has(> #barber-profile-page) > nav { display: none; }
        .ph-stage { position: absolute; left: 0; top: 0; width: ${STAGE_W}px; height: ${STAGE_H}px;
          transform: translate(var(--profile-hub-x, 0px), var(--profile-hub-y, 0px)) scale(var(--profile-hub-scale, 0.8)); transform-origin: 0 0; }
        .ph-master { position: absolute; inset: 0; width: ${STAGE_W}px; height: ${STAGE_H}px; max-width: none; user-select: none; -webkit-user-drag: none; }
        .ph-ambient { position: absolute; inset: -60px; background: url(${SPEC.master.src}) center / cover no-repeat;
          filter: blur(36px) brightness(.42) saturate(1.1); pointer-events: none; }
        .ph-hit { position: absolute; display: block; border-radius: 12px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .ph-hit:focus { outline: none; }
        .ph-hit:focus-visible { outline: 3px solid #fff; outline-offset: 5px; box-shadow: 0 0 0 8px rgba(31,214,255,.35); }
        .ph-exit { position: fixed; right: 14px; top: 14px; z-index: 5; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 9px;
          border: 1px solid rgba(31,214,255,.45); color: rgba(31,214,255,.8); background: rgba(3,6,15,.45); transition: color .15s, border-color .15s, background .15s; }
        .ph-exit:hover { color: ${CYAN}; border-color: ${CYAN}; background: rgba(3,6,15,.75); }
        .ph-exit:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { .ph-exit { transition: none; } }
      `}</style>

      {/* Phone and small tablet — same five areas, simple list. */}
      <main className={`min-h-[100dvh] px-6 py-10 text-white lg:hidden ${ui.className}`} style={{ background: BG }}>
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
              <Link href={a.href} className="flex items-center gap-4 rounded-xl border-2 px-4 py-3 text-2xl font-semibold" style={{ borderColor: CYAN, background: "rgba(6,11,30,0.9)" }}>
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ color: ICON_C }} aria-hidden="true">
                  {GLYPHS[a.key]}
                </svg>
                <span className="flex-1">{a.label}</span>
                <svg viewBox="0 0 17 31" width="14" height="26" fill="none" stroke={CHEV_C} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l11 12.5L3 28" /></svg>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      {/* Desktop — the approved master filling the window, with transparent links over its strips. */}
      <main className="relative hidden h-[100dvh] overflow-hidden lg:block" style={{ background: BG }}>
        {/* Only visible if the zoom cap binds (unusually narrow/tall windows): a blurred, dimmed copy of the master behind it. */}
        <div className="ph-ambient" aria-hidden="true" />
        <div className="ph-stage">
          <h1 className="sr-only">My Profile</h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SPEC.master.src} alt="" aria-hidden="true" width={STAGE_W} height={STAGE_H} className="ph-master" draggable={false} fetchPriority="high" />
          <nav aria-label="My Profile">
            {AREAS.map((a) => {
              const r = SPEC.hitAreas[a.key];
              return (
                <Link
                  key={a.key}
                  href={a.href}
                  aria-label={a.name}
                  title={a.name}
                  className="ph-hit"
                  style={{ left: r.left, top: r.top, width: r.right - r.left + 1, height: r.bottom - r.top + 1 }}
                />
              );
            })}
          </nav>
        </div>
        <Link href="/dashboard/barber" aria-label="Close and return to dashboard" title="Back to dashboard (Esc)" className="ph-exit">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
        </Link>
      </main>
    </div>
  );
}
