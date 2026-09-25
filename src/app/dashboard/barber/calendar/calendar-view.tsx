"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { formatTime12h } from "@/lib/dates";
import type { CalendarBooking } from "@/lib/queries/barber-calendar";
import type { DayCapacity } from "@/lib/calendar/capacity";
import { createWalkIn } from "@/lib/actions/walk-ins";
import { cancelBookingAsBarber } from "@/lib/actions/barber-bookings";
import { createBookingAsBarber, createBarterBooking, createBlockedTime } from "@/lib/actions/barber-calendar-actions";
import { Barlow_Condensed, Permanent_Marker } from "next/font/google";
import { FocusModeShell, ACCENTS, type FrameSplatter } from "@/components/focus-mode/focus-mode-shell";
import { BarberRoom } from "../dashboard-scene";

export type ViewKind = "day" | "week" | "month" | "list" | "year";
export type MonthCell = { date: string; day: number; count: number; isFullyBooked: boolean; capacity?: DayCapacity } | null;
type Service = { id: string; name: string; durationMinutes: number; price: number };
type Client = { id: string; fullName: string };

// Calendar Focus Mode (desktop), built to the approved CALENDAR-UI
// reference: real HTML inside the reusable FocusModeShell, over the
// darkened POLAR Room. Only the paint splatter at the frame corners is
// imagery (paint only, cut from the reference); every word, date and
// booking is live. All booking data, actions and modals are unchanged.
const PINK = ACCENTS.magenta;
const GRID_LINE = `rgba(${ACCENTS.magenta.rgb},0.34)`;
const PINK_OUTLINE: React.CSSProperties = {
  borderColor: `rgba(${ACCENTS.magenta.rgb},0.85)`,
  boxShadow: `0 0 10px -2px rgba(${ACCENTS.magenta.rgb},0.6), inset 0 0 6px rgba(${ACCENTS.magenta.rgb},0.2)`,
};
const BTN = "flex h-11 shrink-0 items-center rounded-xl border-2 bg-black/40 text-white transition hover:bg-white/5";

// POLAR graffiti identity for the title; bold condensed italic for the
// period ("SEPTEMBER 2026" etc.) and condensed UI text — defined once,
// so every month/year renders with the identical treatment.
const graffiti = Permanent_Marker({ subsets: ["latin"], weight: "400" });
const ui = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700", "800"], style: ["normal", "italic"] });

const SPLATTER: FrameSplatter = {
  src: {
    tl: "/dashboard/focus/calendar-splat-tl.webp",
    tr: "/dashboard/focus/calendar-splat-tr.webp",
    bl: "/dashboard/focus/calendar-splat-bl.webp",
    br: "/dashboard/focus/calendar-splat-br.webp",
  },
  size: [240, 200],
  corner: { tl: [60, 66], tr: [181, 66], bl: [60, 122], br: [181, 122] },
  frameWidth: 1481,
};

const TABS: { view: ViewKind; label: string }[] = [
  { view: "day", label: "Day" },
  { view: "week", label: "Week" },
  { view: "month", label: "Month" },
  { view: "list", label: "List" },
];
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

type PickAction = "book" | "walkin" | "block";
const ACTION_META: Record<PickAction, { label: string; verb: string }> = {
  book: { label: "Add Appointment", verb: "add an appointment" },
  walkin: { label: "Add Walk-In", verb: "add a walk-in" },
  block: { label: "Block Time", verb: "block time" },
};

function CalendarGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="h-14 w-14 shrink-0" fill="none" stroke={ACCENTS.magenta.hex} strokeWidth="3.4" strokeLinecap="round" aria-hidden="true" style={{ filter: `drop-shadow(0 0 6px rgba(${ACCENTS.magenta.rgb},0.8))` }}>
      <rect x="5" y="9" width="38" height="34" rx="6" />
      <path d="M5 18h38M15 5v8M33 5v8" />
      <g fill={ACCENTS.magenta.hex} stroke="none">
        <circle cx="15" cy="27" r="2.6" />
        <circle cx="24" cy="27" r="2.6" />
        <circle cx="33" cy="27" r="2.6" />
        <circle cx="15" cy="35" r="2.6" />
        <circle cx="24" cy="35" r="2.6" />
      </g>
    </svg>
  );
}

