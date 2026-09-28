"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTime12h } from "@/lib/dates";
import type { CalendarBooking } from "@/lib/queries/barber-calendar";
import type { DayCapacity } from "@/lib/calendar/capacity";
import { createWalkIn } from "@/lib/actions/walk-ins";
import { cancelBookingAsBarber, markBookingNoShow, rescheduleBookingInCalendar } from "@/lib/actions/barber-bookings";
import { createBookingAsBarber, createBarterBooking, createBlockedTime } from "@/lib/actions/barber-calendar-actions";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { PolarStage, POLAR } from "@/components/polar-ui/polar-stage";
import { BarberRoom } from "../dashboard-scene";

export type ViewKind = "day" | "week" | "month" | "list" | "year";
export type MonthCell = { date: string; day: number; count: number; isFullyBooked: boolean; capacity?: DayCapacity } | null;
type Service = { id: string; name: string; durationMinutes: number; price: number };
type Client = { id: string; fullName: string };

// Calendar (desktop), built to the approved CALENDAR-UI master
// (design-masters/barber-calendar-master.png) on the POLAR stage: the
// page is authored at the master's native 1672 × 941 canvas and scaled
// to fit. Frame, drips, title lettering, icon and crown are the
// master's own artwork (navy-tinted chrome); every control, date and
// booking is live HTML. All booking data, actions and modals unchanged.
const PINK = { hex: POLAR.pink, rgb: POLAR.pinkRgb };
const CYAN = { hex: POLAR.cyan, rgb: POLAR.cyanRgb };
const GRID_LINE = POLAR.grid;
const PINK_OUTLINE: React.CSSProperties = {
  borderColor: PINK.hex,
  boxShadow: `0 0 10px rgba(${PINK.rgb},0.55), inset 0 0 7px rgba(${PINK.rgb},0.22)`,
};
const BTN = "flex shrink-0 items-center justify-center rounded-[10px] border-2 bg-[#060b1e] text-white transition hover:brightness-125";

// Bold condensed UI voice, as in the master.
const ui = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700", "800"], style: ["normal", "italic"] });
// Full-width Barlow for the master's date numerals and period title.
const wide = Barlow({ subsets: ["latin"], weight: ["600", "700", "800"], style: ["normal", "italic"] });

const TABS: { view: ViewKind; label: string; width: number }[] = [
  { view: "day", label: "Day", width: 77 },
  { view: "week", label: "Week", width: 78 },
  { view: "month", label: "Month", width: 82 },
  { view: "list", label: "List", width: 71 },
];
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
// The master's own column widths (px, inside the 2px grid frame).
const MONTH_COLS = "210px 199px 197px 199px 199px 200px 211px";

type PickAction = "book" | "walkin" | "block";
const ACTION_META: Record<PickAction, { label: string; verb: string }> = {
  book: { label: "Add Appointment", verb: "add an appointment" },
  walkin: { label: "Add Walk-In", verb: "add a walk-in" },
  block: { label: "Block Time", verb: "block time" },
};

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke={PINK.hex} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
  const { rgb } = PINK;
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

/** "SEPTEMBER 2026" style period title — any trailing year is pink —
 * over the master's own paint splash. Long labels shrink to fit the
 * master's title slot (x 462–792). */
function PeriodTitle({ text }: { text: string }) {
  const m = text.toUpperCase().match(/^(.*?)(\s\d{4})?$/);
  const size = Math.min(40, Math.floor(590 / Math.max(1, text.length)));
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/dashboard/polar-ui/calendar-period-splat.webp" alt="" aria-hidden="true" className="pointer-events-none absolute select-none" style={{ left: 425, top: 274, width: 367, height: 32 }} />
      <p className={`cal-period ${wide.className} absolute flex items-center whitespace-nowrap`} style={{ left: 462, top: 227, height: 50, width: 330, fontSize: size }}>
        {m?.[1]}
        {m?.[2] && (
          <span className="relative" style={{ color: PINK.hex, marginLeft: "0.26em" }}>
            {m[2].trim()}
            <svg viewBox="0 0 16 12" className="absolute" style={{ right: "-0.34em", top: "0.02em", width: "0.4em", height: "0.3em" }} aria-hidden="true">
              <path d="M0 11.5 L15.5 0 L6 9.5 Z" fill={PINK.hex} />
            </svg>
          </span>
        )}
      </p>
    </>
  );
}

const ACTION_BOX: Record<PickAction, { left: number; width: number }> = {
  book: { left: 1122, width: 154 },
  walkin: { left: 1289, width: 127 },
  block: { left: 1430, width: 122 },
};

