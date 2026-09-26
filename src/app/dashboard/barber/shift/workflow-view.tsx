"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Anton } from "next/font/google";
import type { WorkflowBooking } from "@/lib/queries/barber-workflow";

// Tailwind's `font-display` token (tailwind.config.ts) points at
// `var(--font-anton)`, but nothing in this codebase actually defines
// that variable anywhere (no next/font/localFont call exists for it
// yet, on this page or any other), so it has always silently fallen
// back to plain sans-serif — the "too generic/light" headings this
// pass is meant to fix. Loading it here, scoped to just this route
// via next/font/google, fixes Workflow's own headings without editing
// the shared tailwind.config.ts or root layout that Calendar/Dashboard
// also depend on.
const anton = Anton({ weight: "400", subsets: ["latin"] });

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
const CloseIcon = (p: { className?: string }) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
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
    <h2 className={`${anton.className} text-[clamp(0.95rem,1.3vw,1.3rem)] uppercase tracking-normal text-white`}>
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
    <div
      className={`min-h-0 rounded-2xl bg-gradient-to-br from-royal-light via-royal to-magenta p-[1.5px] shadow-[0_0_30px_-4px_rgba(91,155,255,0.65),0_0_46px_-10px_rgba(255,61,154,0.45)] ${className}`}
    >
      {/* Subtle diagonal light sweep for panel depth, matching the
          approved master's premium (not flat) panel fill — a fixed
          low-opacity gradient, not per-panel imagery. */}
      <div
        className={`relative h-full min-h-0 w-full overflow-hidden rounded-[15px] bg-navy-light ${contentClassName}`}
        style={{ backgroundImage: "linear-gradient(135deg, rgba(91,155,255,0.10) 0%, rgba(91,155,255,0) 32%, rgba(255,61,154,0) 68%, rgba(255,61,154,0.07) 100%)" }}
      >
        {children}
      </div>
    </div>
  );
}

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-[1.6em] w-[1.6em] flex-none items-center justify-center text-royal-light">{icon}</span>
      <span className="w-[6.5em] flex-none truncate text-[clamp(0.68rem,0.85vw,0.85rem)] text-white/85 sm:w-[7.5em]">{label}</span>
      <span
        className={`min-w-0 flex-1 truncate rounded-md border border-royal-light/45 bg-navy/70 px-2.5 py-0.5 text-[clamp(0.68rem,0.85vw,0.85rem)] ${
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

  const [insightsOpen, setInsightsOpen] = useState(false);

  // Whole-page full screen (browser Fullscreen API on the page). Separate
  // from the Countdown Timer's own full screen below; Esc exits either
  // back to Workflow. The X link is the only way back to the dashboard.
  function togglePageFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }

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
        <div className="absolute right-3 top-3 z-30 flex gap-2">
          <button
            type="button"
            onClick={togglePageFullscreen}
            aria-label="Full screen"
            title="Full screen (Esc to exit)"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-royal-light/40 bg-navy-light text-royal-light transition hover:bg-white/5"
          >
            <ExpandIcon className="h-4 w-4" />
          </button>
          <Link
            href="/dashboard/barber"
            aria-label="Close and return to dashboard"
            title="Back to dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-royal-light/40 bg-navy-light text-royal-light transition hover:bg-white/5"
          >
            <CloseIcon className="h-4 w-4" />
          </Link>
        </div>
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
              <div className="grid min-h-0 grid-rows-[1fr] gap-2">
                <GradientCard contentClassName="flex min-h-0 flex-col p-3">
                  <PanelTitle text="CLIENT ID" />
                  <div className="relative mt-2 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-royal-light/25 bg-navy">
                    {client?.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={client.photoUrl} alt={`${client.name}`} className="h-full w-full object-cover" />
                    ) : (
                      <PersonSilhouette className="h-[55%] w-auto text-white/25" />
                    )}
                  </div>
                  <p className="mt-2 text-center text-[clamp(0.68rem,0.85vw,0.85rem)] uppercase tracking-widest text-white/70">
                    POLAR ID <span className="text-white">{client?.polarId ?? "—"}</span>
                  </p>
                </GradientCard>
              </div>

              {/* RIGHT column — same fixed-fr rationale as the left
                  column; Client Profile's field list additionally
                  gets its own overflow-auto as a backstop, so if it
                  ever genuinely can't fit (e.g. a very small viewport)
                  it scrolls internally instead of pushing this
                  column, and the page, taller than the screen. */}
              <div className="grid min-h-0 grid-rows-[7fr_5fr] gap-2">
                <GradientCard contentClassName="flex min-h-0 flex-col p-4">
                  <PanelTitle text="CLIENT PROFILE" />
                  <div className="mt-1.5 h-px bg-gradient-to-r from-royal-light/60 via-royal-light/20 to-transparent" />
                  <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-5 overflow-auto">
                    <div>
                      <p className="mb-1.5 text-[clamp(0.58rem,0.7vw,0.7rem)] font-semibold uppercase tracking-widest text-white/50">
                        Appointment
                      </p>
                      <div className="flex flex-col gap-1.5">
                        <FieldRow icon={<PersonIcon className="h-[1.1em] w-[1.1em]" />} label="Name" value={client?.name ?? null} />
                        <FieldRow
                          icon={<ClockIcon className="h-[1.1em] w-[1.1em]" />}
                          label="Time"
                          value={current ? `${current.startTime}–${current.endTime}` : null}
                        />
                        <FieldRow
                          icon={<DocumentIcon className="h-[1.1em] w-[1.1em]" />}
                          label="Service"
                          value={current?.serviceName ? `${current.serviceName}${current.isBarter ? " (barter)" : ""}` : null}
                        />
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
                        <FieldRow icon={<WaveIcon className="h-[1.1em] w-[1.1em]" />} label="Hair Texture" value={client?.hairTexture ?? null} />
                        <FieldRow icon={<WaveIcon className="h-[1.1em] w-[1.1em]" />} label="Hair Density" value={client?.hairDensity ?? null} />
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
                        <FieldRow icon={<DocumentIcon className="h-[1.1em] w-[1.1em]" />} label="Key Notes" value={client?.keyNotes ?? null} />
                      </div>
                    </div>
                  </div>
                </GradientCard>

                <GradientCard contentClassName="flex min-h-0 flex-col p-4">
                  <div ref={countdownRef} className="flex min-h-0 flex-1 flex-col bg-navy-light p-1 [&:fullscreen]:items-center [&:fullscreen]:justify-center [&:fullscreen]:bg-navy">
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
                            <span className={`${anton.className} text-[clamp(2rem,5.6vw,4.4rem)] leading-none text-white`}>{unit.value}</span>
                            <span className="mt-1.5 text-[clamp(0.55rem,0.7vw,0.72rem)] uppercase tracking-widest text-white/50">
                              {unit.label}
                            </span>
                          </div>
                          {i < arr.length - 1 && (
                            <span className={`${anton.className} text-[clamp(1.4rem,3.5vw,2.8rem)] text-royal-light/60`}>:</span>
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
                className={`${anton.className} flex items-center justify-center gap-2 rounded-xl border border-royal-light/40 bg-navy-light px-4 py-2 text-[clamp(0.8rem,1.05vw,1.05rem)] uppercase tracking-normal text-white shadow-[0_0_16px_-6px_rgba(91,155,255,0.6)] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35`}
              >
                <ArrowLeftIcon className="h-[1.1em] w-[1.1em]" />
                Previous Client
              </button>

              <div className="relative">
              {insightsOpen && (
                <div
                  role="dialog"
                  aria-label="Barber Insights"
                  className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-xl border border-royal-light/40 bg-navy-light p-3 shadow-[0_0_24px_-6px_rgba(91,155,255,0.6)]"
                >
                  <p className="text-[clamp(0.6rem,0.72vw,0.72rem)] uppercase tracking-widest text-white/50">Private — only you can see these</p>
                  {!client || client.insights.length === 0 ? (
                    <p className="mt-2 text-sm text-white/60">
                      No insights set up yet.{" "}
                      <Link href="/dashboard/barber/insights" className="underline">
                        Create insight questions
                      </Link>
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {client.insights.map((i) => (
                        <li key={i.label} className="flex justify-between gap-3 text-sm">
                          <span className="text-white/75">{i.label}</span>
                          <span className={i.value ? "text-white" : "text-white/30"}>{i.value ?? "—"}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {client && (
                    <Link href={`/dashboard/barber/clients/${client.id}`} className="mt-2 inline-block text-xs text-royal-light underline">
                      Edit on client profile
                    </Link>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setInsightsOpen((v) => !v)}
                aria-expanded={insightsOpen}
                aria-label="Barber Insights (private)"
                title="Private to this barber"
                className={`${anton.className} flex h-full w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-magenta to-royal px-4 py-2 text-[clamp(0.8rem,1.05vw,1.05rem)] uppercase tracking-normal text-white shadow-[0_0_22px_-4px_rgba(255,61,154,0.75)] transition hover:brightness-110`}
              >
                <LockIcon className="h-[1.1em] w-[1.1em]" />
                Barber Insights
              </button>
              </div>

              <button
                type="button"
                disabled={index >= bookings.length - 1}
                onClick={() => setIndex((i) => Math.min(bookings.length - 1, i + 1))}
                className={`${anton.className} flex items-center justify-center gap-2 rounded-xl border border-royal-light/40 bg-navy-light px-4 py-2 text-[clamp(0.8rem,1.05vw,1.05rem)] uppercase tracking-normal text-white shadow-[0_0_16px_-6px_rgba(91,155,255,0.6)] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35`}
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
