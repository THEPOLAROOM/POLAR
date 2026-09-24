"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { formatTime12h } from "@/lib/dates";
import type { CalendarBooking } from "@/lib/queries/barber-calendar";
import { createWalkIn } from "@/lib/actions/walk-ins";
import { cancelBookingAsBarber } from "@/lib/actions/barber-bookings";
import { createBookingAsBarber, createBarterBooking, createBlockedTime } from "@/lib/actions/barber-calendar-actions";
import { FocusModeShell, ACCENTS } from "@/components/focus-mode/focus-mode-shell";
import { BarberRoom } from "../dashboard-scene";

export type ViewKind = "day" | "week" | "month" | "list" | "year";
export type MonthCell = { date: string; day: number; count: number; isFullyBooked: boolean } | null;
type Service = { id: string; name: string; durationMinutes: number; price: number };
type Client = { id: string; fullName: string };

// Calendar Focus Mode (desktop): the old layered calendar artwork and its
// measured patch boxes are gone — the calendar is now real HTML inside
// the reusable FocusModeShell, over the darkened POLAR Room. All booking
// data, actions and modals below are unchanged.
const PINK = ACCENTS.magenta;
const TABS: { view: ViewKind; label: string }[] = [
  { view: "day", label: "Day" },
  { view: "week", label: "Week" },
  { view: "month", label: "Month" },
  { view: "list", label: "List" },
];
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const CTRL = "flex h-9 items-center rounded-lg border border-white/[0.14] text-white/80 transition hover:bg-white/5 hover:text-white";

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
          off, and one large magenta Calendar panel on top. */}
      <FocusModeShell
        id="calendar"
        accent="magenta"
        room={<BarberRoom decorative />}
        title="CALENDAR"
        controls={
          <>
            <Link href={todayHref} className={`${CTRL} px-3.5 text-sm font-semibold ${date === today ? "text-white" : "text-white/80"}`} style={{ borderColor: `rgba(${PINK.rgb},0.45)` }}>
              Today
            </Link>
            <div className="flex items-center gap-1">
              <Link href={prevHref} aria-label="Previous" className={`${CTRL} w-9 justify-center text-lg`}>
                ‹
              </Link>
              <Link href={nextHref} aria-label="Next" className={`${CTRL} w-9 justify-center text-lg`}>
                ›
              </Link>
            </div>
            <p className="min-w-0 truncate text-xl font-extrabold tracking-tight text-white">{periodLabel(view, date)}</p>
            <div className="ml-auto flex items-center gap-3">
              <Link href="/dashboard/barber/calendar/analytics" className="text-sm text-white/50 transition hover:text-white">
                Analytics
              </Link>
              <div role="tablist" aria-label="Calendar view" className="flex rounded-lg border border-white/[0.12] bg-white/[0.02] p-0.5">
                {TABS.map(({ view: v, label }) => {
                  const active = view === v;
                  return (
                    <Link
                      key={v}
                      role="tab"
                      aria-selected={active}
                      href={`?view=${v}&date=${date}`}
                      className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition ${active ? "text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                      style={active ? { background: `rgba(${PINK.rgb},0.22)`, boxShadow: `inset 0 0 0 1px rgba(${PINK.rgb},0.7), 0 0 14px -4px rgba(${PINK.rgb},0.7)` } : undefined}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        }
      >
        {/* MONTH */}
        {view === "month" && monthCells && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="grid shrink-0 grid-cols-7 pb-2 text-[11px] font-bold tracking-[0.16em] text-white/45">
              {WEEKDAYS.map((d, i) => (
                <div key={d} className="px-2" style={i >= 5 ? { color: `rgba(${PINK.rgb},0.75)` } : undefined}>
                  {d}
                </div>
              ))}
            </div>
            <div
              className="grid min-h-0 flex-1 grid-cols-7 border-l border-t border-white/[0.08]"
              style={{ gridTemplateRows: `repeat(${Math.ceil(monthCells.length / 7)}, minmax(0, 1fr))` }}
            >
              {monthCells.map((cell, i) => {
                if (!cell) return <div key={i} className="border-b border-r border-white/[0.08] bg-white/[0.012]" aria-hidden="true" />;
                const isToday = cell.date === today;
                const isSelected = cell.date === date && !isToday;
                return (
                  <Link
                    key={i}
                    href={`?view=day&date=${cell.date}`}
                    aria-label={`${dayLabel(cell.date)}${cell.count > 0 ? `, ${cell.count} booking${cell.count === 1 ? "" : "s"}` : ""}`}
                    className="relative flex min-h-0 flex-col border-b border-r border-white/[0.08] p-2 transition hover:bg-white/[0.04]"
                    style={isSelected ? { boxShadow: `inset 0 0 0 1px rgba(${PINK.rgb},0.6)` } : undefined}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${isToday ? "text-white" : cell.isFullyBooked ? "text-white/35" : "text-white/85"}`}
                      style={isToday ? { background: PINK.hex, boxShadow: `0 0 12px rgba(${PINK.rgb},0.7)` } : undefined}
                    >
                      {cell.day}
                    </span>
                    {cell.count > 0 && (
                      <span className="mt-auto flex items-center gap-1.5 truncate text-xs font-semibold" style={{ color: cell.isFullyBooked ? "rgba(255,255,255,0.45)" : PINK.hex }}>
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cell.isFullyBooked ? "rgba(255,255,255,0.4)" : PINK.hex }} aria-hidden="true" />
                        {cell.isFullyBooked ? "Fully booked" : `${cell.count} booking${cell.count === 1 ? "" : "s"}`}
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
          <div className="grid min-h-0 flex-1 grid-cols-7 border-l border-t border-white/[0.08]">
            {weekDays.map((d, i) => {
              const isToday = d.date === today;
              return (
                <div key={d.date} className="flex min-h-0 flex-col border-b border-r border-white/[0.08]">
                  <Link
                    href={`?view=day&date=${d.date}`}
                    className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-3 py-2.5 transition hover:bg-white/[0.04]"
                  >
                    <span className="text-[11px] font-bold tracking-[0.16em]" style={{ color: i >= 5 ? `rgba(${PINK.rgb},0.75)` : "rgba(255,255,255,0.45)" }}>
                      {WEEKDAYS[i]}
                    </span>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${isToday ? "text-white" : "text-white/85"}`}
                      style={isToday ? { background: PINK.hex, boxShadow: `0 0 12px rgba(${PINK.rgb},0.7)` } : undefined}
                    >
                      {Number(d.date.slice(8))}
                    </span>
                  </Link>
                  <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
                    {d.bookings.length === 0 ? (
                      <p className="px-1 pt-1 text-xs text-white/30">{d.hasAvailability ? "Available" : "Unavailable"}</p>
                    ) : (
                      d.bookings.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setDetail(b)}
                          className={`block w-full rounded-md border px-2 py-1.5 text-left transition hover:bg-white/[0.06] ${bookingKindClass(b)}`}
                        >
                          <span className="block text-[11px] opacity-70">{formatTime12h(b.startTime)} – {formatTime12h(b.endTime)}</span>
                          <span className="block truncate text-xs font-semibold">{bookingKindLabel(b)}</span>
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
              <p className="text-lg font-bold text-white">{dayLabel(date)}</p>
              <button
                type="button"
                onClick={handleBlockWholeDay}
                disabled={pending}
                className="rounded-md border px-3 py-1.5 text-sm font-semibold transition hover:bg-white/5 disabled:opacity-50"
                style={{ borderColor: `rgba(${PINK.rgb},0.5)`, color: PINK.hex }}
              >
                Block whole day
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {timeline.length === 0 ? (
                <p className="pt-2 text-sm text-white/45">Unavailable — no working hours set for this day.</p>
              ) : (
                <ul className="space-y-2">
                  {timeline.map((seg, i) => (
                    <li key={i}>
                      {seg.kind === "available" ? (
                        <button
                          type="button"
                          onClick={() => setActiveSlot({ start: seg.start, end: seg.end })}
                          className="flex w-full items-center justify-between rounded-lg border border-dashed border-ice-glow/30 bg-ice-glow/[0.03] px-4 py-3 text-left text-sm text-ice-100 transition hover:border-ice-glow/60 hover:bg-ice-glow/10"
                        >
                          <span>
                            {formatTime12h(seg.start)} – {formatTime12h(seg.end)}
                          </span>
                          <span className="text-xs tracking-[0.14em] text-white/40">AVAILABLE</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDetail(seg.booking)}
                          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition hover:bg-white/[0.06] ${bookingKindClass(seg.booking)}`}
                        >
                          <span>
                            {formatTime12h(seg.start)} – {formatTime12h(seg.end)} ({timeToMinutes(seg.end) - timeToMinutes(seg.start)}m) · {bookingKindLabel(seg.booking)}
                          </span>
                          {seg.booking.serviceName && <span className="text-xs text-white/40">{seg.booking.serviceName}</span>}
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
              <p className="pt-2 text-sm text-white/45">No bookings in {monthLabel(date)}.</p>
            ) : (
              <div className="space-y-5">
                {listDays.map((d) => (
                  <section key={d.date}>
                    <Link
                      href={`?view=day&date=${d.date}`}
                      className="mb-2 inline-flex items-center gap-2 text-sm font-bold transition hover:text-white"
                      style={{ color: d.date === today ? PINK.hex : "rgba(255,255,255,0.75)" }}
                    >
                      {dayLabel(d.date)}
                      {d.date === today && <span className="text-[11px] tracking-[0.14em]">TODAY</span>}
                    </Link>
                    <ul className="space-y-1.5">
                      {d.bookings.map((b) => (
                        <li key={b.id}>
                          <button
                            type="button"
                            onClick={() => setDetail(b)}
                            className={`flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-2.5 text-left text-sm transition hover:bg-white/[0.06] ${bookingKindClass(b)}`}
                          >
                            <span className="w-44 shrink-0 tabular-nums opacity-80">
                              {formatTime12h(b.startTime)} – {formatTime12h(b.endTime)}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-semibold">{bookingKindLabel(b)}</span>
                            {b.serviceName && <span className="shrink-0 text-xs text-white/45">{b.serviceName}</span>}
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

        {/* YEAR — no tab any more; still served for existing ?view=year links. */}
        {view === "year" && yearMonths && (
          <div className="grid min-h-0 flex-1 grid-cols-4 content-start gap-3 overflow-y-auto">
            {yearMonths.map((m) => (
              <Link
                key={m.month}
                href={`?view=month&date=${date.slice(0, 4)}-${pad(m.month)}-01`}
                className="flex flex-col rounded-lg border border-white/10 p-3 transition hover:bg-white/[0.05]"
              >
                <span className="text-sm text-white">{m.label}</span>
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
