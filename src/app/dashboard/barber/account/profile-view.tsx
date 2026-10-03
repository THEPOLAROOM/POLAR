"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Barlow_Condensed } from "next/font/google";
import { BarberDashboardScene, type Destination } from "../dashboard-scene";

// MY PROFILE hub. Desktop reuses the Barber Dashboard Home's room, furniture,
// mascot and hotspot geometry (<BarberDashboardScene>), but on a dedicated
// duplicate background image (your-profile-dark.webp, derived from
// design-masters/your-profile-master.png) with the five pills genuinely
// relabelled — Settings, Analytics, Personal Details, ePortfolio, POLAR CV —
// in the same font/weight/glow/chevron style as the original. The original
// Barber Dashboard Home's artwork (barber-dashboard-dark.webp /
// barber-dashboard-master.png) is a separate file and is never edited; this
// hub only ever reads its own duplicate. Below 640 px a dedicated list
// layout is shown instead, with real HTML labels.
// The hub shows no data; each area holds its own information.

const YOUR_PROFILE_SRC = "/dashboard/polar-room/your-profile-dark.webp";

const ui = Barlow_Condensed({ subsets: ["latin"], weight: ["600"] });

const BG = "#03060f";
const CYAN = "#1fd6ff";
const ICON_C = "rgb(2,172,248)";
const CHEV_C = "rgb(4,220,249)";

type Key = "settings" | "analytics" | "personalDetails" | "eportfolio" | "polarCv";

// Same artwork, same zones as the Barber Dashboard Home (dashboard-scene.tsx
// DESTINATIONS) — only the href and label change, mapped to the physical
// object at each zone: tablet/kiosk, wall calendar, barber chair, POLAR
// mascot, and the product cart/workstation.
const PROFILE_DESTINATIONS: readonly (Destination & { key: Key })[] = [
  { key: "settings", href: "/dashboard/barber/account/settings", label: "Settings", zones: [[50, 252, 236, 67], [4, 352, 318, 348]] },
  { key: "analytics", href: "/dashboard/barber/calendar/analytics", label: "Analytics", zones: [[392, 137, 273, 63], [387, 238, 273, 267]] },
  { key: "personalDetails", href: "/dashboard/barber/account/personal-details", label: "Personal Details", zones: [[873, 231, 272, 61], [828, 326, 338, 379]] },
  { key: "eportfolio", href: "/dashboard/barber/account/eportfolio", label: "ePortfolio", zones: [[1278, 72, 270, 64], [1258, 190, 316, 500]] },
  { key: "polarCv", href: "/dashboard/barber/account/professional-profile", label: "POLAR CV", zones: [[1684, 231, 304, 72], [1590, 350, 428, 350]] },
];

// Icons for the phone/tablet list only (desktop icons are part of the
// reused dashboard artwork).
const GLYPHS: Record<Key, React.ReactNode> = {
  personalDetails: (
    <>
      <circle cx="12" cy="7" r="4.4" />
      <path d="M3.6 21.2v-.9a6.9 6.9 0 0 1 6.9-6.9h3a6.9 6.9 0 0 1 6.9 6.9v.9z" />
    </>
  ),
  polarCv: (
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

export function ProfileView() {
  const router = useRouter();

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
        .ph-exit { position: fixed; right: 14px; top: 14px; z-index: 5; place-items: center; width: 34px; height: 34px; border-radius: 9px;
          border: 1px solid rgba(31,214,255,.45); color: rgba(31,214,255,.8); background: rgba(3,6,15,.45); transition: color .15s, border-color .15s, background .15s; }
        .ph-exit:hover { color: ${CYAN}; border-color: ${CYAN}; background: rgba(3,6,15,.75); }
        .ph-exit:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { .ph-exit { transition: none; } }
      `}</style>

      {/* Phone and small tablet — same five areas, simple list. */}
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
          {PROFILE_DESTINATIONS.map((a) => (
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

      {/* Desktop — the Barber Dashboard Home's own room, furniture and
          mascot, on this hub's own relabelled duplicate background. */}
      <BarberDashboardScene heading="My Profile" navLabel="My Profile" destinations={PROFILE_DESTINATIONS} backgroundSrc={YOUR_PROFILE_SRC} />
      <Link href="/dashboard/barber" aria-label="Close and return to dashboard" title="Back to dashboard (Esc)" className="ph-exit hidden sm:grid">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
      </Link>
    </div>
  );
}
