"use client";

import Link from "next/link";
import { Barlow, Barlow_Condensed, Permanent_Marker } from "next/font/google";
import { FocusModeShell, ACCENTS } from "@/components/focus-mode/focus-mode-shell";
import { BarberRoom } from "../dashboard-scene";

// My Profile Focus Mode (desktop), built to the approved pink MY PROFILE
// design as real HTML inside the shared FocusModeShell. Unlike the other
// Focus pages, the background is the dedicated Profile scene (POLAR lit
// on the left), so the room stays lit and the panel sits to his right.
// Every pathway is either a real route or explicitly marked Coming soon —
// no dead buttons and no invented data.
const PINK = ACCENTS.magenta;

const graffiti = Permanent_Marker({ subsets: ["latin"], weight: "400" });
const ui = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const condensed = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"] });

// Panel sits right of POLAR (whose right edge is ~36% across the scene).
const FRAME_INSET = "max(5dvh, 24px) max(3vw, 24px) max(5dvh, 24px) max(37vw, 24px)";

type Pathway = {
  key: string;
  title: string;
  body: string;
  href: string | null; // null = not built yet (Coming soon)
  icon: React.ReactNode;
  wide?: boolean;
};

const icon = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const PATHWAYS: Pathway[] = [
  {
    key: "personal",
    title: "PERSONAL DETAILS",
    body: "Add and manage your personal information and account details.",
    href: "/dashboard/barber/account/personal-details",
    icon: icon(<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></>),
  },
  {
    key: "professional",
    title: "PROFESSIONAL",
    body: "Tell your professional story, experience and journey.",
    href: "/dashboard/barber/account/professional-profile",
    icon: icon(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5h6v2M3 12h18M11 12v2h2v-2" /></>),
  },
  {
    key: "credentials",
    title: "CREDENTIALS",
    body: "Add your qualifications, courses and achievements.",
    href: null,
    icon: icon(<><circle cx="12" cy="9" r="6" /><path d="M9 14l-2 7 5-3 5 3-2-7M12 6.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" /></>),
  },
  {
    key: "eportfolio",
    title: "ePORTFOLIO",
    body: "Showcase your work with photos and videos.",
    href: null,
    icon: icon(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 8" /></>),
  },
  {
    key: "visibility",
    title: "VISIBILITY",
    body: "Control what others can see on your public profile.",
    href: null,
    icon: icon(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>),
  },
  {
    key: "emergency",
    title: "EMERGENCY CONTACT",
    body: "Add emergency contact information (private).",
    href: null,
    icon: icon(<><path d="M5 4h3l2 5-2.5 1.5a11 11 0 005 5L14 13l5 2v3a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z" /><path d="M18 2v6M15 5h6" /></>),
  },
  {
    key: "analytics",
    title: "SMART ANALYTICS",
    body: "View insights about your performance, client trends and growth over time.",
    href: "/dashboard/barber/calendar/analytics",
    icon: icon(<><path d="M4 20V10M9 20V4M14 20v-7M19 20v-11" /></>),
    wide: true,
  },
];

function VerifiedBadge() {
  return (
    <span title="Official POLAR Barber account" className="inline-flex shrink-0">
      <svg viewBox="0 0 24 24" className="h-9 w-9" aria-label="Official POLAR Barber account" role="img">
        <path
          fill={ACCENTS.magenta.hex}
          d="M12 1.5l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22.5l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z"
        />
        <path d="M7.5 12.2l3 3 6-6.2" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Chevron() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: PINK.hex, boxShadow: `0 0 10px rgba(${PINK.rgb},0.55)` }}>
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 5l7 7-7 7" />
      </svg>
    </span>
  );
}

function PathwayCard({ p }: { p: Pathway }) {
  const live = Boolean(p.href);
  const inner = (
    <>
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2"
        style={{ borderColor: live ? PINK.hex : `rgba(${PINK.rgb},0.4)`, color: live ? PINK.hex : `rgba(${PINK.rgb},0.55)` }}
      >
        {p.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`${condensed.className} flex items-center gap-3 text-[22px] font-bold leading-tight tracking-wide ${live ? "text-white" : "text-white/55"}`}>
          {p.title}
          {!live && (
            <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs font-semibold tracking-[0.14em] text-white/50">Coming soon</span>
          )}
        </span>
        <span className={`mt-0.5 block text-[15px] leading-snug ${live ? "text-white/80" : "text-white/40"}`}>{p.body}</span>
      </span>
      {live && <Chevron />}
    </>
  );
  const cls = `flex items-center gap-5 rounded-2xl border-2 px-5 py-3 ${p.wide ? "col-span-2" : ""}`;
  const style: React.CSSProperties = live
    ? { borderColor: `rgba(${PINK.rgb},0.85)`, background: "rgba(20,4,16,0.55)", boxShadow: `0 0 14px -4px rgba(${PINK.rgb},0.7), inset 0 0 18px -10px rgba(${PINK.rgb},0.6)` }
    : { borderColor: `rgba(${PINK.rgb},0.3)`, background: "rgba(12,4,10,0.45)" };
  return live ? (
    <Link href={p.href!} className={`${cls} transition hover:bg-white/[0.04]`} style={style}>
      {inner}
    </Link>
  ) : (
    <div aria-disabled="true" className={cls} style={style}>
      {inner}
    </div>
  );
}