function ActionButton({ kind, onPick, view, date }: { kind: PickAction; onPick: (k: PickAction) => void; view: ViewKind; date: string }) {
  const style: React.CSSProperties = {
    position: "absolute",
    top: 227,
    height: 55,
    ...ACTION_BOX[kind],
    ...(kind === "book"
      ? { background: PINK.hex, borderColor: PINK.hex, color: "#16000f", boxShadow: `0 0 16px -2px rgba(${PINK.rgb},0.85)` }
      : kind === "walkin"
        ? { borderColor: CYAN.hex, color: CYAN.hex, boxShadow: `0 0 12px -2px rgba(${CYAN.rgb},0.7), inset 0 0 6px rgba(${CYAN.rgb},0.2)` }
        : PINK_OUTLINE),
  };
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
  const inner = kind !== "book" ? (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={kind === "walkin" ? "/dashboard/polar-ui/icon-walkin.webp" : "/dashboard/polar-ui/icon-block.webp"} alt="" aria-hidden="true" width={kind === "walkin" ? 25 : 30} height={kind === "walkin" ? 35 : 30} />
      {ACTION_META[kind].label}
    </>
  ) : (
    <>
      <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon}
      </svg>
      {ACTION_META[kind].label}
    </>
  );
  const cls = `${BTN} gap-[7px] whitespace-nowrap px-1 text-[17px] font-bold tracking-[-0.01em]`;
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

/** The booking being moved while Calendar is in reschedule mode. */
export type ReschedulingBooking = {
  id: string;
  who: string;
  serviceName: string;
  durationMinutes: number;
  recurrence: "one_off" | "weekly";
  fromDate: string;
  fromStart: string;
};

