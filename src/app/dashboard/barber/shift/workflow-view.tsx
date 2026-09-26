"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Barlow, Barlow_Condensed } from "next/font/google";
import type { WorkflowBooking } from "@/lib/queries/barber-workflow";
import { BarberRoom } from "../dashboard-scene";

// Workflow Mode (desktop), built to the approved blue WORKFLOW MODE
// design over the darkened POLAR Room. All data is the Phase 1 real data
// (lib/queries/barber-workflow); the countdown is unchanged — it counts to
// the current appointment's scheduled end time in Europe/London time.
const ui = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const cond = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], style: ["normal", "italic"] });

const CYAN = "#22e4ff";
const CYAN_RGB = "34,228,255";
const BLUE_RGB = "30,123,255";

// ---------------------------------------------------------------
// Icons — hand-written SVGs (24px grid, stroke-based), not extracted
// from the concept image. Hair Type / Hair Texture / Hair Condition are
// deliberately three different glyphs.
// ---------------------------------------------------------------
type IconProps = { className?: string };
function Svg({ children, className = "h-7 w-7" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}
/** Classic scissors: two finger rings, two crossing blades. */
const ScissorsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
  </Svg>
);
const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);
const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </Svg>
);
const CrownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 7l4.5 5L12 5l4.5 7L21 7l-2 11H5z" />
    <path d="M5 21h14" />
  </Svg>
);
const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
  </Svg>
);
const BarsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 20v-5M10 20v-9M15 20V7M20 20V3" />
  </Svg>
);
const PhoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 3.5h3.5l1.8 4.5-2.3 1.4a11.5 11.5 0 0 0 6.6 6.6l1.4-2.3 4.5 1.8V19a1.8 1.8 0 0 1-2 1.8A16.8 16.8 0 0 1 3.2 5.5 1.8 1.8 0 0 1 5 3.5z" />
  </Svg>
);
/** Hair type — curl pattern (coiled strands). */
const HairTypeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 21c-2-3 3-4 1-7s3-4 1-7 2-4 2-4" />
    <path d="M14 21c-2-3 3-4 1-7s3-4 1-7" />
  </Svg>
);
/** Hair texture — surface pattern (two zig-zag rows). */
const HairTextureIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 10l3-3 3 3 3-3 3 3 3-3 3 3" />
    <path d="M3 17l3-3 3 3 3-3 3 3 3-3 3 3" />
  </Svg>
);
/** Hair density — stacked layers. */
const DensityIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 2.5 8 12 13l9.5-5z" />
    <path d="M2.5 12.5 12 17.5l9.5-5M2.5 17 12 22l9.5-5" />
  </Svg>
);
const DropIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3s6.5 7.3 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.3 12 3 12 3z" />
  </Svg>
);
/** Scalp condition — head profile with scalp line. */
const ScalpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 21v-3.5A7.5 7.5 0 1 1 18.5 12L20 15h-2v3a2 2 0 0 1-2 2h-2v1" />
    <path d="M7 8.5c2-2.5 6-3 8.5-1" />
  </Svg>
);
const ShieldPlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 5 5.5v6c0 4.6 3 8 7 9.5 4-1.5 7-4.9 7-9.5v-6z" />
    <path d="M12 9v6M9 12h6" />
  </Svg>
);
/** Allergies — alert triangle. */
const AllergyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 2.5 20h19z" />
    <path d="M12 10v4.5M12 17.5h.01" />
  </Svg>
);
/** Hair condition — a single strand with health sparkles. */
const HairConditionIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 21c3-5-2-9 1-15" />
    <path d="M16 3.5v4M14 5.5h4M18 12v3M16.5 13.5h3M12.5 16.5v2.5M11.2 17.8h2.6" />
  </Svg>
);
const NoteIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v4h4M10 12h5M10 16h5" />
  </Svg>
);
const PencilIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
    <path d="M13 7l4 4" />
  </Svg>
);
const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5M12 14v3" />
  </Svg>
);
const ChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
);
const ChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);
const ExpandIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
  </Svg>
);
const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 5l14 14M19 5 5 19" />
  </Svg>
);
const PersonSilhouette = (p: IconProps) => (
  <svg viewBox="0 0 200 200" className={p.className} fill="currentColor" aria-hidden="true">
    <circle cx="100" cy="72" r="40" />
    <path d="M28 196c0-44 32-72 72-72s72 28 72 72z" />
  </svg>
);

