"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { WorkflowBooking } from "@/lib/queries/barber-workflow";

// ---------------------------------------------------------------
// Small inline icons. No icon library is installed elsewhere in this
// project, and the set needed here is small and fixed (matches the
// approved design master one-for-one), so plain inline SVGs keep this
// dependency-free rather than pulling in a package for ~12 glyphs.
// ---------------------------------------------------------------
function Icon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}
const PersonIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />
  </Icon>
);
const PhoneIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />
  </Icon>
);
const EnvelopeIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.6" />
    <path d="m4.5 6.5 7.5 6 7.5-6" />
  </Icon>
);
const GroupIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="2.6" />
    <circle cx="16.5" cy="9.5" r="2.1" />
    <path d="M4 19c0-2.9 2.3-5 5-5s5 2.1 5 5" />
    <path d="M14.2 14.4c2.2.2 3.8 2 3.8 4.6" />
  </Icon>
);
const CalendarIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <rect x="4" y="5.5" width="16" height="14" rx="1.6" />
    <path d="M4 10h16M8 3.5v3M16 3.5v3" />
  </Icon>
);
const ChartIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M5 19V11M11 19V5M17 19v-6" />
    <path d="M4 19h16" />
  </Icon>
);
const WaveIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M4 9c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" />
    <path d="M4 15c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" />
  </Icon>
);
const DropletIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M12 3.5S6 10.8 6 14.8a6 6 0 0 0 12 0C18 10.8 12 3.5 12 3.5Z" />
  </Icon>
);
const ScalpIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="2" />
    <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.8 6.2l-1.5 1.5M7.7 16.3l-1.5 1.5M17.8 17.8l-1.5-1.5M7.7 7.7 6.2 6.2" />
  </Icon>
);
const ShieldIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M12 3.5 5 6v6c0 4.6 3 7.6 7 8.5 4-.9 7-3.9 7-8.5V6l-7-2.5Z" />
  </Icon>
);
const WarningIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M12 4 3 20h18L12 4Z" />
    <path d="M12 10.5v4M12 17.5v.1" />
  </Icon>
);
const DocumentIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M7 3.5h7l3.5 3.5V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
    <path d="M14 3.5V7h3.5M9 12h6M9 15.5h6" />
  </Icon>
);
const ClockIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5l3.2 2" />
  </Icon>
);
const ExpandIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
  </Icon>
);
const LockIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <rect x="5.5" y="10.5" width="13" height="9" rx="1.6" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Icon>
);
const ArrowLeftIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);
const ArrowRightIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);
const ScissorsIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <circle cx="6.5" cy="6.5" r="2.3" />
    <circle cx="6.5" cy="17.5" r="2.3" />
    <path d="M8.3 8 20 19M8.3 16 20 5" />
  </Icon>
);
const CameraIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-1.6h7L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" />
    <circle cx="12" cy="13" r="3.3" />
  </Icon>
);
const PersonSilhouette = (p: { className?: string }) => (
  <svg viewBox="0 0 200 240" className={p.className} fill="currentColor">
    <circle cx="100" cy="78" r="52" />
    <path d="M20 235c0-55 36-92 80-92s80 37 80 92Z" />
  </svg>
);

// ---------------------------------------------------------------
// Layout primitives shared by every panel — a two-tone heading
// ("first words white, last word royal-light", matching the master's
// consistent treatment of every panel title) and a gradient-bordered
// card shell (every panel in the master has the same diagonal
// blue-to-magenta border).
// ---------------------------------------------------------------
function PanelTitle({ text }: { text: string }) {
  const words = text.split(" ");
  const last = words[words.length - 1];
  const rest = words.slice(0, -1).join(" ");
  return (
    <h2 className="font-display text-[clamp(0.85rem,1.2vw,1.15rem)] uppercase tracking-wide text-white">
      {rest ? `${rest} ` : ""}
      <span className="text-royal-light">{last}</span>
    </h2>
  );
}