function CrownGlyph() {
  return (
    <svg viewBox="0 0 48 34" className="h-10 w-14 shrink-0 -translate-y-2" fill="none" stroke={ACCENTS.magenta.hex} strokeWidth="3" strokeLinejoin="round" aria-hidden="true" style={{ filter: `drop-shadow(0 0 6px rgba(${ACCENTS.magenta.rgb},0.8))` }}>
      <path d="M4 10l9 9 11-15 11 15 9-9-4 20H8z" />
      <path d="M10 30h28" />
    </svg>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={ACCENTS.magenta.hex} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

// POLAR Capacity View — each working day's cell fills from the bottom
// like a battery, to booked ÷ bookable minutes (lib/calendar/capacity).
// Kept deliberately subtle so dates, text and grid lines stay readable.
const CAPACITY_FILL_ALPHA = { top: 0.1, bottom: 0.26 };
const CAPACITY_EDGE_ALPHA = 0.38;
const OFF_HATCH = "repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 10px)";

function capacityLabel(capacity: DayCapacity | undefined): string {
  if (!capacity) return "";
  if (capacity.status === "off") return ", not a working day";
  if (capacity.status === "blocked") return ", blocked";
  return `, ${Math.round(capacity.ratio! * 100)}% booked`;
}

function CapacityFill({ capacity }: { capacity: DayCapacity | undefined }) {
  if (!capacity) return null;
  // Non-working and fully-blocked days are shown as unavailable, never as 0%.
  if (capacity.status !== "open") {
    return <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: OFF_HATCH }} />;
  }
  const pct = Math.min(1, Math.max(0, capacity.ratio!)) * 100;
  if (pct === 0) return null;
  const { rgb } = ACCENTS.magenta;
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 transition-[height] duration-500"
      style={{
        height: `${pct}%`,
        background: `linear-gradient(0deg, rgba(${rgb},${CAPACITY_FILL_ALPHA.bottom}) 0%, rgba(${rgb},${CAPACITY_FILL_ALPHA.top}) 100%)`,
        borderTop: pct < 100 ? `1.5px solid rgba(${rgb},${CAPACITY_EDGE_ALPHA})` : undefined,
      }}
    />
  );
}