/** Start times (5-minute steps) at which a booking of `duration` fits wholly inside [gapStart, gapEnd], never in the past. */
function fittingStarts(gapStart: string, gapEnd: string, duration: number, date: string, today: string, nowTime: string): string[] {
  if (date < today) return [];
  const earliestNow = date === today ? timeToMinutes(nowTime.slice(0, 5)) + 1 : 0;
  const out: string[] = [];
  for (let m = timeToMinutes(gapStart); m + duration <= timeToMinutes(gapEnd); m += 5) {
    if (m >= earliestNow) out.push(minutesToTime(m));
  }
  return out;
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

// Visually distinct-but-restrained treatments (Day view requirement
// 6) from the POLAR Barber palette: pink appointments, cyan walk-ins,
// violet barter, neutral blocks. A faint state-tinted
// fill (in addition to the border) gives the timeline a POLAR "card"
// feel at a glance rather than reading as plain bordered HTML rows.
function bookingKindClass(b: CalendarBooking): string {
  if (b.isBlocked) {
    return b.isBreak
      ? "border-dashed border-white/30 bg-white/[0.02] text-white/70"
      : "border-white/15 bg-white/[0.015] text-white/40";
  }
  if (b.isBarter) return "border-[#b37bff]/55 bg-[#b37bff]/[0.07] text-[#dcc6ff]";
  if (b.isWalkIn) return "border-[#1fd6ff]/55 bg-[#1fd6ff]/[0.06] text-[#c9f6ff]";
  return "border-[#fd12c8]/60 bg-[#fd12c8]/[0.08] text-white";
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
  rescheduling = null,
  nowTime = "00:00:00",
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
  /** Reschedule mode: the booking being moved (Day view only). */
  rescheduling?: ReschedulingBooking | null;
  /** Shop-local time now ("HH:MM:SS") — past-time rules for reschedule/No Show. */
  nowTime?: string;
}) {
  const router = useRouter();
  const [moveSlot, setMoveSlot] = useState<{ start: string; end: string } | null>(null);
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

  // In reschedule mode, day-to-day navigation keeps the mode.
  const keep = rescheduling ? `&reschedule=${rescheduling.id}` : "";
  const prevHref = useMemo(() => {
    if (view === "day") return `?view=day&date=${addDays(date, -1)}${keep}`;
    if (view === "week") return `?view=week&date=${addDays(date, -7)}`;
    if (view === "year") return `?view=year&date=${addYears(date, -1)}`;
    return `?view=${view}&date=${addMonths(date, -1)}`;
  }, [view, date, keep]);
  const nextHref = useMemo(() => {
    if (view === "day") return `?view=day&date=${addDays(date, 1)}${keep}`;
    if (view === "week") return `?view=week&date=${addDays(date, 7)}`;
    if (view === "year") return `?view=year&date=${addYears(date, 1)}`;
    return `?view=${view}&date=${addMonths(date, 1)}`;
  }, [view, date, keep]);
  const todayHref = `?view=${view}&date=${today}${keep}`;

  // While rescheduling, the booking being moved doesn't occupy its own
  // slot (same rule as the old reschedule page).
  const timeline = useMemo(
    () =>
      dayData
        ? buildTimeline(
            dayData.availability,
            rescheduling ? dayData.bookings.filter((b) => b.id !== rescheduling.id) : dayData.bookings
          )
        : [],
    [dayData, rescheduling]
  );

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

  function handleNoShow(bookingId: string) {
    if (!window.confirm("Mark this appointment as a No Show? This can't be undone.")) return;
    runAction(async () => {
      const fd = new FormData();
      fd.set("booking_id", bookingId);
      return markBookingNoShow(fd);
    });
  }

  function handleReschedule(startTime: string) {
    if (!rescheduling) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("booking_id", rescheduling.id);
      fd.set("date", date);
      fd.set("start_time", startTime);
      const result = await rescheduleBookingInCalendar(fd);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      setMoveSlot(null);
      router.push(`?view=day&date=${date}`);
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
      <main className={`min-h-[100dvh] bg-[#060b1e] px-6 py-16 text-white sm:hidden ${ui.className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/dashboard/polar-ui/calendar-wordmark.webp" alt="Calendar" className="h-auto w-[240px]" />
        <p className="mt-6 text-lg text-white/85">
          {todaySummary.count === 0
            ? "No appointments today."
            : `${todaySummary.count} appointment${todaySummary.count === 1 ? "" : "s"} today${
                todaySummary.nextTime ? `, next at ${formatTime12h(todaySummary.nextTime)}` : ""
              }.`}
        </p>
        <p className="mt-4 text-base text-white/60">
          Full calendar management is available on desktop.
        </p>
      </main>

      {/* Desktop — Calendar Focus Mode: the POLAR Room with its lights
          off, and the approved neon Calendar panel on top. Every label,
          date and booking below is live HTML driven by real data. */}
      <PolarStage id="calendar" chromeSrc="/dashboard/polar-ui/calendar-chrome.webp" room={<BarberRoom decorative />} className={ui.className}>
        <h1 className="sr-only">Calendar</h1>

        {/* Toolbar — every control at the master's own box (native px). */}
        <Link href={todayHref} className={`${BTN} absolute text-[26px] font-bold`} style={{ ...PINK_OUTLINE, color: PINK.hex, left: 136, top: 227, width: 128, height: 55 }}>
          Today
        </Link>
        <Link href={prevHref} aria-label="Previous" className={`${BTN} absolute`} style={{ ...PINK_OUTLINE, left: 282, top: 227, width: 60, height: 55 }}>
          <Chevron dir="left" />
        </Link>
        <Link href={nextHref} aria-label="Next" className={`${BTN} absolute`} style={{ ...PINK_OUTLINE, left: 358, top: 227, width: 61, height: 55 }}>
          <Chevron dir="right" />
        </Link>

        <PeriodTitle text={periodLabel(view, date)} />

        <div role="tablist" aria-label="Calendar view" className="absolute flex overflow-hidden rounded-[10px] border-2" style={{ left: 800, top: 227, width: 308, height: 55, ...PINK_OUTLINE }}>
          {TABS.map(({ view: v, label, width }) => {
            const active = view === v;
            return (
              <Link
                key={v}
                role="tab"
                aria-selected={active}
                href={`?view=${v}&date=${date}`}
                className={`flex items-center justify-center text-[23px] font-bold transition ${active ? "" : "text-white hover:bg-white/[0.06]"}`}
                style={{ width, ...(active ? { background: PINK.hex, color: "#16000f", boxShadow: `0 0 16px rgba(${PINK.rgb},0.7)` } : {}) }}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <ActionButton kind="book" onPick={startPick} view={view} date={date} />
        <ActionButton kind="walkin" onPick={startPick} view={view} date={date} />
        <ActionButton kind="block" onPick={startPick} view={view} date={date} />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/dashboard/polar-ui/calendar-corner-splat.webp" alt="" aria-hidden="true" className="pointer-events-none absolute z-10 select-none" style={{ left: 1476, top: 784, width: 86, height: 68 }} />

        {/* Body — the master's grid box. */}
        <div className="absolute flex flex-col" style={{ left: 134, top: 308, width: 1419, height: 531 }}>
        {/* MONTH */}
        {view === "month" && monthGrid && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border-2" style={{ borderColor: POLAR.gridStrong, boxShadow: `0 0 10px rgba(${PINK.rgb},0.35)` }}>
            <div className="grid shrink-0" style={{ height: 55, gridTemplateColumns: MONTH_COLS }}>
              {WEEKDAYS.map((d, i) => (
                <div
                  key={d}
                  className="flex items-center justify-center text-[26px] font-bold italic"
                  style={{ color: i === 6 ? PINK.hex : "#fff", borderLeft: i ? `2px solid ${GRID_LINE}` : undefined, borderBottom: `2px solid ${GRID_LINE}` }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid min-h-0 flex-1" style={{ gridTemplateColumns: MONTH_COLS, gridTemplateRows: monthGrid.length === 35 ? "99px 99px 99px 98px 77px" : "79px 79px 79px 79px 79px 77px" }}>
              {monthGrid.map((cell, i) => {
                const col = i % 7;
                const lastRow = i >= monthGrid.length - 7;
                const isToday = cell.inMonth && cell.date === today;
                const isSelected = cell.inMonth && cell.date === date && !isToday;
                const lines = { borderLeft: col ? `2px solid ${GRID_LINE}` : undefined, borderBottom: lastRow ? undefined : `2px solid ${GRID_LINE}` };
                const numberColor = !cell.inMonth ? "rgba(196,184,214,0.42)" : isToday || col === 6 ? PINK.hex : "#fff";
                return (
                  <Link
                    key={cell.date}
                    href={`?view=day&date=${cell.date}`}
                    aria-label={`${dayLabel(cell.date)}${cell.count > 0 ? `, ${cell.count} booking${cell.count === 1 ? "" : "s"}` : ""}${cell.inMonth ? capacityLabel(cell.capacity) : ""}`}
                    title={cell.inMonth ? capacityLabel(cell.capacity).replace(/^, /, "") || undefined : undefined}
                    className="relative flex min-h-0 flex-col pb-2 pl-[12px] pr-3 pt-[8px] transition hover:bg-white/[0.035]"
                    style={lines}
                  >
                    {cell.inMonth && <CapacityFill capacity={cell.capacity} />}
                    <span
                      className={`${wide.className} relative flex h-[44px] w-[44px] flex-col items-center justify-center rounded-full text-[27px] font-semibold leading-none`}
                      style={{
                        color: numberColor,
                        textShadow: cell.inMonth ? "0 1px 2px rgba(0,0,0,0.6)" : undefined,
                        ...(isToday
                          ? { width: 80, height: 80, marginTop: -12, marginLeft: -6, border: `4px solid ${PINK.hex}`, boxShadow: `0 0 16px rgba(${PINK.rgb},0.9), inset 0 0 10px rgba(${PINK.rgb},0.45)` }
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
                <div key={d.date} className="flex min-h-0 flex-col" style={{ borderLeft: i ? `2px solid ${GRID_LINE}` : undefined }}>
                  <Link
                    href={`?view=day&date=${d.date}`}
                    className="flex shrink-0 items-center justify-between px-3 py-2 transition hover:bg-white/[0.04]"
                    style={{ borderBottom: `2px solid ${GRID_LINE}` }}
                  >
                    <span className="text-[22px] font-bold" style={{ color: i === 6 ? PINK.hex : "#fff" }}>
                      {WEEKDAYS[i]}
                    </span>
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full text-[25px] font-bold"
                      style={{ color: isToday || i === 6 ? PINK.hex : "#fff", ...(isToday ? { border: `3px solid ${PINK.hex}`, boxShadow: `0 0 12px rgba(${PINK.rgb},0.8)` } : {}) }}
                    >
                      {Number(d.date.slice(8))}
                    </span>
                  </Link>
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
                    {d.bookings.length === 0 ? (
                      <p className="px-1 pt-1 text-[17px] text-white/30">{d.hasAvailability ? "Available" : "Unavailable"}</p>
                    ) : (
                      d.bookings.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setDetail(b)}
                          className={`block w-full rounded-md border px-2 py-2 text-left transition hover:bg-white/[0.06] ${bookingKindClass(b)}`}
                        >
                          <span className="block text-[15px] opacity-75">{formatTime12h(b.startTime)} – {formatTime12h(b.endTime)}</span>
                          <span className="block truncate text-[17px] font-bold">{bookingKindLabel(b)}</span>
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
              <p className="text-[25px] font-bold text-white">{dayLabel(date)}</p>
              <button
                type="button"
                onClick={handleBlockWholeDay}
                disabled={pending}
                className={`${BTN} px-4 text-[20px] font-bold disabled:opacity-50`}
                style={{ ...PINK_OUTLINE, color: PINK.hex }}
              >
                Block whole day
              </button>
            </div>
            {rescheduling && (
              <div className="mb-3 flex shrink-0 items-center justify-between gap-4 rounded-lg border px-5 py-4 text-[20px]" style={{ borderColor: `rgba(${PINK.rgb},0.6)`, background: `rgba(${PINK.rgb},0.08)` }}>
                <span className="font-semibold text-white">
                  Rescheduling {rescheduling.who} · {rescheduling.serviceName} ({rescheduling.durationMinutes}m)
                  {rescheduling.recurrence === "weekly" ? " · weekly — the whole series moves" : ""}.{" "}
                  <span className="font-normal text-white/70">
                    {date < today
                      ? "This day is in the past — use ‹ › to pick today or later."
                      : "Choose a free slot below, or use ‹ › to pick another day."}
                  </span>
                </span>
                <Link href={`?view=day&date=${date}`} className="shrink-0 text-[17px] font-bold text-white/60 hover:text-white">
                  Cancel
                </Link>
              </div>
            )}
            {pickAction && !rescheduling && (
              <div className="mb-3 flex shrink-0 items-center justify-between rounded-lg border px-5 py-4 text-[20px]" style={{ borderColor: `rgba(${PINK.rgb},0.6)`, background: `rgba(${PINK.rgb},0.08)` }}>
                <span className="font-semibold text-white">
                  {timeline.some((s) => s.kind === "available")
                    ? `Choose a free slot below to ${ACTION_META[pickAction].verb}.`
                    : "No free slots on this day — use ‹ › to pick another day."}
                </span>
                <button type="button" onClick={() => setPickAction(null)} className="text-[17px] font-bold text-white/60 hover:text-white">
                  Cancel
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {timeline.length === 0 ? (
                <p className="pt-2 text-[20px] text-white/45">Unavailable — no working hours set for this day.</p>
              ) : (
                <ul className="space-y-2">
                  {timeline.map((seg, i) => (
                    <li key={i}>
                      {seg.kind === "available" && rescheduling ? (
                        (() => {
                          const fits = fittingStarts(seg.start, seg.end, rescheduling.durationMinutes, date, today, nowTime).length > 0;
                          return (
                            <button
                              type="button"
                              disabled={!fits}
                              onClick={() => {
                                setError(null);
                                setMoveSlot({ start: seg.start, end: seg.end });
                              }}
                              className="flex w-full items-center justify-between rounded-lg border border-dashed px-5 py-4 text-left text-[20px] text-white transition enabled:hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
                              style={{ borderColor: fits ? PINK.hex : `rgba(${PINK.rgb},0.3)`, boxShadow: fits ? `0 0 12px -4px rgba(${PINK.rgb},0.8)` : undefined }}
                            >
                              <span className="font-semibold">
                                {formatTime12h(seg.start)} – {formatTime12h(seg.end)}
                              </span>
                              <span className="text-[17px] tracking-[0.14em]" style={{ color: `rgba(${PINK.rgb},0.8)` }}>
                                {fits ? "MOVE HERE" : date < today ? "PAST" : "DOESN'T FIT"}
                              </span>
                            </button>
                          );
                        })()
                      ) : seg.kind === "available" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSlot({ start: seg.start, end: seg.end });
                            if (pickAction) {
                              setModal(pickAction);
                              setPickAction(null);
                            }
                          }}
                          className="flex w-full items-center justify-between rounded-lg border border-dashed px-5 py-4 text-left text-[20px] text-white transition hover:bg-white/[0.05]"
                          style={{ borderColor: pickAction ? PINK.hex : `rgba(${PINK.rgb},0.4)`, boxShadow: pickAction ? `0 0 12px -4px rgba(${PINK.rgb},0.8)` : undefined }}
                        >
                          <span className="font-semibold">
                            {formatTime12h(seg.start)} – {formatTime12h(seg.end)}
                          </span>
                          <span className="text-[17px] tracking-[0.14em]" style={{ color: `rgba(${PINK.rgb},0.8)` }}>AVAILABLE</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDetail(seg.booking)}
                          className={`flex w-full items-center justify-between rounded-lg border px-5 py-4 text-left text-[20px] transition hover:bg-white/[0.06] ${bookingKindClass(seg.booking)}`}
                        >
                          <span className="font-semibold">
                            {formatTime12h(seg.start)} – {formatTime12h(seg.end)} ({timeToMinutes(seg.end) - timeToMinutes(seg.start)}m) · {bookingKindLabel(seg.booking)}
                          </span>
                          {seg.booking.serviceName && <span className="text-[17px] text-white/45">{seg.booking.serviceName}</span>}
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
              <p className="pt-2 text-[20px] text-white/45">No bookings in {monthLabel(date)}.</p>
            ) : (
              <div className="space-y-5">
                {listDays.map((d) => (
                  <section key={d.date}>
                    <Link
                      href={`?view=day&date=${d.date}`}
                      className="mb-2 inline-flex items-center gap-2 text-[22px] font-bold transition hover:text-white"
                      style={{ color: d.date === today ? PINK.hex : "rgba(255,255,255,0.85)" }}
                    >
                      {dayLabel(d.date)}
                      {d.date === today && <span className="text-[15px] tracking-[0.14em]">TODAY</span>}
                    </Link>
                    <ul className="space-y-2">
                      {d.bookings.map((b) => (
                        <li key={b.id}>
                          <button
                            type="button"
                            onClick={() => setDetail(b)}
                            className={`flex w-full items-center justify-between gap-4 rounded-lg border px-5 py-4 text-left text-[20px] transition hover:bg-white/[0.06] ${bookingKindClass(b)}`}
                          >
                            <span className="w-48 shrink-0 tabular-nums opacity-80">
                              {formatTime12h(b.startTime)} – {formatTime12h(b.endTime)}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-bold">{bookingKindLabel(b)}</span>
                            {b.serviceName && <span className="shrink-0 text-[17px] text-white/45">{b.serviceName}</span>}
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
                <span className="text-[20px] font-bold text-white">{m.label}</span>
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
        </div>
      </PolarStage>

      {/* Booking dialogs — rendered outside the Focus panel (whose
          backdrop blur would otherwise contain these fixed overlays). */}
      {/* Slot action menu (Day view) */}
      {activeSlot && !modal && (
        <div className={`fixed inset-0 z-40 flex items-center justify-center bg-[#030612]/80 backdrop-blur-sm ${ui.className}`} onClick={() => setActiveSlot(null)}>
          <div
            className="relative w-80 rounded-xl border-2 border-[#fd12c8] bg-[#060b1e] p-4 shadow-[0_0_28px_-4px_rgba(253,18,200,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveSlot(null)}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg text-white/60 transition hover:bg-white/5 hover:text-[#fd12c8]"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
            <p className="pr-10 text-[21px] font-bold text-white">
              {formatTime12h(activeSlot.start)} – {formatTime12h(activeSlot.end)}
            </p>
            <p className="text-[15px] text-white/55">Free slot</p>
            <div className="mt-3 flex flex-col gap-2">
              <button type="button" onClick={() => setModal("book")} className="rounded-lg bg-[#fd12c8] !text-[#16000f] px-4 py-2.5 text-left text-[16px] font-medium text-white shadow-[0_0_12px_-4px_rgba(253,18,200,0.85)] transition hover:brightness-110">
                Book Appointment
              </button>
              <button type="button" onClick={() => setModal("walkin")} className="rounded-lg border border-[#1fd6ff]/50 px-4 py-2.5 text-left text-[16px] text-white transition hover:bg-[#1fd6ff]/10">
                Add Walk-In
              </button>
              <button type="button" onClick={() => setModal("barter")} className="rounded-lg border border-[#fd12c8]/40 px-4 py-2.5 text-left text-[16px] text-[#fd12c8] transition hover:bg-[#fd12c8]/10">
                Add Barter
              </button>
              <button type="button" onClick={() => setModal("block")} className="rounded-lg border border-white/15 px-4 py-2.5 text-left text-[16px] text-white/70 transition hover:bg-white/5">
                Block Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book / Walk-in / Barter / Block forms */}
      {activeSlot && modal && (
        <div className={`fixed inset-0 z-40 flex items-center justify-center bg-[#030612]/80 backdrop-blur-sm ${ui.className}`} onClick={closeModal}>
          <div className="relative w-[440px] rounded-xl border-2 border-[#fd12c8] bg-[#060b1e] p-5 shadow-[0_0_28px_-4px_rgba(253,18,200,0.6)]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg text-white/60 transition hover:bg-white/5 hover:text-[#fd12c8]"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
            <p className="pr-6 text-[22px] font-bold uppercase tracking-wide text-white">
              {modal === "book" && "Book Appointment"}
              {modal === "walkin" && "Add Walk-In"}
              {modal === "barter" && "Add Barter"}
              {modal === "block" && "Block Time"}
            </p>
            <p className="mt-1 text-[15px] text-white/50">
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
                <select name="client_profile_id" required className="w-full rounded border border-[#fd12c8]/45 bg-[#0b1330] px-4 py-2.5 text-[16px] text-white">
                  <option value="">Choose a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
                {clients.length === 0 && <p className="text-[15px] text-white/40">No linked clients yet — link one from the Clients page first.</p>}
                <ServiceAndStartFields services={services} gapStart={activeSlot.start} gapEnd={activeSlot.end} />
                {error && <p className="text-[15px] text-[#ff6b9a]">{error}</p>}
                <button type="submit" disabled={pending} className="w-full rounded bg-[#fd12c8] py-3 text-[16px] font-bold text-[#16000f] disabled:opacity-60">
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
                <input name="label" type="text" placeholder="Name (optional)" className="w-full rounded border border-[#fd12c8]/45 bg-[#0b1330] px-4 py-2.5 text-[16px] text-white placeholder:text-white/30" />
                <ServiceAndStartFields services={services} gapStart={activeSlot.start} gapEnd={activeSlot.end} />
                {error && <p className="text-[15px] text-[#ff6b9a]">{error}</p>}
                <button type="submit" disabled={pending} className="w-full rounded bg-[#fd12c8] py-3 text-[16px] font-bold text-[#16000f] disabled:opacity-60">
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
                <input name="with_label" type="text" placeholder="Who was it with?" className="w-full rounded border border-[#fd12c8]/45 bg-[#0b1330] px-4 py-2.5 text-[16px] text-white placeholder:text-white/30" />
                <ServiceAndStartFields services={services} gapStart={activeSlot.start} gapEnd={activeSlot.end} />
                <textarea name="notes" placeholder="What was received in exchange?" className="w-full rounded border border-[#fd12c8]/45 bg-[#0b1330] px-4 py-2.5 text-[16px] text-white placeholder:text-white/30" />
                <p className="text-[15px] text-white/40">Amount charged will be recorded as £0 — barter value is never counted as cash revenue.</p>
                {error && <p className="text-[15px] text-[#ff6b9a]">{error}</p>}
                <button type="submit" disabled={pending} className="w-full rounded bg-[#b37bff] py-3 text-[16px] font-bold text-[#12001f] disabled:opacity-60">
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
                <div className="flex gap-3 text-[15px] text-white/70">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="is_break" value="false" defaultChecked />
                    Blocked
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="is_break" value="true" />
                    Break
                  </label>
                </div>
                <label className="block text-[15px] text-white/60">
                  Block for
                  <select name="duration" defaultValue={30} className="mt-1 w-full rounded border border-[#fd12c8]/45 bg-[#0b1330] px-4 py-2.5 text-[16px] text-white">
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                  </select>
                </label>
                <input name="label" type="text" placeholder="Reason (optional)" className="w-full rounded border border-[#fd12c8]/45 bg-[#0b1330] px-4 py-2.5 text-[16px] text-white placeholder:text-white/30" />
                {error && <p className="text-[15px] text-[#ff6b9a]">{error}</p>}
                <button type="submit" disabled={pending} className="w-full rounded border border-white/30 py-3 text-[16px] font-semibold text-white hover:bg-white/5 disabled:opacity-60">
                  {pending ? "Blocking…" : "Block Time"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Existing appointment detail */}
      {detail && (
        <div className={`fixed inset-0 z-40 flex items-center justify-center bg-[#030612]/80 backdrop-blur-sm ${ui.className}`} onClick={() => setDetail(null)}>
          <div className="relative w-[440px] rounded-xl border-2 border-[#fd12c8] bg-[#060b1e] p-5 shadow-[0_0_28px_-4px_rgba(253,18,200,0.6)]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setDetail(null)}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg text-white/60 transition hover:bg-white/5 hover:text-[#fd12c8]"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
            <p className="pr-6 text-[22px] font-bold uppercase tracking-wide text-white">{bookingKindLabel(detail)}</p>
            <p className="mt-1 text-[16px] text-white/70">
              {formatTime12h(detail.startTime)} – {formatTime12h(detail.endTime)}
            </p>
            {detail.serviceName && (
              <p className="mt-2 text-[16px] text-white">
                {detail.serviceName} {detail.isBarter ? "(barter — £0 charged)" : detail.servicePrice != null ? `· ${money(detail.servicePrice)}` : ""}
              </p>
            )}
            {detail.label && !detail.clientName && <p className="mt-1 text-[16px] text-white/70">{detail.isBarter ? "With: " : "Name: "}{detail.label}</p>}
            {detail.barterNotes && <p className="mt-1 text-[16px] text-white/50">Received: {detail.barterNotes}</p>}
            {!detail.isBlocked && (
              <p className="mt-1 text-[15px] text-white/60">
                {detail.recurrence === "weekly" ? "Weekly booking" : "One-off booking"}
              </p>
            )}
            {detail.noShow && (
              <p className="mt-2 inline-block rounded border border-[#fd12c8]/60 px-2 py-0.5 text-[15px] font-bold uppercase tracking-[0.14em] text-[#fd12c8]">No Show</p>
            )}
            {error && <p className="mt-2 text-[15px] text-[#ff6b9a]">{error}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.clientProfileId && (
                <Link href={`/dashboard/barber/clients/${detail.clientProfileId}`} className="rounded border border-[#1fd6ff]/60 px-4 py-2.5 text-[15px] text-[#1fd6ff] hover:bg-[#1fd6ff]/10">
                  View client
                </Link>
              )}
              <button type="button" disabled={pending} onClick={() => handleCancel(detail.id)} className="rounded border border-[#fd12c8]/50 px-4 py-2.5 text-[15px] text-[#fd12c8] hover:bg-[#fd12c8]/10 disabled:opacity-50">
                {pending ? "…" : detail.isBlocked ? (detail.isBreak ? "Remove break" : "Unblock") : "Cancel"}
              </button>
              {detail.serviceId && !detail.isBlocked && (
                <Link
                  href={`?view=day&date=${detail.date < today ? today : detail.date}&reschedule=${detail.id}`}
                  onClick={() => setDetail(null)}
                  className="rounded border border-[#1fd6ff]/60 px-4 py-2.5 text-[15px] text-[#1fd6ff] hover:bg-[#1fd6ff]/10"
                >
                  Reschedule
                </Link>
              )}
              {!detail.isBlocked &&
                !detail.noShow &&
                detail.recurrence === "one_off" &&
                (detail.date < today || (detail.date === today && detail.endTime <= nowTime)) && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleNoShow(detail.id)}
                    className="rounded border border-[#fd12c8]/50 px-4 py-2.5 text-[15px] text-[#fd12c8] hover:bg-[#fd12c8]/10 disabled:opacity-50"
                  >
                    Mark No Show
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule — confirm the new start time inside the chosen gap */}
      {rescheduling && moveSlot && (
        <div className={`fixed inset-0 z-40 flex items-center justify-center bg-[#030612]/80 backdrop-blur-sm ${ui.className}`} onClick={() => setMoveSlot(null)}>
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-title"
            className="relative w-[440px] rounded-xl border-2 border-[#fd12c8] bg-[#060b1e] p-5 shadow-[0_0_28px_-4px_rgba(253,18,200,0.6)]"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              handleReschedule(String(new FormData(e.currentTarget).get("start_time") ?? ""));
            }}
          >
            <button type="button" onClick={() => setMoveSlot(null)} aria-label="Close" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg text-white/60 transition hover:bg-white/5 hover:text-[#fd12c8]">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
            <p id="reschedule-title" className="pr-6 text-[22px] font-bold uppercase tracking-wide text-white">
              Reschedule {rescheduling.who}
            </p>
            <p className="mt-1 text-[16px] text-white/70">
              {rescheduling.serviceName} · {rescheduling.durationMinutes}m — currently {dayLabel(rescheduling.fromDate)}, {formatTime12h(rescheduling.fromStart)}
            </p>
            <p className="mt-3 text-[16px] text-white">New date: {dayLabel(date)}</p>
            <label className="mt-2 block text-[16px] text-white">
              <span className="mb-1 block text-white/70">New start time</span>
              <select name="start_time" required className="w-full rounded border border-royal-light/40 bg-navy px-4 py-2.5 text-[16px] text-white [&>option]:bg-navy">
                {fittingStarts(moveSlot.start, moveSlot.end, rescheduling.durationMinutes, date, today, nowTime).map((t) => (
                  <option key={t} value={t}>
                    {formatTime12h(t)} – {formatTime12h(minutesToTime(timeToMinutes(t) + rescheduling.durationMinutes))}
                  </option>
                ))}
              </select>
            </label>
            {rescheduling.recurrence === "weekly" && (
              <p className="mt-2 text-[15px] text-white/55">Weekly booking — the whole series moves to this day and time.</p>
            )}
            {error && <p className="mt-2 text-[15px] text-[#ff6b9a]">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={pending} className="rounded-lg bg-[#fd12c8] !text-[#16000f] px-4 py-2 text-[16px] font-semibold text-white disabled:opacity-50">
                {pending ? "Moving…" : "Confirm reschedule"}
              </button>
              <button type="button" onClick={() => setMoveSlot(null)} className="rounded border border-white/20 px-4 py-2.5 text-[16px] text-white/70 hover:text-white">
                Back
              </button>
            </div>
          </form>
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
        className="w-full rounded border border-[#fd12c8]/45 bg-[#0b1330] px-4 py-2.5 text-[16px] text-white"
      >
        <option value="">Choose a service…</option>
        {fitting.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · {s.durationMinutes}m · {money(s.price)}
          </option>
        ))}
      </select>
      {services.length > 0 && fitting.length === 0 && (
        <p className="text-[15px] text-white/40">No service fits this {gapMinutes}-minute gap.</p>
      )}
      {selected && startOptions.length > 1 && (
        <select
          name="start_time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full rounded border border-[#fd12c8]/45 bg-[#0b1330] px-4 py-2.5 text-[16px] text-white"
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
