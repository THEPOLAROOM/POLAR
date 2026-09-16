"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatTime12h } from "@/lib/dates";
import type { CalendarBooking } from "@/lib/queries/barber-calendar";
import { createWalkIn } from "@/lib/actions/walk-ins";
import { cancelBookingAsBarber } from "@/lib/actions/barber-bookings";
import { createBookingAsBarber, createBarterBooking, createBlockedTime } from "@/lib/actions/barber-calendar-actions";

export type ViewKind = "day" | "week" | "month" | "year";
export type MonthCell = { date: string; day: number; count: number; isFullyBooked: boolean } | null;
type Service = { id: string; name: string; durationMinutes: number; price: number };
type Client = { id: string; fullName: string };

// Asset fully replaced with a new mastered UI (new artwork, not a
// touch-up of the old one) — canvas is now 2098x750, a different
// aspect ratio than the previous 1954x580 asset (2.7973 vs 3.3690).
// Every box below was re-measured directly against the new asset via
// per-pixel gradient (edge) detection along the baked border strokes,
// clustering the detected edge pixels and taking each cluster's
// intensity-weighted center — not a raw brightness threshold, which
// an earlier pass proved unreliable: it mistook the sidebar's own
// left border (and the grid's outer right border) for the wrong
// neighboring boundary in more than one box, overshooting the
// mastered grid's true right/bottom edges and the Today control's
// true right edge by 10-50px. Not carried over or scaled from the
// old 1954x580 coordinates.
const ASSET_ASPECT = "2098 / 750";

const SMART_ANALYTICS_BOX = { left: "30.66%", top: "15.33%", width: "12.05%", height: "9.47%" };

// Day/Week/Month/Year — the mastered artwork always bakes "Month" as
// the visually active tab, which is wrong whenever another view is
// selected. That whole row is patched over and replaced with four
// real tab buttons carrying their own dynamic active state instead.
const TAB_ROW_BOX = { left: "46.95%", top: "15.33%", width: "27.27%", height: "9.47%" };

// Prev/Today/Next — replaced with a real dynamic period label (Fix 2)
// plus a small separate Today shortcut, so this whole row is patched
// over too. The new artwork bakes these as four individually-boxed
// controls (unlike the old single wide "Today" pill), so the prev/
// next arrows and the Today control keep their own baked proportions
// (10%/10%/19%, plus an 8% gap before Today) instead of three equal
// thirds. The box's width was previously overshot by ~13px, which
// pushed the live Today control's right edge past its baked
// counterpart and into the outer border's own glow.
const NAV_ROW_BOX = { left: "78.66%", top: "15.33%", width: "19.00%", height: "9.47%" };

const GRID_AREA_BOX = { left: "3.00%", top: "27.93%", width: "73.83%", height: "57.27%" };

// The Month grid's 7 day-columns and 5 date-rows are NOT evenly
// spaced in the mastered asset (measured via gradient-edge clustering
// across the grid body, averaged over many rows/columns to reject
// text-glyph noise). These are the real boundaries (% of the asset's
// own width/height), so every cell box is derived from its own two
// adjacent boundaries. The previous last COL_BOUNDS/ROW_BOUNDS values
// (79.12/86.40) were measured off the wrong nearby line — the
// sidebar's own left border and the card's outer bottom edge,
// respectively, not the grid's own right/bottom gridline — which let
// the SUN column and row-5 cell patches overshoot the real grid by
// ~48px and ~9px.
const COL_BOUNDS = [3.00, 14.18, 25.00, 35.84, 46.66, 57.36, 67.95, 76.84];
const ROW_BOUNDS = [33.47, 44.00, 54.60, 65.13, 75.73, 85.20];

const ADD_APPOINTMENT_BOX = { left: "78.65%", top: "57.20%", width: "18.02%", height: "9.33%" };
const RIGHT_TEXT_PATCH_BOX = { left: "78.41%", top: "40.00%", width: "18.83%", height: "16.67%" };

const CELL_FILL = "#001b3c";
const PANEL_FILL = "#1a1b4a";
const HEADER_FILL = "#00173a";

const HIT_AREA_CLASS =
  "absolute rounded-2xl bg-transparent transition duration-200 ease-out hover:shadow-[0_0_18px_4px_rgba(91,155,255,0.4),0_0_26px_8px_rgba(255,61,154,0.22)]";