export function ProfileView({ name, location, email }: { name: string | null; location: string | null; email: string }) {
  return (
    <div id="barber-profile-page">
      {/* The shared barber nav lives in layout.tsx, which every other
          barber route still needs, so it's hidden for this page only. */}
      <style>{`
        div:has(> #barber-profile-page) > nav {
          display: none;
        }
        .profile-title {
          display: inline-block;
          transform: rotate(-2deg) skewX(-6deg);
          background: linear-gradient(180deg, #ffffff 0%, #fff4fb 55%, #f3c9e4 80%, #ffffff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.8)) drop-shadow(0 0 10px rgba(255, 31, 180, 0.5));
          padding: 0.05em 0.1em;
        }
        .profile-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 31, 180, 0.8) transparent;
        }
        .profile-scroll::-webkit-scrollbar { width: 6px; }
        .profile-scroll::-webkit-scrollbar-track { background: transparent; }
        .profile-scroll::-webkit-scrollbar-thumb { background: rgba(255, 31, 180, 0.8); border-radius: 999px; }
      `}</style>

      {/* Mobile — existing simple functional layout (links to the same real pages). */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">My Profile</h1>
        <p className="mt-2 text-sm text-polar-muted">Signed in as {email}.</p>
        <ul className="mt-6 space-y-2">
          <li>
            <Link href="/dashboard/barber/account/personal-details" className="block rounded border border-polar-border px-3 py-2 text-sm text-polar-text">
              Personal Details
            </Link>
          </li>
          <li>
            <Link href="/dashboard/barber/account/professional-profile" className="block rounded border border-polar-border px-3 py-2 text-sm text-polar-text">
              Professional
            </Link>
          </li>
          <li>
            <Link href="/dashboard/barber/calendar/analytics" className="block rounded border border-polar-border px-3 py-2 text-sm text-polar-text">
              Smart Analytics
            </Link>
          </li>
        </ul>
      </main>

      {/* Desktop — My Profile Focus Mode. */}
      <FocusModeShell
        id="profile"
        accent="magenta"
        backdrop="lit"
        frameInset={FRAME_INSET}
        room={<BarberRoom decorative src="/dashboard/profile-room-v1.webp" />}
        className={ui.className}
        heading={
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <svg viewBox="0 0 80 64" className="h-14 w-16 shrink-0" fill="none" stroke={PINK.hex} strokeWidth="5" strokeLinejoin="round" aria-hidden="true" style={{ filter: `drop-shadow(0 0 8px rgba(${PINK.rgb},0.8))` }}>
              <path d="M8 16l16 16 16-26 16 26 16-16-6 30H14z" />
              <path d="M16 54c8-5 40-5 48 0" />
            </svg>
            <div>
              <h1 className={`${graffiti.className} profile-title whitespace-nowrap leading-none`} style={{ fontSize: "clamp(36px, 3vw, 56px)" }}>
                My Profile
              </h1>
              <p className="mt-1 whitespace-nowrap pl-2 text-sm font-medium uppercase tracking-[0.42em] text-white/85">Barber account</p>
            </div>
          </div>
        }
      >
        <div className="profile-scroll min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 pt-3">
          {/* Profile header — real name / location; photo and bio are not built yet. */}
          <section
            className="flex items-center gap-6 rounded-2xl border-2 px-6 py-4"
            style={{ borderColor: `rgba(${PINK.rgb},0.85)`, background: "rgba(20,4,16,0.5)", boxShadow: `0 0 16px -4px rgba(${PINK.rgb},0.6)` }}
          >
            <div
              aria-label="Profile photo — coming soon"
              className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-[3px] text-white/70"
              style={{ borderColor: PINK.hex, boxShadow: `0 0 18px rgba(${PINK.rgb},0.6)` }}
            >
              <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              <span className="mt-1 text-sm font-semibold">Photo</span>
              <span className="text-[11px] uppercase tracking-[0.14em] text-white/45">Coming soon</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <p className={`${condensed.className} truncate text-[44px] font-bold uppercase leading-none text-white`}>{name || "Your name"}</p>
                <VerifiedBadge />
              </div>
              <Link
                href="/dashboard/barber/account/professional-profile"
                className="mt-2 inline-flex items-center gap-2 text-lg text-white/85 hover:text-white"
                title={location ? "Edit location (Professional)" : "Add location (Professional)"}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill={PINK.hex} aria-hidden="true">
                  <path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z" />
                  <circle cx="12" cy="10" r="2.6" fill="#1a0614" />
                </svg>
                {location || "Add Location"}
              </Link>
              <div
                aria-label="Short bio — coming soon"
                className="mt-3 flex items-center gap-3 rounded-lg border px-4 py-2.5 text-base text-white/45"
                style={{ borderColor: `rgba(${PINK.rgb},0.35)` }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke={PINK.hex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" opacity="0.6">
                  <path d="M4 20h4L19 9l-4-4L4 16z" />
                </svg>
                Short bio — coming soon
              </div>
            </div>

            <Link
              href="/dashboard/barber/account/personal-details"
              className="flex h-14 shrink-0 items-center gap-3 self-start rounded-xl border-2 px-6 text-lg font-bold uppercase tracking-wide text-white transition hover:brightness-110"
              style={{ borderColor: "#ff6fcf", background: `linear-gradient(180deg, #ff3fc0 0%, ${PINK.hex} 55%, #d10f90 100%)`, boxShadow: `0 0 18px -2px rgba(${PINK.rgb},0.85)` }}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 20h4L19 9l-4-4L4 16z" />
              </svg>
              Edit Profile
            </Link>
          </section>

          <div className="grid grid-cols-2 gap-3">
            {PATHWAYS.map((p) => (
              <PathwayCard key={p.key} p={p} />
            ))}
          </div>
        </div>
      </FocusModeShell>
    </div>
  );
}