// ---------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------
const PANEL: React.CSSProperties = {
  border: `2px solid rgba(${CYAN_RGB},0.85)`,
  background: "linear-gradient(180deg, rgba(6,16,34,0.94) 0%, rgba(3,9,22,0.96) 100%)",
  boxShadow: `0 0 18px -2px rgba(${CYAN_RGB},0.55), inset 0 0 22px -12px rgba(${CYAN_RGB},0.55)`,
};

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-h-0 rounded-2xl ${className}`} style={PANEL}>
      {children}
    </div>
  );
}

function Title({ a, b }: { a: string; b: string }) {
  return (
    <h2 className={`${cond.className} text-[clamp(22px,2.1vw,38px)] font-bold uppercase leading-none tracking-wide text-white`}>
      {a} <span style={{ color: CYAN }}>{b}</span>
    </h2>
  );
}

const Divider = () => <div className="h-px w-full" style={{ background: `rgba(${CYAN_RGB},0.55)` }} aria-hidden="true" />;

function Value({ v }: { v: string | null }) {
  return <span className={`truncate text-[clamp(14px,1.05vw,19px)] ${v ? "text-white" : "text-white/60"}`}>{v || "—"}</span>;
}

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div
      className="grid min-h-0 grid-cols-[1.8em_minmax(0,1.25fr)_minmax(0,1fr)] items-center gap-2.5 border-b py-[0.5em] last:border-b-0"
      style={{ borderColor: `rgba(${CYAN_RGB},0.35)` }}
    >
      <span style={{ color: CYAN }}>{icon}</span>
      <span className={`${cond.className} truncate text-[clamp(12.5px,0.98vw,20px)] font-semibold uppercase text-white`}>{label}</span>
      <span className="truncate border-l pl-3" style={{ borderColor: `rgba(${CYAN_RGB},0.55)` }}>
        <Value v={value} />
      </span>
    </div>
  );
}

function formatDateShort(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function toSeconds(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 3600 + m * 60;
}

export function WorkflowView({ bookings, initialIndex }: { bookings: WorkflowBooking[]; initialIndex: number }) {
  const [index, setIndex] = useState(initialIndex);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const timerRef = useRef<HTMLDivElement>(null);

  const current = bookings[index] ?? null;
  const client = current?.client ?? null;

  // Ticks every second against the shop's own local clock (same
  // Europe/London convention as getShopTimeNow on the server) rather
  // than the browser's local timezone, so this agrees with the rest
  // of the app regardless of what timezone the barber's device is set
  // to. Counts down to the current appointment's real end time — no
  // separate "timer" concept is invented.
  useEffect(() => {
    if (!current) {
      setRemaining(null);
      return;
    }
    const [endH, endM] = current.endTime.split(":").map(Number);
    const endSeconds = endH * 3600 + endM * 60;

    function tick() {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date());
      const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
      const nowSeconds = get("hour") * 3600 + get("minute") * 60 + get("second");
      setRemaining(Math.max(0, endSeconds - nowSeconds));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [current]);

  // The locked insights never stay revealed when switching client.
  useEffect(() => setInsightsOpen(false), [index]);

  const { hh, mm, ss } = useMemo(() => {
    if (remaining === null) return { hh: "--", mm: "--", ss: "--" };
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    return { hh: String(h).padStart(2, "0"), mm: String(m).padStart(2, "0"), ss: String(s).padStart(2, "0") };
  }, [remaining]);

  // Ring = share of the appointment's scheduled length still remaining
  // (a picture of the same countdown, not a separate timer).
  const ringFraction = useMemo(() => {
    if (!current || remaining === null) return 0;
    const total = toSeconds(current.endTime) - toSeconds(current.startTime);
    return total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
  }, [current, remaining]);

  // Whole-page full screen (browser Fullscreen API). Separate from the
  // Time Remaining module's own full screen; Esc exits either back to
  // Workflow. X is the only way back to the dashboard.
  function togglePageFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }
  function toggleTimerFullscreen() {
    if (!timerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else timerRef.current.requestFullscreen();
  }

  const R = 44;
  const CIRC = 2 * Math.PI * R;
  const headerBtn = "flex h-full w-full items-center justify-center rounded-2xl text-white transition hover:bg-white/5";
  const navBtn =
    "absolute top-1/2 z-20 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-[rgba(3,9,22,0.85)] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-25";
  const navStyle = { borderColor: `rgba(${CYAN_RGB},0.8)`, boxShadow: `0 0 16px -4px rgba(${CYAN_RGB},0.7)` };
  const apptIcon = "h-[clamp(22px,2vw,40px)] w-[clamp(22px,2vw,40px)]";

  return (
    <div id="barber-workflow-page">
      {/* Shared nav hidden on this page, same as every immersive barber page. */}
      <style>{`
        div:has(> #barber-workflow-page) > nav {
          display: none;
        }
      `}</style>

      {/* Mobile — simple functional placeholder (unchanged). */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">Workflow</h1>
        {current ? (
          <p className="mt-2 text-sm text-polar-muted">
            Current: {client?.name} ({current.startTime}–{current.endTime})
          </p>
        ) : (
          <p className="mt-2 text-sm text-polar-muted">No appointments today.</p>
        )}
      </main>

      {/* Desktop / landscape */}
      <main className={`${ui.className} relative hidden overflow-hidden bg-black sm:block`} style={{ height: "100dvh" }}>
        {/* The POLAR Room, lights off (same treatment as the Focus pages). */}
        <div aria-hidden="true" className="absolute inset-0" style={{ filter: "saturate(0.15) brightness(0.42) blur(2.5px)" }}>
          <BarberRoom decorative />
        </div>
        <div aria-hidden="true" className="absolute inset-0" style={{ backgroundColor: "rgba(2,2,5,0.9)" }} />

        {/* Previous / Next client — carousel-style, outside the panel. */}
        <button
          type="button"
          aria-label="Previous client"
          disabled={index <= 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className={`${navBtn} left-[1vw]`}
          style={navStyle}
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
        <button
          type="button"
          aria-label="Next client"
          disabled={index >= bookings.length - 1}
          onClick={() => setIndex((i) => Math.min(bookings.length - 1, i + 1))}
          className={`${navBtn} right-[1vw]`}
          style={navStyle}
        >
          <ChevronRight className="h-8 w-8" />
        </button>

        <div className="absolute inset-y-[3.5dvh] left-[max(6vw,84px)] right-[max(6vw,84px)] grid grid-rows-[auto_minmax(0,1fr)] gap-[1.4dvh]">
          {/* HEADER */}
          <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,1.7fr)_clamp(64px,5.6vw,104px)_clamp(64px,5.6vw,104px)] gap-[0.9vw]">
            <Panel className="flex items-center gap-3 px-5 py-3">
              <CrownIcon className="h-[clamp(34px,3.4vw,70px)] w-[clamp(34px,3.4vw,70px)] shrink-0 text-white" />
              <div className="min-w-0">
                <p className={`${cond.className} truncate whitespace-nowrap text-[clamp(22px,2.3vw,50px)] font-bold uppercase italic leading-none text-white`}>
                  Workflow <span style={{ color: CYAN }}>Mode</span>
                </p>
                <div className="mt-2 h-[3px] w-full rounded-full" style={{ background: `linear-gradient(90deg, transparent, rgba(${BLUE_RGB},0.9), rgba(${CYAN_RGB},0.9), transparent)` }} />
              </div>
            </Panel>

            <Panel className="flex flex-col justify-center gap-2 px-6 py-3">
              <Title a="Current" b="Appointment" />
              {current ? (
                <div className="grid grid-cols-3">
                  {[
                    { icon: <ScissorsIcon className={apptIcon} />, label: "Service", value: current.serviceName ? `${current.serviceName}${current.isBarter ? " (barter)" : ""}` : null },
                    { icon: <ClockIcon className={apptIcon} />, label: "Start Time", value: current.startTime },
                    { icon: <ClockIcon className={apptIcon} />, label: "End Time", value: current.endTime },
                  ].map((f, i) => (
                    <div key={f.label} className="flex min-w-0 items-center gap-2 px-3 first:pl-0" style={i ? { borderLeft: `1px solid rgba(${CYAN_RGB},0.45)` } : undefined}>
                      <span className="shrink-0" style={{ color: CYAN }}>
                        {f.icon}
                      </span>
                      <span className="min-w-0">
                        <span className={`${cond.className} block whitespace-nowrap text-[clamp(12px,0.9vw,18px)] font-semibold uppercase text-white/90`}>{f.label}</span>
                        <span className="block truncate">
                          <Value v={f.value} />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[clamp(14px,1.05vw,19px)] text-white/60">No appointments today.</p>
              )}
            </Panel>

            <Panel className="h-full">
              <button type="button" onClick={togglePageFullscreen} aria-label="Full screen" title="Full screen" className={headerBtn}>
                <ExpandIcon className="h-[45%] w-[45%]" />
              </button>
            </Panel>
            <Panel className="h-full">
              <Link href="/dashboard/barber" aria-label="Close and return to dashboard" title="Close" className={headerBtn}>
                <CloseIcon className="h-[50%] w-[50%]" />
              </Link>
            </Panel>
          </div>

          {/* BODY — Client ID | Client Profile + Key Notes | Insights + Time Remaining */}
          <div className="grid min-h-0 grid-cols-[minmax(0,1.1fr)_minmax(0,1.7fr)_minmax(0,1fr)] gap-[0.9vw]">
            {/* CLIENT ID */}
            <Panel className="flex min-h-0 flex-col px-5 py-4">
              <Title a="Client" b="ID" />
              <div className="mt-3">
                <Divider />
              </div>
              <div className="flex min-h-0 flex-1 items-center justify-center py-3">
                <div
                  className="relative aspect-[4/3] h-full max-h-[190px] overflow-hidden rounded-2xl"
                  style={{ border: `2.5px solid rgba(${CYAN_RGB},0.9)`, boxShadow: `0 0 14px -2px rgba(${CYAN_RGB},0.6)` }}
                >
                  {client?.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={client.photoUrl} alt={client.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-end justify-center bg-[rgba(3,9,22,0.9)]">
                      <PersonSilhouette className="h-[85%] w-auto text-white/60" />
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-xl border px-3" style={{ borderColor: `rgba(${CYAN_RGB},0.45)` }}>
                <FieldRow icon={<UserIcon />} label="Name" value={client?.name ?? null} />
                <FieldRow icon={<CrownIcon />} label="POLAR ID" value={client?.polarId ?? null} />
                <FieldRow icon={<CalendarIcon />} label="Client Since" value={formatDateShort(client?.clientSince ?? null)} />
                <FieldRow icon={<BarsIcon />} label="Total Visits" value={client ? String(client.totalVisits) : null} />
                <FieldRow icon={<PhoneIcon />} label="Emergency Contact" value={client?.emergencyContact ?? null} />
              </div>
            </Panel>

            {/* CLIENT PROFILE + KEY NOTES */}
            <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-[1.4dvh]">
              <Panel className="flex min-h-0 flex-col px-6 py-4">
                <Title a="Client" b="Profile" />
                <div className="mt-3">
                  <Divider />
                </div>
                <div className="grid min-h-0 flex-1 grid-cols-2 content-center gap-x-6">
                  <div className="border-r pr-6" style={{ borderColor: `rgba(${CYAN_RGB},0.45)` }}>
                    <FieldRow icon={<HairTypeIcon />} label="Hair Type" value={client?.hairType ?? null} />
                    <FieldRow icon={<HairTextureIcon />} label="Hair Texture" value={client?.hairTexture ?? null} />
                    <FieldRow icon={<DensityIcon />} label="Hair Density" value={client?.hairDensity ?? null} />
                    <FieldRow icon={<DropIcon />} label="Hair Colour" value={client?.hairColour ?? null} />
                  </div>
                  <div>
                    <FieldRow icon={<ScalpIcon />} label="Scalp Condition" value={client?.scalpCondition ?? null} />
                    <FieldRow icon={<ShieldPlusIcon />} label="Skin Sensitivity" value={client?.skinSensitivity ?? null} />
                    <FieldRow icon={<AllergyIcon />} label="Allergies" value={client?.allergies ?? null} />
                    <FieldRow icon={<HairConditionIcon />} label="Hair Condition" value={client?.hairCondition ?? null} />
                  </div>
                </div>
              </Panel>

              <Panel className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <NoteIcon className="h-[clamp(24px,2vw,36px)] w-[clamp(24px,2vw,36px)] text-white" />
                  <Title a="Key" b="Notes" />
                </div>
                <div className="mt-3 flex items-start gap-3 rounded-xl border px-4 py-3" style={{ borderColor: `rgba(${CYAN_RGB},0.45)` }}>
                  <p className={`line-clamp-3 min-h-[3em] flex-1 whitespace-pre-line text-[clamp(14px,1.05vw,19px)] ${client?.keyNotes ? "text-white" : "text-white/60"}`}>
                    {client?.keyNotes || "—"}
                  </p>
                  {client && (
                    <Link
                      href={`/dashboard/barber/clients/${client.id}`}
                      aria-label="Edit key notes on client profile"
                      title="Edit on client profile"
                      className="shrink-0 text-white/85 hover:text-white"
                    >
                      <PencilIcon className="h-6 w-6" />
                    </Link>
                  )}
                </div>
              </Panel>
            </div>

            {/* BARBER INSIGHTS (locked) + TIME REMAINING */}
            <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-[1.4dvh]">
              <div className="relative">
                <Panel>
                  <button
                    type="button"
                    onClick={() => setInsightsOpen((v) => !v)}
                    aria-expanded={insightsOpen}
                    aria-label="Barber Insights"
                    className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition hover:bg-white/5"
                  >
                    <LockIcon className="h-[clamp(30px,2.6vw,46px)] w-[clamp(30px,2.6vw,46px)] shrink-0 text-white" />
                    <span className={`${cond.className} flex-1 truncate text-[clamp(20px,1.8vw,32px)] font-bold uppercase text-white`}>
                      Barber <span style={{ color: CYAN }}>Insights</span>
                    </span>
                    <ChevronRight className={`h-8 w-8 shrink-0 text-white transition ${insightsOpen ? "rotate-90" : ""}`} />
                  </button>
                </Panel>
                {insightsOpen && (
                  <div role="dialog" aria-label="Barber Insights" className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl p-4" style={{ ...PANEL, background: "rgba(3,9,22,0.98)" }}>
                    {!client || client.insights.length === 0 ? (
                      <p className="text-base text-white/70">
                        No insights set up yet.{" "}
                        <Link href="/dashboard/barber/insights" className="underline" style={{ color: CYAN }}>
                          Create insight questions
                        </Link>
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {client.insights.map((i) => (
                          <li key={i.label} className="flex justify-between gap-3 text-base">
                            <span className="truncate text-white/80">{i.label}</span>
                            <span className={i.value ? "text-white" : "text-white/40"}>{i.value ?? "—"}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {client && (
                      <Link href={`/dashboard/barber/clients/${client.id}`} className="mt-3 inline-block text-sm underline" style={{ color: CYAN }}>
                        Edit on client profile
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <Panel className="min-h-0">
                <div ref={timerRef} className="relative flex h-full min-h-0 flex-col items-center px-4 pb-4 pt-4 [&:fullscreen]:justify-center [&:fullscreen]:bg-[#030916]">
                  <div className="flex w-full items-center gap-3">
                    <span className="h-px flex-1" style={{ background: `rgba(${CYAN_RGB},0.6)` }} />
                    <p className={`${cond.className} text-[clamp(20px,1.8vw,32px)] font-bold uppercase leading-none`} style={{ color: CYAN }}>
                      Time Remaining
                    </p>
                    <span className="h-px flex-1" style={{ background: `rgba(${CYAN_RGB},0.6)` }} />
                  </div>
                  <div className="relative mt-2 flex min-h-0 w-full flex-1 items-center justify-center">
                    <svg viewBox="0 0 100 100" className="h-full max-h-full w-auto max-w-full" role="img" aria-label={`Time remaining ${hh} hours ${mm} minutes ${ss} seconds`}>
                      <circle cx="50" cy="50" r={R} fill="none" stroke={`rgba(${BLUE_RGB},0.35)`} strokeWidth="5" />
                      <circle
                        cx="50"
                        cy="50"
                        r={R}
                        fill="none"
                        stroke={CYAN}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={`${CIRC * ringFraction} ${CIRC}`}
                        transform="rotate(-90 50 50)"
                        style={{ filter: `drop-shadow(0 0 2px rgba(${CYAN_RGB},0.9))`, transition: "stroke-dasharray 0.9s linear" }}
                      />
                      {Array.from({ length: 12 }, (_, i) => (
                        <line key={i} x1="50" y1="9.5" x2="50" y2="13" stroke={`rgba(${CYAN_RGB},0.8)`} strokeWidth="0.9" transform={`rotate(${i * 30} 50 50)`} />
                      ))}
                      <g transform="translate(43 22) scale(0.58)" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="14" r="7" />
                        <path d="M10 3h4M12 3v4M12 14l2.5-2.5" />
                      </g>
                      <text x="50" y="57" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700" className={cond.className}>
                        {hh}:{mm}:{ss}
                      </text>
                      {(["HRS", "MINS", "SECS"] as const).map((u, i) => (
                        <text key={u} x={33 + i * 17} y="67" textAnchor="middle" fill={CYAN} fontSize="5" fontWeight="700" className={cond.className}>
                          {u}
                        </text>
                      ))}
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTimerFullscreen}
                    aria-label="Toggle timer full screen"
                    title="Timer full screen"
                    className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-xl border-2 text-white transition hover:bg-white/5"
                    style={{ borderColor: `rgba(${CYAN_RGB},0.8)` }}
                  >
                    <ExpandIcon className="h-5 w-5" />
                  </button>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