/** "SEPTEMBER 2026" style period title — any trailing year is pink. */
function PeriodTitle({ text }: { text: string }) {
  const m = text.toUpperCase().match(/^(.*?)(\s\d{4})?$/);
  return (
    <div className="relative mx-1 shrink-0 2xl:mx-3">
      <p className="cal-period relative z-10 whitespace-nowrap" style={{ fontSize: "clamp(24px, 2.1vw, 40px)" }}>
        {m?.[1]}
        {m?.[2] && <span style={{ color: ACCENTS.magenta.hex }}>{m[2]}</span>}
      </p>
      {/* Pink paint swash under the period, as in the reference. */}
      <svg viewBox="0 0 300 18" preserveAspectRatio="none" className="absolute -bottom-2 left-[-4%] h-3 w-[108%]" aria-hidden="true">
        <path d="M2 11c60-6 140-8 220-6 30 1 55 2 76 4-24 2-50 3-78 3-70 1-150 3-218 2z" fill={ACCENTS.magenta.hex} opacity="0.9" />
        <path d="M120 12c2 3 1 5 0 6M150 12c1 2 1 3 0 4M95 12c1 2 0 3 0 3" stroke={ACCENTS.magenta.hex} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function ActionButton({ kind, onPick, view, date }: { kind: PickAction; onPick: (k: PickAction) => void; view: ViewKind; date: string }) {
  const style: React.CSSProperties =
    kind === "book"
      ? { background: ACCENTS.magenta.hex, borderColor: ACCENTS.magenta.hex, boxShadow: `0 0 16px -2px rgba(${ACCENTS.magenta.rgb},0.8)` }
      : kind === "walkin"
        ? { borderColor: ACCENTS.cyan.hex, color: ACCENTS.cyan.hex, boxShadow: `0 0 12px -2px rgba(${ACCENTS.cyan.rgb},0.7), inset 0 0 6px rgba(${ACCENTS.cyan.rgb},0.2)` }
        : PINK_OUTLINE;
  const icon =
    kind === "book" ? (
      <path d="M12 5v14M5 12h14" />
    ) : kind === "walkin" ? (
      <>
        <circle cx="13" cy="4.5" r="2" />
        <path d="M11 9l-3 4 3 1-1 7M11 9l3 3 4 1M13 14l2 7" />
      </>
    ) : (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </>
    );
  const inner = (
    <>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={kind === "block" ? { color: ACCENTS.magenta.hex } : undefined}>
        {icon}
      </svg>
      {ACTION_META[kind].label}
    </>
  );
  const cls = `${BTN} gap-2 px-3 text-base font-bold 2xl:px-4`;
  // Actions need a real free slot: in Day view they highlight the free
  // slots to pick from; elsewhere they open the selected date's Day view
  // in that mode. The existing booking dialogs do the rest.
  return view === "day" ? (
    <button type="button" onClick={() => onPick(kind)} className={cls} style={style}>
      {inner}
    </button>
  ) : (
    <Link href={`?view=day&date=${date}&action=${kind}`} className={cls} style={style}>
      {inner}
    </Link>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function addMonths(dateStr: string, months: number): string {
  const [y, m] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-01`;
}
function addYears(dateStr: string, years: number): string {
  const [y, m, day] = dateStr.split("-").map(Number);
  return `${y + years}-${pad(m)}-${pad(day)}`;
}
function monthLabel(dateStr: string): string {
  const [y, m] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}
function dayLabel(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
function fullDateLabel(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
function startOfWeekMonday(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const mondayIndex = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - mondayIndex);
  return d.toISOString().slice(0, 10);
}
function weekRangeLabel(dateStr: string): string {
  const start = startOfWeekMonday(dateStr);
  const end = addDays(start, 6);
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const sameMonth = startDate.getUTCMonth() === endDate.getUTCMonth() && startDate.getUTCFullYear() === endDate.getUTCFullYear();
  if (sameMonth) {
    return `${startDate.getUTCDate()} – ${endDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`;
  }
  const startFmt = startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const endFmt = endDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return `${startFmt} – ${endFmt}`;
}
function periodLabel(view: ViewKind, dateStr: string): string {
  if (view === "day") return fullDateLabel(dateStr);
  if (view === "week") return weekRangeLabel(dateStr);
  if (view === "year") return dateStr.slice(0, 4);
  return monthLabel(dateStr); // month + list
}
function money(n: number): string {
  return `£${n.toFixed(2)}`;
}
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pad(h)}:${pad(m)}`;
}

type TimelineSegment =
  | { kind: "available"; start: string; end: string }
  | { kind: "booking"; start: string; end: string; booking: CalendarBooking };

function buildTimeline(availability: { startTime: string; endTime: string }[], bookings: CalendarBooking[]): TimelineSegment[] {
  const points = new Set<string>();
  for (const w of availability) {
    points.add(w.startTime);
    points.add(w.endTime);
  }
  for (const b of bookings) {
    points.add(b.startTime);
    points.add(b.endTime);
  }
  const sorted = [...points].sort();
  const segments: TimelineSegment[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    const covering = bookings.find((b) => b.startTime <= start && b.endTime >= end);
    if (covering) {
      if (segments.length > 0) {
        const prev = segments[segments.length - 1];
        if (prev.kind === "booking" && prev.booking.id === covering.id) {
          prev.end = end;
          continue;
        }
      }
      segments.push({ kind: "booking", start, end, booking: covering });
      continue;
    }
    const withinAvailability = availability.some((w) => w.startTime <= start && w.endTime >= end);
    if (withinAvailability) {
      const prev = segments[segments.length - 1];
      if (prev && prev.kind === "available") {
        prev.end = end;
        continue;
      }
      segments.push({ kind: "available", start, end });
    }
  }

  return segments;
}

function bookingKindLabel(b: CalendarBooking): string {
  if (b.isBlocked) return b.isBreak ? "BREAK" : "BLOCKED";
  if (b.isBarter) return "BARTER";
  if (b.isWalkIn) return "WALK-IN";
  return b.clientName ?? "Appointment";
}

// Six visually distinct-but-restrained treatments (Day view
// requirement 6) drawn only from the existing POLAR palette
// (royal/ice/magenta/white) — nothing invented. A faint state-tinted
// fill (in addition to the border) gives the timeline a POLAR "card"
// feel at a glance rather than reading as plain bordered HTML rows.
function bookingKindClass(b: CalendarBooking): string {
  if (b.isBlocked) {
    return b.isBreak
      ? "border-dashed border-white/30 bg-white/[0.02] text-white/70"
      : "border-white/15 bg-white/[0.015] text-white/40";
  }
  if (b.isBarter) return "border-magenta/40 bg-magenta/[0.05] text-magenta";
  if (b.isWalkIn) return "border-ice-glow/40 bg-ice-glow/[0.05] text-ice-100";
  return "border-royal/50 bg-royal/[0.07] text-white";
}

export function CalendarView({
  view,
  date,
  today,
  services,
  clients,
  todaySummary,
  monthCells,
  dayData,
  weekDays,
  listDays,
  yearMonths,
  action = null,
}: {
  view: ViewKind;
  date: string;
  today: string;
  services: Service[];
  clients: Client[];
  todaySummary: { count: number; nextTime: string | null };
  monthCells: MonthCell[] | null;
  dayData: { availability: { startTime: string; endTime: string }[]; bookings: CalendarBooking[] } | null;
  weekDays: { date: string; label: string; count: number; isFullyBooked: boolean; hasAvailability: boolean; bookings: CalendarBooking[] }[] | null;
  listDays: { date: string; bookings: CalendarBooking[] }[] | null;
  yearMonths: { month: number; label: string; cells: MonthCell[] }[] | null;
  /** Header action (Add Appointment / Walk-In / Block Time) carried into Day view. */
  action?: PickAction | null;
}) {
  const [activeSlot, setActiveSlot] = useState<{ start: string; end: string } | null>(null);
  const [modal, setModal] = useState<"book" | "walkin" | "barter" | "block" | null>(null);
  const [detail, setDetail] = useState<CalendarBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pickAction, setPickAction] = useState<PickAction | null>(action);
  function startPick(kind: PickAction) {
    setPickAction(kind);
  }

  // Month grid with the neighbouring months' days filled in (dimmed), as
  // in the approved design — all derived from the real month's dates.
  const monthGrid = useMemo(() => {
    if (!monthCells) return null;
    const firstIdx = monthCells.findIndex((c) => c);
    let lastIdx = -1;
    monthCells.forEach((c, i) => {
      if (c) lastIdx = i;
    });
    if (firstIdx < 0) return null;
    const first = monthCells[firstIdx]!.date;
    const last = monthCells[lastIdx]!.date;
    return monthCells.map((c, i) => {
      if (c) return { ...c, inMonth: true };
      const d = i < firstIdx ? addDays(first, i - firstIdx) : addDays(last, i - lastIdx);
      return { date: d, day: Number(d.slice(8)), count: 0, isFullyBooked: false, inMonth: false };
    });
  }, [monthCells]);

  const prevHref = useMemo(() => {
    if (view === "day") return `?view=day&date=${addDays(date, -1)}`;
    if (view === "week") return `?view=week&date=${addDays(date, -7)}`;
    if (view === "year") return `?view=year&date=${addYears(date, -1)}`;
    return `?view=${view}&date=${addMonths(date, -1)}`;
  }, [view, date]);
  const nextHref = useMemo(() => {
    if (view === "day") return `?view=day&date=${addDays(date, 1)}`;
    if (view === "week") return `?view=week&date=${addDays(date, 7)}`;
    if (view === "year") return `?view=year&date=${addYears(date, 1)}`;
    return `?view=${view}&date=${addMonths(date, 1)}`;
  }, [view, date]);
  const todayHref = `?view=${view}&date=${today}`;

  const timeline = useMemo(() => (dayData ? buildTimeline(dayData.availability, dayData.bookings) : []), [dayData]);

  function closeModal() {
    setModal(null);
    setActiveSlot(null);
    setError(null);
  }

  function runAction(action: () => Promise<{ error: string } | void>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result && "error" in result) {
        setError(result.error);
      } else {
        closeModal();
        setDetail(null);
      }
    });
  }

  function handleCancel(bookingId: string) {
    runAction(async () => {
      const fd = new FormData();
      fd.set("booking_id", bookingId);
      return cancelBookingAsBarber(fd);
    });
  }

  function handleBlockWholeDay() {
    runAction(async () => {
      const fd = new FormData();
      fd.set("date", date);
      fd.set("start_time", "00:00");
      fd.set("end_time", "23:59");
      fd.set("label", "Day off");
      return createBlockedTime(fd);
    });
  }

  return (
    <div id="barber-calendar-page">
      <style>{`
        div:has(> #barber-calendar-page) > nav {
          display: none;
        }
        .cal-title {
          display: inline-block;
          transform: rotate(-4deg) skewX(-8deg);
          background: linear-gradient(180deg, #ffffff 0%, #e8e8ee 45%, #a9a9b6 70%, #f4f4f8 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.8)) drop-shadow(0 0 8px rgba(255, 31, 180, 0.35));
          padding: 0.05em 0.1em;
        }
        .cal-period {
          font-weight: 800;
          font-style: italic;
          letter-spacing: 0.01em;
          line-height: 1;
          color: #fff;
          text-shadow: 0 2px 0 rgba(0, 0, 0, 0.7);
        }
      `}</style>

      {/* Mobile — simple functional placeholder; the immersive layered
          design below is desktop-only, matching the rest of the
          Barber Portal. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">Calendar</h1>
        <p className="mt-2 text-sm text-polar-muted">
          {todaySummary.count === 0
            ? "No appointments today."
            : `${todaySummary.count} appointment${todaySummary.count === 1 ? "" : "s"} today${
                todaySummary.nextTime ? `, next at ${formatTime12h(todaySummary.nextTime)}` : ""
              }.`}
        </p>
        <p className="mt-4 text-sm text-polar-muted">
          Full calendar management is available on desktop.
        </p>
      </main>

      {/* Desktop — Calendar Focus Mode: the POLAR Room with its lights
          off, and the approved neon Calendar panel on top. Every label,
          date and booking below is live HTML driven by real data. */}
      <FocusModeShell
        id="calendar"
        accent="magenta"
        room={<BarberRoom decorative />}
        className={ui.className}
        splatter={SPLATTER}
        heading={
          <div className="flex items-center gap-4">
            <CalendarGlyph />
            <h1 className={`${graffiti.className} cal-title leading-none`} style={{ fontSize: "clamp(40px, 3.6vw, 64px)" }}>
              Calendar
            </h1>
            <CrownGlyph />
          </div>
        }
        toolbar={
          <>
            <Link href={todayHref} className={`${BTN} px-4 text-lg font-bold 2xl:px-5`} style={{ ...PINK_OUTLINE, color: PINK.hex }}>
              Today
            </Link>
            <Link href={prevHref} aria-label="Previous" className={`${BTN} w-11 justify-center 2xl:w-12`} style={PINK_OUTLINE}>
              <Chevron dir="left" />
            </Link>
            <Link href={nextHref} aria-label="Next" className={`${BTN} w-11 justify-center 2xl:w-12`} style={PINK_OUTLINE}>
              <Chevron dir="right" />
            </Link>

            <PeriodTitle text={periodLabel(view, date)} />

            <div className="ml-auto flex flex-wrap items-center gap-2 2xl:gap-3">
              <div role="tablist" aria-label="Calendar view" className="flex h-11 overflow-hidden rounded-xl border-2" style={{ borderColor: `rgba(${PINK.rgb},0.7)` }}>
                {TABS.map(({ view: v, label }) => {
                  const active = view === v;
                  return (
                    <Link
                      key={v}
                      role="tab"
                      aria-selected={active}
                      href={`?view=${v}&date=${date}`}
                      className={`flex items-center px-3.5 text-base font-bold transition 2xl:px-5 ${active ? "text-white" : "text-white/90 hover:bg-white/5"}`}
                      style={active ? { background: PINK.hex, boxShadow: `0 0 16px rgba(${PINK.rgb},0.7)` } : undefined}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
              <ActionButton kind="book" onPick={startPick} view={view} date={date} />
              <ActionButton kind="walkin" onPick={startPick} view={view} date={date} />
              <ActionButton kind="block" onPick={startPick} view={view} date={date} />
            </div>
          </>
        }
      >
        {/* MONTH */}
        {view === "month" && monthGrid && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-2" style={{ borderColor: GRID_LINE }}>
            <div className="grid shrink-0 grid-cols-7">
              {WEEKDAYS.map((d, i) => (
                <div
                  key={d}
                  className="py-2 text-center text-lg font-bold tracking-wide"
                  style={{ color: i === 6 ? PINK.hex : "#fff", borderLeft: i ? `1px solid ${GRID_LINE}` : undefined, borderBottom: `1.5px solid ${GRID_LINE}` }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-7" style={{ gridTemplateRows: `repeat(${monthGrid.length / 7}, minmax(0, 1fr))` }}>
              {monthGrid.map((cell, i) => {
                const col = i % 7;
                const lastRow = i >= monthGrid.length - 7;
                const isToday = cell.inMonth && cell.date === today;
                const isSelected = cell.inMonth && cell.date === date && !isToday;
                const lines = { borderLeft: col ? `1px solid ${GRID_LINE}` : undefined, borderBottom: lastRow ? undefined : `1px solid ${GRID_LINE}` };
                const numberColor = !cell.inMonth ? "rgba(255,255,255,0.35)" : isToday || col === 6 ? PINK.hex : "#fff";
                return (
                  <Link
                    key={cell.date}
                    href={`?view=day&date=${cell.date}`}
                    aria-label={`${dayLabel(cell.date)}${cell.count > 0 ? `, ${cell.count} booking${cell.count === 1 ? "" : "s"}` : ""}${cell.inMonth ? capacityLabel(cell.capacity) : ""}`}
                    title={cell.inMonth ? capacityLabel(cell.capacity).replace(/^, /, "") || undefined : undefined}
                    className="relative flex min-h-0 flex-col px-3 pb-2 pt-2 transition hover:bg-white/[0.035]"
                    style={lines}
                  >
                    {cell.inMonth && <CapacityFill capacity={cell.capacity} />}
                    <span
                      className="relative flex h-11 w-11 flex-col items-center justify-center rounded-full text-2xl font-bold leading-none"
                      style={{
                        color: numberColor,
                        textShadow: cell.inMonth ? "0 1px 2px rgba(0,0,0,0.6)" : undefined,
                        ...(isToday
                          ? { border: `3px solid ${PINK.hex}`, boxShadow: `0 0 14px rgba(${PINK.rgb},0.85), inset 0 0 8px rgba(${PINK.rgb},0.45)`, marginLeft: -6 }
                          : isSelected
                            ? { border: `1.5px solid rgba(${PINK.rgb},0.8)`, marginLeft: -6 }
                            : undefined),
                      }}
                    >
                      {cell.day}
                      {cell.inMonth && cell.count > 0 && (
                        <span className="absolute bottom-[5px] h-1.5 w-1.5 rounded-full" style={{ background: PINK.hex }} aria-hidden="true" />
                      )}
                    </span>
                    {cell.inMonth && (cell.count > 0 || cell.capacity?.status === "blocked") && (
                      <span className="relative mt-auto flex items-baseline justify-between gap-2 text-sm font-semibold">
                        {cell.capacity?.status === "blocked" ? (
                          <span className="text-white/45">Blocked</span>
                        ) : (
                          <span className="truncate" style={{ color: cell.isFullyBooked ? "rgba(255,255,255,0.55)" : PINK.hex }}>
                            {cell.isFullyBooked ? "Fully booked" : `${cell.count} booking${cell.count === 1 ? "" : "s"}`}
                          </span>
                        )}
                        {cell.capacity?.status === "open" && cell.capacity.ratio! > 0 && (
                          <span className="shrink-0 text-xs text-white/60 tabular-nums">{Math.round(cell.capacity.ratio! * 100)}%</span>
                        )}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* WEEK */}
        {view === "week" && weekDays && (
          <div className="grid min-h-0 flex-1 grid-cols-7 overflow-hidden rounded-xl border-2" style={{ borderColor: GRID_LINE }}>
            {weekDays.map((d, i) => {
              const isToday = d.date === today;
              return (
                <div key={d.date} className="flex min-h-0 flex-col" style={{ borderLeft: i ? `1px solid ${GRID_LINE}` : undefined }}>
                  <Link
                    href={`?view=day&date=${d.date}`}
                    className="flex shrink-0 items-center justify-between px-3 py-2 transition hover:bg-white/[0.04]"
                    style={{ borderBottom: `1.5px solid ${GRID_LINE}` }}
                  >
                    <span className="text-lg font-bold" style={{ color: i === 6 ? PINK.hex : "#fff" }}>
                      {WEEKDAYS[i]}
                    </span>
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold"
                      style={{ color: isToday || i === 6 ? PINK.hex : "#fff", ...(isToday ? { border: `3px solid ${PINK.hex}`, boxShadow: `0 0 12px rgba(${PINK.rgb},0.8)` } : {}) }}
                    >
                      {Number(d.date.slice(8))}
                    </span>
                  </Link>
                  <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
                    {d.bookings.length === 0 ? (
                      <p className="px-1 pt-1 text-sm text-white/30">{d.hasAvailability ? "Available" : "Unavailable"}</p>
                    ) : (
                      d.bookings.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setDetail(b)}
                          className={`block w-full rounded-md border px-2 py-1.5 text-left transition hover:bg-white/[0.06] ${bookingKindClass(b)}`}
                        >
                          <span className="block text-xs opacity-75">{formatTime12h(b.startTime)} – {formatTime12h(b.endTime)}</span>
                          <span className="block truncate text-sm font-bold">{bookingKindLabel(b)}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DAY */}
        {view === "day" && dayData && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between pb-3">
              <p className="text-xl font-bold text-white">{dayLabel(date)}</p>
              <button
                type="button"
                onClick={handleBlockWholeDay}
                disabled={pending}
                className={`${BTN} px-4 text-base font-bold disabled:opacity-50`}
                style={{ ...PINK_OUTLINE, color: PINK.hex }}
              >
                Block whole day
              </button>
            </div>
            {pickAction && (
              <div className="mb-3 flex shrink-0 items-center justify-between rounded-lg border px-4 py-2.5 text-base" style={{ borderColor: `rgba(${PINK.rgb},0.6)`, background: `rgba(${PINK.rgb},0.08)` }}>
                <span className="font-semibold text-white">
                  {timeline.some((s) => s.kind === "available")
                    ? `Choose a free slot below to ${ACTION_META[pickAction].verb}.`
                    : "No free slots on this day — use ‹ › to pick another day."}
                </span>
                <button type="button" onClick={() => setPickAction(null)} className="text-sm font-bold text-white/60 hover:text-white">
                  Cancel
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {timeline.length === 0 ? (
                <p className="pt-2 text-base text-white/45">Unavailable — no working hours set for this day.</p>
              ) : (
                <ul className="space-y-2">
                  {timeline.map((seg, i) => (
                    <li key={i}>
                      {seg.kind === "available" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSlot({ start: seg.start, end: seg.end });
                            if (pickAction) {
                              setModal(pickAction);
                              setPickAction(null);
                            }
                          }}
                          className="flex w-full items-center justify-between rounded-lg border border-dashed px-4 py-3 text-left text-base text-white transition hover:bg-white/[0.05]"
                          style={{ borderColor: pickAction ? PINK.hex : `rgba(${PINK.rgb},0.4)`, boxShadow: pickAction ? `0 0 12px -4px rgba(${PINK.rgb},0.8)` : undefined }}
                        >
                          <span className="font-semibold">
                            {formatTime12h(seg.start)} – {formatTime12h(seg.end)}
                          </span>
                          <span className="text-sm tracking-[0.14em]" style={{ color: `rgba(${PINK.rgb},0.8)` }}>AVAILABLE</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDetail(seg.booking)}
                          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-base transition hover:bg-white/[0.06] ${bookingKindClass(seg.booking)}`}
                        >
                          <span className="font-semibold">
                            {formatTime12h(seg.start)} – {formatTime12h(seg.end)} ({timeToMinutes(seg.end) - timeToMinutes(seg.start)}m) · {bookingKindLabel(seg.booking)}
                          </span>
                          {seg.booking.serviceName && <span className="text-sm text-white/45">{seg.booking.serviceName}</span>}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* LIST */}
        {view === "list" && listDays && (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {listDays.length === 0 ? (
              <p className="pt-2 text-base text-white/45">No bookings in {monthLabel(date)}.</p>
            ) : (
              <div className="space-y-5">
                {listDays.map((d) => (
                  <section key={d.date}>
                    <Link
                      href={`?view=day&date=${d.date}`}
                      className="mb-2 inline-flex items-center gap-2 text-lg font-bold transition hover:text-white"
                      style={{ color: d.date === today ? PINK.hex : "rgba(255,255,255,0.85)" }}
                    >
                      {dayLabel(d.date)}
                      {d.date === today && <span className="text-xs tracking-[0.14em]">TODAY</span>}
                    </Link>
                    <ul className="space-y-1.5">
                      {d.bookings.map((b) => (
                        <li key={b.id}>
                          <button
                            type="button"
                            onClick={() => setDetail(b)}
                            className={`flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-2.5 text-left text-base transition hover:bg-white/[0.06] ${bookingKindClass(b)}`}
                          >
                            <span className="w-48 shrink-0 tabular-nums opacity-80">
                              {formatTime12h(b.startTime)} – {formatTime12h(b.endTime)}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-bold">{bookingKindLabel(b)}</span>
                            {b.serviceName && <span className="shrink-0 text-sm text-white/45">{b.serviceName}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}

        {/* YEAR — no tab; still served for existing ?view=year links. */}
        {view === "year" && yearMonths && (
          <div className="grid min-h-0 flex-1 grid-cols-4 content-start gap-3 overflow-y-auto">
            {yearMonths.map((m) => (
              <Link
                key={m.month}
                href={`?view=month&date=${date.slice(0, 4)}-${pad(m.month)}-01`}
                className="flex flex-col rounded-lg border p-3 transition hover:bg-white/[0.05]"
                style={{ borderColor: GRID_LINE }}
              >
                <span className="text-base font-bold text-white">{m.label}</span>
                <div className="mt-2 grid grid-cols-7 gap-[2px]">
                  {m.cells.map((c, i) => (
                    <span
                      key={i}
                      className="aspect-square rounded-sm"
                      style={{ background: !c ? "transparent" : c.count > 0 ? (c.isFullyBooked ? `rgba(${PINK.rgb},0.8)` : `rgba(${PINK.rgb},0.45)`) : "rgba(255,255,255,0.08)" }}
                    />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </FocusModeShell>

      {/* Booking dialogs — rendered outside the Focus panel (whose
          backdrop blur would otherwise contain these fixed overlays). */}
      {/* Slot action menu (Day view) */}
      {activeSlot && !modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setActiveSlot(null)}>
          <div
            className="relative w-72 rounded-xl border border-royal-light/30 bg-navy-light p-4 shadow-[0_0_32px_-6px_rgba(91,155,255,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveSlot(null)}
              aria-label="Close"
              className="absolute right-3 top-3 text-white/40 transition hover:text-white"
            >
              ✕
            </button>
            <p className="pr-6 font-display text-sm text-white">
              {formatTime12h(activeSlot.start)} – {formatTime12h(activeSlot.end)}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-royal-light/60">Available slot</p>
            <div className="mt-3 flex flex-col gap-2">
              <button type="button" onClick={() => setModal("book")} className="rounded-lg bg-gradient-to-r from-royal to-royal-dark px-3 py-2 text-left text-sm font-medium text-white shadow-[0_0_10px_-4px_rgba(91,155,255,0.6)] transition hover:brightness-110">
                Book Appointment
              </button>
              <button type="button" onClick={() => setModal("walkin")} className="rounded-lg border border-royal-light/30 px-3 py-2 text-left text-sm text-white transition hover:bg-royal-light/10">
                Add Walk-In
              </button>
              <button type="button" onClick={() => setModal("barter")} className="rounded-lg border border-magenta/40 px-3 py-2 text-left text-sm text-magenta transition hover:bg-magenta/10">
                Add Barter
              </button>
              <button type="button" onClick={() => setModal("block")} className="rounded-lg border border-white/15 px-3 py-2 text-left text-sm text-white/70 transition hover:bg-white/5">
                Block Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book / Walk-in / Barter / Block forms */}
      {activeSlot && modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="relative w-96 rounded-xl border border-royal-light/30 bg-navy-light p-5 shadow-[0_0_32px_-6px_rgba(91,155,255,0.3)]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="absolute right-3 top-3 text-white/40 transition hover:text-white"
            >
              ✕
            </button>
            <p className="pr-6 font-display text-white" style={{ fontSize: "1.1rem" }}>
              {modal === "book" && "Book Appointment"}
              {modal === "walkin" && "Add Walk-In"}
              {modal === "barter" && "Add Barter"}
              {modal === "block" && "Block Time"}
            </p>
            <p className="mt-1 text-xs text-white/50">
              {formatTime12h(activeSlot.start)} – {formatTime12h(activeSlot.end)} on {dayLabel(date)}
            </p>

            {modal === "book" && (
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  fd.set("date", date);
                  runAction(() => createBookingAsBarber(fd));
                }}
              >
                <select name="client_profile_id" required className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm text-white">
                  <option value="">Choose a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
                {clients.length === 0 && <p className="text-xs text-white/40">No linked clients yet — link one from the Clients page first.</p>}
                <ServiceAndStartFields services={services} gapStart={activeSlot.start} gapEnd={activeSlot.end} />
                {error && <p className="text-xs text-polar-danger">{error}</p>}
                <button type="submit" disabled={pending} className="w-full rounded bg-royal py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {pending ? "Booking…" : "Confirm Booking"}
                </button>
              </form>
            )}

            {modal === "walkin" && (
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  fd.set("date", date);
                  runAction(() => createWalkIn(fd));
                }}
              >
                <input name="label" type="text" placeholder="Name (optional)" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm text-white placeholder:text-white/30" />
                <ServiceAndStartFields services={services} gapStart={activeSlot.start} gapEnd={activeSlot.end} />
                {error && <p className="text-xs text-polar-danger">{error}</p>}
                <button type="submit" disabled={pending} className="w-full rounded bg-royal py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {pending ? "Adding…" : "Add Walk-In"}
                </button>
              </form>
            )}

            {modal === "barter" && (
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  fd.set("date", date);
                  runAction(() => createBarterBooking(fd));
                }}
              >
                <input name="with_label" type="text" placeholder="Who was it with?" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm text-white placeholder:text-white/30" />
                <ServiceAndStartFields services={services} gapStart={activeSlot.start} gapEnd={activeSlot.end} />
                <textarea name="notes" placeholder="What was received in exchange?" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm text-white placeholder:text-white/30" />
                <p className="text-xs text-white/40">Amount charged will be recorded as £0 — barter value is never counted as cash revenue.</p>
                {error && <p className="text-xs text-polar-danger">{error}</p>}
                <button type="submit" disabled={pending} className="w-full rounded bg-magenta py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {pending ? "Adding…" : "Add Barter"}
                </button>
              </form>
            )}

            {modal === "block" && (
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const minutes = Number(fd.get("duration"));
                  const endTotal = timeToMinutes(activeSlot.start) + minutes;
                  fd.set("date", date);
                  fd.set("start_time", activeSlot.start);
                  fd.set("end_time", minutesToTime(endTotal));
                  runAction(() => createBlockedTime(fd));
                }}
              >
                {/* Break vs Blocked — both occupy the time the same
                    way; this only distinguishes a normal scheduled
                    break from other planned unavailable time. */}
                <div className="flex gap-3 text-xs text-white/70">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="is_break" value="false" defaultChecked />
                    Blocked
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="is_break" value="true" />
                    Break
                  </label>
                </div>
                <label className="block text-xs text-white/60">
                  Block for
                  <select name="duration" defaultValue={30} className="mt-1 w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm text-white">
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                  </select>
                </label>
                <input name="label" type="text" placeholder="Reason (optional)" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm text-white placeholder:text-white/30" />
                {error && <p className="text-xs text-polar-danger">{error}</p>}
                <button type="submit" disabled={pending} className="w-full rounded border border-white/30 py-2 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-60">
                  {pending ? "Blocking…" : "Block Time"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Existing appointment detail */}
      {detail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="relative w-96 rounded-xl border border-royal-light/30 bg-navy-light p-5 shadow-[0_0_32px_-6px_rgba(91,155,255,0.3)]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setDetail(null)}
              aria-label="Close"
              className="absolute right-3 top-3 text-white/40 transition hover:text-white"
            >
              ✕
            </button>
            <p className="pr-6 font-display text-white" style={{ fontSize: "1.1rem" }}>{bookingKindLabel(detail)}</p>
            <p className="mt-1 text-sm text-white/70">
              {formatTime12h(detail.startTime)} – {formatTime12h(detail.endTime)}
            </p>
            {detail.serviceName && (
              <p className="mt-2 text-sm text-white">
                {detail.serviceName} {detail.isBarter ? "(barter — £0 charged)" : detail.servicePrice != null ? `· ${money(detail.servicePrice)}` : ""}
              </p>
            )}
            {detail.label && !detail.clientName && <p className="mt-1 text-sm text-white/70">{detail.isBarter ? "With: " : "Name: "}{detail.label}</p>}
            {detail.barterNotes && <p className="mt-1 text-sm text-white/50">Received: {detail.barterNotes}</p>}
            {error && <p className="mt-2 text-xs text-polar-danger">{error}</p>}
            <div className="mt-4 flex gap-2">
              {detail.clientProfileId && (
                <Link href={`/dashboard/barber/clients/${detail.clientProfileId}`} className="rounded border border-royal-light/40 px-3 py-1.5 text-xs text-royal-light hover:bg-royal-light/10">
                  View client
                </Link>
              )}
              <button type="button" disabled={pending} onClick={() => handleCancel(detail.id)} className="rounded border border-magenta/50 px-3 py-1.5 text-xs text-magenta hover:bg-magenta/10 disabled:opacity-50">
                {pending ? "…" : detail.isBlocked ? (detail.isBreak ? "Remove break" : "Unblock") : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Requirement 5 (duration-aware availability): only services whose
// real duration fits inside this gap are offerable at all, and once
// one is picked, the start time is constrained to values where the
// entire service still finishes before the gap's own end — which is
// itself already bounded by the next appointment/break/block/closing
// time (buildTimeline never produces a gap that crosses one). The
// database RPCs re-validate all of this independently regardless.
function ServiceAndStartFields({ services, gapStart, gapEnd }: { services: Service[]; gapStart: string; gapEnd: string }) {
  const gapMinutes = timeToMinutes(gapEnd) - timeToMinutes(gapStart);
  const fitting = useMemo(() => services.filter((s) => s.durationMinutes <= gapMinutes), [services, gapMinutes]);
  const [serviceId, setServiceId] = useState("");
  const selected = fitting.find((s) => s.id === serviceId) ?? null;

  const startOptions = useMemo(() => {
    if (!selected) return [];
    const latest = timeToMinutes(gapEnd) - selected.durationMinutes;
    const opts: string[] = [];
    for (let m = timeToMinutes(gapStart); m <= latest; m += 5) opts.push(minutesToTime(m));
    if (opts.length === 0) opts.push(gapStart);
    return opts;
  }, [selected, gapStart, gapEnd]);

  const [startTime, setStartTime] = useState(gapStart);

  return (
    <>
      <select
        name="service_id"
        required
        value={serviceId}
        onChange={(e) => {
          setServiceId(e.target.value);
          setStartTime(gapStart);
        }}
        className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm text-white"
      >
        <option value="">Choose a service…</option>
        {fitting.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · {s.durationMinutes}m · {money(s.price)}
          </option>
        ))}
      </select>
      {services.length > 0 && fitting.length === 0 && (
        <p className="text-xs text-white/40">No service fits this {gapMinutes}-minute gap.</p>
      )}
      {selected && startOptions.length > 1 && (
        <select
          name="start_time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm text-white"
        >
          {startOptions.map((t) => (
            <option key={t} value={t}>{formatTime12h(t)}</option>
          ))}
        </select>
      )}
      {selected && startOptions.length <= 1 && <input type="hidden" name="start_time" value={gapStart} />}
    </>
  );
}