function GradientCard({
  children,
  className = "",
  contentClassName = "",
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={`min-h-0 rounded-2xl bg-gradient-to-br from-royal-light via-royal to-magenta p-[1.5px] shadow-[0_0_24px_-8px_rgba(91,155,255,0.5)] ${className}`}>
      <div className={`h-full min-h-0 w-full rounded-[15px] bg-navy-light ${contentClassName}`}>{children}</div>
    </div>
  );
}

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-[1.6em] w-[1.6em] flex-none items-center justify-center text-royal-light">{icon}</span>
      <span className="w-[6.5em] flex-none truncate text-[clamp(0.68rem,0.85vw,0.85rem)] text-white/85 sm:w-[7.5em]">{label}</span>
      <span
        className={`min-w-0 flex-1 truncate rounded-md border border-royal-light/25 bg-navy/70 px-2.5 py-0.5 text-[clamp(0.68rem,0.85vw,0.85rem)] ${
          value ? "text-white" : "text-white/30"
        }`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function formatDateShort(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function WorkflowView({ bookings, initialIndex }: { bookings: WorkflowBooking[]; initialIndex: number }) {
  const [index, setIndex] = useState(initialIndex);
  const [remaining, setRemaining] = useState<number | null>(null);
  const countdownRef = useRef<HTMLDivElement>(null);

  const current = bookings[index] ?? null;

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

  const { hh, mm, ss } = useMemo(() => {
    if (remaining === null) return { hh: "--", mm: "--", ss: "--" };
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    return { hh: String(h).padStart(2, "0"), mm: String(m).padStart(2, "0"), ss: String(s).padStart(2, "0") };
  }, [remaining]);

  function toggleFullscreen() {
    if (!countdownRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      countdownRef.current.requestFullscreen();
    }
  }

  const client = current?.client ?? null;

  return (
    <div id="barber-workflow-page">
      {/* Shared nav is hidden on this page the same way every other
          immersive barber page hides it — see calendar-view.tsx /
          dashboard page.tsx for the identical pattern. */}
      <style>{`
        div:has(> #barber-workflow-page) > nav {
          display: none;
        }
      `}</style>

      {/* Mobile — simple functional placeholder; the full Workflow
          composition below is desktop/landscape-first for this pass,
          same convention as Calendar/Clients/Dashboard home. */}
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

      {/* Desktop / landscape-tablet */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <Image
          src="/dashboard/polar-barber-dashboard-background.png"
          alt=""
          fill
          priority
          className="object-cover"
          aria-hidden="true"
        />

        {/* Positioned directly with inset (not a flex/center wrapper)
            so this box has an unambiguous, definite height for the
            grid below to divide into fr rows — a flex "items-center"
            wrapper around a 100%-height child was, in practice, not
            reliably resolving to a definite height, so the grid's 1fr
            row grew with content instead of the reverse, overflowing
            the viewport before the fix. mx-auto centres it once its
            own max-width caps out. */}
        <div className="absolute inset-2 mx-auto max-w-[1680px]">
          <div className="grid h-full w-full grid-rows-[auto_1fr_auto] gap-2">
            {/* CURRENT APPOINTMENT — centred header */}
            <div className="flex justify-center">
              <GradientCard contentClassName="px-8 py-1 flex items-center justify-center">
                <PanelTitle text="CURRENT APPOINTMENT" />
              </GradientCard>
            </div>

            {/* Main grid: left (Client ID / Today's Look) narrower,
                right (Client Profile / Countdown) wider. Both columns
                are single CSS Grid tracks, so the two stacked cards in
                each column share the exact same width and left/right
                edges by construction — no coordinate matching. */}
            <div className="grid min-h-0 grid-cols-[minmax(0,29%)_minmax(0,71%)] gap-3">
              {/* LEFT column — a fixed fr split (not aspect-ratio or
                  content-driven "auto" sizing) so neither card's
                  height demand can ever exceed what this column is
                  actually given; both simply stretch to fill their
                  share. */}
              <div className="grid min-h-0 grid-rows-[3fr_2fr] gap-2">
                <GradientCard contentClassName="flex min-h-0 flex-col p-3">
                  <PanelTitle text="CLIENT ID" />
                  <div className="relative mt-2 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-royal-light/25 bg-navy">
                    <PersonSilhouette className="h-[55%] w-auto text-white/25" />
                    <span
                      aria-hidden="true"
                      className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border border-royal-light/40 bg-navy-light text-royal-light"
                      title="Photo upload not yet available"
                    >
                      <CameraIcon className="h-4 w-4" />
                    </span>
                  </div>
                </GradientCard>

                <GradientCard contentClassName="flex min-h-0 flex-col p-3">
                  <PanelTitle text="TODAY'S LOOK" />
                  <div className="mt-2 flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-royal-light/30 text-center">
                    <ScissorsIcon className="h-[clamp(1.5rem,3vw,2.4rem)] w-[clamp(1.5rem,3vw,2.4rem)] text-royal-light/70" />
                    <p className="px-3 text-[clamp(0.6rem,0.78vw,0.78rem)] uppercase tracking-wide text-white/50">
                      Today&apos;s look will appear here
                    </p>
                  </div>
                </GradientCard>
              </div>

              {/* RIGHT column — same fixed-fr rationale as the left
                  column; Client Profile's field list additionally
                  gets its own overflow-auto as a backstop, so if it
                  ever genuinely can't fit (e.g. a very small viewport)
                  it scrolls internally instead of pushing this
                  column, and the page, taller than the screen. */}
              <div className="grid min-h-0 grid-rows-[3fr_2fr] gap-2">
                <GradientCard contentClassName="flex min-h-0 flex-col p-4">
                  <PanelTitle text="CLIENT PROFILE" />
                  <div className="mt-1.5 h-px bg-gradient-to-r from-royal-light/60 via-royal-light/20 to-transparent" />
                  <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-5 overflow-auto">
                    <div>
                      <p className="mb-1.5 text-[clamp(0.58rem,0.7vw,0.7rem)] font-semibold uppercase tracking-widest text-white/50">
                        Contact Information
                      </p>
                      <div className="flex flex-col gap-1.5">
                        <FieldRow icon={<PersonIcon className="h-[1.1em] w-[1.1em]" />} label="Name" value={client?.name ?? null} />
                        <FieldRow icon={<PhoneIcon className="h-[1.1em] w-[1.1em]" />} label="Phone" value={client?.phone ?? null} />
                        <FieldRow icon={<EnvelopeIcon className="h-[1.1em] w-[1.1em]" />} label="Email" value={null} />
                        <FieldRow
                          icon={<GroupIcon className="h-[1.1em] w-[1.1em]" />}
                          label="Emergency Contact"
                          value={client?.emergencyContact ?? null}
                        />
                      </div>
                    </div>
                    <div className="border-l border-royal-light/15 pl-5">
                      <p className="mb-1.5 text-[clamp(0.58rem,0.7vw,0.7rem)] font-semibold uppercase tracking-widest text-white/50">
                        Client Information
                      </p>
                      <div className="flex flex-col gap-1.5">
                        <FieldRow
                          icon={<CalendarIcon className="h-[1.1em] w-[1.1em]" />}
                          label="Client Since"
                          value={formatDateShort(client?.clientSince ?? null)}
                        />
                        <FieldRow
                          icon={<ChartIcon className="h-[1.1em] w-[1.1em]" />}
                          label="Total Visits"
                          value={client ? String(client.totalVisits) : null}
                        />
                        <FieldRow icon={<WaveIcon className="h-[1.1em] w-[1.1em]" />} label="Hair Type" value={client?.hairType ?? null} />
                        <FieldRow icon={<DropletIcon className="h-[1.1em] w-[1.1em]" />} label="Hair Colour" value={client?.hairColour ?? null} />
                        <FieldRow
                          icon={<ScalpIcon className="h-[1.1em] w-[1.1em]" />}
                          label="Scalp Condition"
                          value={client?.scalpCondition ?? null}
                        />
                        <FieldRow
                          icon={<ShieldIcon className="h-[1.1em] w-[1.1em]" />}
                          label="Skin Sensitivity"
                          value={client?.skinSensitivity ?? null}
                        />
                        <FieldRow icon={<WarningIcon className="h-[1.1em] w-[1.1em]" />} label="Allergies" value={client?.allergies ?? null} />
                        <FieldRow icon={<DocumentIcon className="h-[1.1em] w-[1.1em]" />} label="Key Notes" value={null} />
                      </div>
                    </div>
                  </div>
                </GradientCard>

                <GradientCard contentClassName="flex min-h-0 flex-col p-4">
                  <div ref={countdownRef} className="flex min-h-0 flex-1 flex-col bg-navy-light p-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-[1.1em] w-[1.1em] text-royal-light" />
                        <PanelTitle text="COUNTDOWN TIMER" />
                      </div>
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        aria-label="Toggle fullscreen"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-royal-light/30 text-royal-light transition hover:bg-white/5"
                      >
                        <ExpandIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-1 items-center justify-center gap-[clamp(0.6rem,1.6vw,1.6rem)]">
                      {[
                        { value: hh, label: "Hours" },
                        { value: mm, label: "Minutes" },
                        { value: ss, label: "Seconds" },
                      ].map((unit, i, arr) => (
                        <div key={unit.label} className="flex items-center gap-[clamp(0.6rem,1.6vw,1.6rem)]">
                          <div className="flex flex-col items-center">
                            <span className="font-display text-[clamp(1.8rem,5vw,4rem)] leading-none text-white">{unit.value}</span>
                            <span className="mt-1.5 text-[clamp(0.55rem,0.7vw,0.72rem)] uppercase tracking-widest text-white/50">
                              {unit.label}
                            </span>
                          </div>
                          {i < arr.length - 1 && (
                            <span className="font-display text-[clamp(1.4rem,3.5vw,2.8rem)] text-royal-light/60">:</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </GradientCard>
              </div>
            </div>

            {/* BOTTOM — Previous / Barber Insights / Next */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                disabled={index <= 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="flex items-center justify-center gap-2 rounded-xl border border-royal-light/35 bg-navy-light px-4 py-1.5 text-[clamp(0.7rem,0.95vw,0.95rem)] font-semibold uppercase tracking-wide text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowLeftIcon className="h-[1.1em] w-[1.1em]" />
                Previous Client
              </button>

              <button
                type="button"
                aria-label="Barber Insights (private)"
                title="Private to this barber"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-magenta to-royal px-4 py-1.5 text-[clamp(0.7rem,0.95vw,0.95rem)] font-semibold uppercase tracking-wide text-white shadow-[0_0_18px_-4px_rgba(255,61,154,0.7)] transition hover:brightness-110"
              >
                <LockIcon className="h-[1.1em] w-[1.1em]" />
                Barber Insights
              </button>

              <button
                type="button"
                disabled={index >= bookings.length - 1}
                onClick={() => setIndex((i) => Math.min(bookings.length - 1, i + 1))}
                className="flex items-center justify-center gap-2 rounded-xl border border-royal-light/35 bg-navy-light px-4 py-1.5 text-[clamp(0.7rem,0.95vw,0.95rem)] font-semibold uppercase tracking-wide text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Next Client
                <ArrowRightIcon className="h-[1.1em] w-[1.1em]" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