// The active tab previously carried `m-[6%]` — a percentage margin on
// a flex child resolves against the CONTAINING STRIP's own width/
// height, not the tab's own ~1/4 share of it. On a strip only ~70px
// tall, a 6% margin (≈33px) top AND bottom nearly cancelled out the
// entire visible height, which is why the active tab looked dull/dark
// (mostly showing the dark strip fill behind a collapsed sliver of
// gradient) and visibly smaller than its neighbours. It must render
// at the exact same flex-1 footprint as every inactive tab — no
// margin, no resize — with only its background/border/glow differing.
const TAB_ACTIVE_CLASS =
  "rounded-lg bg-gradient-to-r from-royal to-magenta text-white shadow-[0_0_14px_-2px_rgba(255,61,154,0.75)] hover:brightness-110";
const TAB_INACTIVE_CLASS = "text-white/70 hover:bg-white/5 hover:text-white";

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
  return monthLabel(dateStr);
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
  yearMonths,
}: {
  view: ViewKind;
  date: string;
  today: string;
  services: Service[];
  clients: Client[];
  todaySummary: { count: number; nextTime: string | null };
  monthCells: MonthCell[] | null;
  dayData: { availability: { startTime: string; endTime: string }[]; bookings: CalendarBooking[] } | null;
  weekDays: { date: string; label: string; count: number; isFullyBooked: boolean; hasAvailability: boolean }[] | null;
  yearMonths: { month: number; label: string; cells: MonthCell[] }[] | null;
}) {
  const [activeSlot, setActiveSlot] = useState<{ start: string; end: string } | null>(null);
  const [modal, setModal] = useState<"book" | "walkin" | "barter" | "block" | null>(null);
  const [detail, setDetail] = useState<CalendarBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const prevHref = useMemo(() => {
    if (view === "day") return `?view=day&date=${addDays(date, -1)}`;
    if (view === "week") return `?view=week&date=${addDays(date, -7)}`;
    if (view === "year") return `?view=year&date=${addYears(date, -1)}`;
    return `?view=month&date=${addMonths(date, -1)}`;
  }, [view, date]);
  const nextHref = useMemo(() => {
    if (view === "day") return `?view=day&date=${addDays(date, 1)}`;
    if (view === "week") return `?view=week&date=${addDays(date, 7)}`;
    if (view === "year") return `?view=year&date=${addYears(date, 1)}`;
    return `?view=month&date=${addMonths(date, 1)}`;
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

      {/* Desktop */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <Image
          src="/dashboard/polar-barber-dashboard-background.png"
          alt=""
          fill
          priority
          className="object-cover"
          aria-hidden="true"
        />

        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div
            className="relative"
            style={{ width: `min(94%, calc(100dvh * ${ASSET_ASPECT}))`, aspectRatio: ASSET_ASPECT }}
          >
            <Image
              src="/dashboard/polar-barber-calendar-ui-mastered.png"
              alt="Calendar"
              fill
              priority
              className="object-contain"
            />

            {/* Smart Analytics — navigation is wired; the page itself
                is intentionally not built yet (out of scope). */}
            <Link href="/dashboard/barber/calendar/analytics" className={HIT_AREA_CLASS} style={SMART_ANALYTICS_BOX} aria-label="Smart Analytics" />

            {/* Day/Week/Month/Year — the baked artwork always shows
                "Month" as active regardless of the real selected
                view, so this whole row is patched over and replaced
                with real tab buttons carrying their own dynamic
                active state (POLAR cyan/magenta gradient when
                active).

                The mastered art renders these as ONE continuous
                outer-rounded strip with thin dividers between
                segments — not four independently-bordered pills. The
                previous version gave every tab its own full border,
                which (measured against the baked strip) produced two
                close-together border lines at each seam and read as a
                ghost/double outline. This now matches the baked
                structure: one shared border+rounding on the strip,
                plain dividers between inactive tabs, and only the
                active tab breaking out as its own raised pill — same
                as "Month" does in the artwork. */}
            <div className="absolute" style={TAB_ROW_BOX}>
              {/* Uniform -2% inset patch covering the baked strip
                  (including its own border) in every direction, sized
                  against the new asset's TAB_ROW_BOX measurement. Not
                  pixel-scanned for exact baked-border overflow the way
                  the previous asset's patch was — if visual QA finds a
                  ghost outline on any edge, widen that side's inset. */}
              <div className="absolute -top-[2%] -bottom-[2%] -left-[2%] -right-[2%] rounded-xl" style={{ backgroundColor: HEADER_FILL }} aria-hidden="true" />
              <div className="relative flex h-full items-stretch overflow-hidden rounded-xl border border-royal-light/30">
                {(["day", "week", "month", "year"] as ViewKind[]).map((v, i) => (
                  <Link
                    key={v}
                    href={`?view=${v}&date=${date}`}
                    className={`flex flex-1 items-center justify-center font-body capitalize transition ${
                      view === v ? TAB_ACTIVE_CLASS : `${TAB_INACTIVE_CLASS} ${i > 0 ? "border-l border-royal-light/20" : ""}`
                    }`}
                    style={{ fontSize: "0.85vw" }}
                  >
                    {v}
                  </Link>
                ))}
              </div>
            </div>

            {/* Prev / dynamic period label / Next / Today — replaces
                the baked static "September 2026" / arrow controls,
                which are patched over the same way as the tab row.
                Unlike the old asset, the new artwork bakes prev/next
                as narrow square arrow buttons and Today as a wider
                icon+caption control with a visible gap only before
                Today — widths below (10%/flex-1/10%/19%, 8% margin
                before Today) match those baked proportions, measured
                directly off the baked control cluster's own edges,
                not three equal thirds. */}
            <div className="absolute flex items-center" style={NAV_ROW_BOX}>
              {/* Uniform -2% inset patch, same rationale as the tab
                  row's — not pixel-scanned for exact baked-border
                  overflow on this new asset; widen a side if visual QA
                  finds a ghost outline there. */}
              <div className="absolute -top-[2%] -bottom-[2%] -left-[2%] -right-[2%] rounded-xl" style={{ backgroundColor: HEADER_FILL }} aria-hidden="true" />
              <Link
                href={prevHref}
                aria-label="Previous"
                className="relative flex flex-none items-center justify-center rounded-lg border border-royal-light/30 text-white/80 transition hover:bg-white/5"
                style={{ width: "10%", height: "100%", fontSize: "0.85vw" }}
              >
                ‹
              </Link>
              <p className="relative flex-1 truncate text-center text-white" style={{ fontSize: "0.78vw" }}>
                {periodLabel(view, date)}
              </p>
              <Link
                href={nextHref}
                aria-label="Next"
                className="relative flex flex-none items-center justify-center rounded-lg border border-royal-light/30 text-white/80 transition hover:bg-white/5"
                style={{ width: "10%", height: "100%", fontSize: "0.85vw" }}
              >
                ›
              </Link>
              {/* Baked art leaves a visibly bigger gap before Today
                  than between the other three controls (~8% of the
                  row vs none) — a uniform flex `gap` can't express
                  that, so Today alone carries the extra margin. */}
              <Link
                href={todayHref}
                aria-label="Jump to today"
                className="relative flex flex-none flex-col items-center justify-center rounded-lg border border-royal-light/40 text-royal-light transition hover:bg-royal-light/10"
                style={{ width: "19%", height: "100%", marginLeft: "8%" }}
              >
                <span aria-hidden="true" style={{ fontSize: "0.95vw", lineHeight: 1 }}>↺</span>
                <span style={{ fontSize: "0.45vw", letterSpacing: "0.05em" }}>TODAY</span>
              </Link>
            </div>

            {/* Right panel — permanent copy + real today summary
                patched over the baked example text; the artwork's own
                "Your Calendar At a Glance" heading and crown are left
                untouched. overflow-hidden is a hard containment
                backstop — this box's height was measured against the
                fixed copy line at 0.72vw, but todaySummary's text
                length varies with real booking data, so nothing here
                can be allowed to visually escape into the Add
                Appointment button below it. */}
            <div
              className="absolute flex flex-col justify-center overflow-hidden"
              style={{ ...RIGHT_TEXT_PATCH_BOX, paddingLeft: "3%", paddingRight: "3%" }}
            >
              <div className="absolute inset-0" style={{ backgroundColor: PANEL_FILL }} aria-hidden="true" />
              <p className="relative text-white/70" style={{ fontSize: "0.72vw", lineHeight: 1.4 }}>
                View your schedule, manage bookings and keep your day running smoothly.
              </p>
              <p className="relative mt-[0.5vw] text-white" style={{ fontSize: "0.78vw" }}>
                {todaySummary.count === 0
                  ? "No appointments today"
                  : `${todaySummary.count} appointment${todaySummary.count === 1 ? "" : "s"} today${
                      todaySummary.nextTime ? ` · next ${formatTime12h(todaySummary.nextTime)}` : ""
                    }`}
              </p>
            </div>
            <Link href={`?view=day&date=${today}`} className={HIT_AREA_CLASS} style={ADD_APPOINTMENT_BOX} aria-label="Add appointment" />

            {/* MONTH VIEW — real day numbers patched over the baked
                grid's own generic 1..31 layout (which only matches
                one specific month/year), plus real per-day
                availability. Gridlines/weekday headers stay baked. */}
            {view === "month" && monthCells && (
              <>
                {monthCells.map((cell, i) => {
                  const row = Math.floor(i / 7);
                  const col = i % 7;
                  const box = {
                    left: `${COL_BOUNDS[col]}%`,
                    top: `${ROW_BOUNDS[row]}%`,
                    width: `${COL_BOUNDS[col + 1] - COL_BOUNDS[col]}%`,
                    height: `${ROW_BOUNDS[row + 1] - ROW_BOUNDS[row]}%`,
                  };
                  if (!cell) return <div key={i} className="absolute" style={box} aria-hidden="true" />;
                  return (
                    <Link
                      key={i}
                      href={`?view=day&date=${cell.date}`}
                      className="absolute overflow-hidden transition hover:bg-white/[0.04]"
                      style={box}
                    >
                      {/* Patches the cell's entire interior (inset
                          just enough to leave the baked gridline
                          border itself visible) — not just a corner
                          — so there is categorically nothing baked
                          left underneath the real date: no example
                          number, no fragment of one, regardless of
                          how far its glow actually extends. The real
                          date is then drawn at a fixed, identical
                          inset in every cell, derived purely from
                          this cell's own geometry. */}
                      <div
                        className="absolute inset-[3%]"
                        style={{ backgroundColor: CELL_FILL }}
                        aria-hidden="true"
                      />
                      <p
                        className={`absolute font-body ${cell.isFullyBooked ? "text-white/35" : "text-white"}`}
                        style={{ left: "8%", top: "9%", fontSize: "0.85vw", lineHeight: 1 }}
                      >
                        {cell.day}
                      </p>
                      {cell.isFullyBooked && <div className="absolute inset-[3%] bg-black/35" aria-hidden="true" />}
                    </Link>
                  );
                })}
              </>
            )}

            {/* WEEK / YEAR / DAY — no mastered artwork exists for
                these (only Month was supplied), so the shared grid
                area is patched with the surrounding fill and replaced
                with a real, consistently-styled panel. */}
            {view !== "month" && (
              <div className="absolute overflow-hidden rounded-xl" style={GRID_AREA_BOX}>
                <div className="absolute inset-0" style={{ backgroundColor: CELL_FILL }} aria-hidden="true" />
                <div className="relative flex h-full w-full flex-col" style={{ padding: "1.2%" }}>
                  {view === "week" && weekDays && (
                    <>
                      <p className="font-display text-white" style={{ fontSize: "1vw" }}>
                        Week of {dayLabel(weekDays[0].date)}
                      </p>
                      <div className="mt-[0.8%] grid flex-1 grid-cols-7" style={{ gap: "0.6%" }}>
                        {weekDays.map((d) => (
                          <Link
                            key={d.date}
                            href={`?view=day&date=${d.date}`}
                            className={`flex flex-col rounded-lg border border-white/10 p-[3%] transition hover:bg-white/[0.05] ${d.isFullyBooked ? "opacity-50" : ""}`}
                          >
                            <span className="text-white" style={{ fontSize: "0.75vw" }}>{d.label}</span>
                            <span
                              className={`mt-auto ${d.count > 0 || d.hasAvailability ? "text-royal-light" : "text-white/35"}`}
                              style={{ fontSize: "0.7vw" }}
                            >
                              {d.count > 0
                                ? `${d.count} booking${d.count === 1 ? "" : "s"}`
                                : d.hasAvailability
                                  ? "AVAILABLE"
                                  : "UNAVAILABLE"}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}

                  {view === "year" && yearMonths && (
                    <>
                      <p className="font-display text-white" style={{ fontSize: "1vw" }}>{date.slice(0, 4)}</p>
                      {/* min-h-0 lets this flex child actually shrink
                          so overflow-y-auto can engage — otherwise a
                          flex item defaults to never being smaller
                          than its content, and any excess silently
                          escapes the outer overflow-hidden instead of
                          scrolling. Only this inner area ever scrolls,
                          never the page itself.

                          grid-rows-3 was previously forcing all 3
                          rows to compress into this panel's own
                          height (~417px of the 1954x580 asset). Since
                          each mini-month's 7 day-columns are sized off
                          its OWN card width (aspect-square cells), the
                          natural content height that width demands
                          (~5-6 square rows + label) is far taller than
                          a forced 1/3 share of 417px — so cards were
                          rendered squashed/stretched against their own
                          natural proportions. Removing the fixed row
                          count lets each row size to its natural
                          content height instead (true, unstretched
                          squares) and the container's existing
                          overflow-y-auto scrolls to reveal the rest —
                          which is explicitly the approved behaviour
                          for Year. 4 columns (vs. the suggested 3) is
                          kept because it needs measurably less total
                          scroll to reach month 12: at this panel's
                          fixed ~3.5:1 wide-short aspect, 3 columns
                          makes each card wider, which — since a card's
                          height is driven by its width via
                          aspect-square cells — makes every card
                          natural-taller too, resulting in MORE total
                          scroll content (4 rows of taller cards), not
                          less. */}
                      <div className="mt-[0.8%] grid min-h-0 flex-1 grid-cols-4 overflow-y-auto" style={{ gap: "0.8%", alignContent: "start" }}>
                        {yearMonths.map((m) => (
                          <Link
                            key={m.month}
                            href={`?view=month&date=${date.slice(0, 4)}-${pad(m.month)}-01`}
                            className="flex flex-col rounded-lg border border-white/10 p-[4%] transition hover:bg-white/[0.05]"
                          >
                            <span className="text-white" style={{ fontSize: "0.72vw" }}>{m.label}</span>
                            <div className="mt-[3%] grid grid-cols-7 gap-[2px]">
                              {m.cells.map((c, i) => (
                                <span
                                  key={i}
                                  className={`aspect-square rounded-sm ${
                                    !c ? "bg-transparent" : c.count > 0 ? (c.isFullyBooked ? "bg-magenta/70" : "bg-royal-light/70") : "bg-white/10"
                                  }`}
                                />
                              ))}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}

                  {view === "day" && dayData && (
                    <>
                      <div className="flex items-center justify-between border-b border-white/10 pb-[0.8%]">
                        <p className="font-display text-white" style={{ fontSize: "1vw" }}>{dayLabel(date)}</p>
                        <button
                          type="button"
                          onClick={handleBlockWholeDay}
                          disabled={pending}
                          className="rounded-md border border-magenta/40 px-[1%] py-[0.4%] text-magenta transition hover:bg-magenta/10 hover:shadow-[0_0_10px_-3px_rgba(255,61,154,0.6)] disabled:opacity-50"
                          style={{ fontSize: "0.68vw" }}
                        >
                          Block whole day
                        </button>
                      </div>
                      {/* min-h-0 lets this flex child actually shrink
                          so overflow-y-auto can engage (same fix as
                          Year view) — a long working day scrolls only
                          within this panel; the Calendar shell and
                          right-hand panel never move. */}
                      <div className="mt-[1%] min-h-0 flex-1 overflow-y-auto" style={{ paddingRight: "0.5%" }}>
                        {timeline.length === 0 ? (
                          <p className="text-white/50" style={{ fontSize: "0.85vw" }}>UNAVAILABLE — no working hours set for this day.</p>
                        ) : (
                          <ul className="space-y-[0.6%]">
                            {timeline.map((seg, i) => (
                              <li key={i}>
                                {seg.kind === "available" ? (
                                  <button
                                    type="button"
                                    onClick={() => setActiveSlot({ start: seg.start, end: seg.end })}
                                    className="flex w-full items-center justify-between rounded-lg border border-dashed border-royal-light/30 bg-royal-light/[0.03] px-[1.2%] py-[0.9%] text-left text-royal-light transition hover:border-royal-light/60 hover:bg-royal-light/10 hover:shadow-[0_0_12px_-4px_rgba(91,155,255,0.5)]"
                                    style={{ fontSize: "0.8vw" }}
                                  >
                                    <span>
                                      {formatTime12h(seg.start)} – {formatTime12h(seg.end)}
                                    </span>
                                    <span className="tracking-wide text-white/40" style={{ fontSize: "0.68vw" }}>AVAILABLE</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDetail(seg.booking)}
                                    className={`flex w-full items-center justify-between rounded-lg border px-[1.2%] py-[0.9%] text-left transition hover:bg-white/[0.06] ${bookingKindClass(seg.booking)}`}
                                    style={{ fontSize: "0.8vw" }}
                                  >
                                    <span>
                                      {formatTime12h(seg.start)} – {formatTime12h(seg.end)} ({timeToMinutes(seg.end) - timeToMinutes(seg.start)}m) · {bookingKindLabel(seg.booking)}
                                    </span>
                                    {seg.booking.serviceName && (
                                      <span className="text-white/40" style={{ fontSize: "0.7vw" }}>{seg.booking.serviceName}</span>
                                    )}
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

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
      </main>
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
