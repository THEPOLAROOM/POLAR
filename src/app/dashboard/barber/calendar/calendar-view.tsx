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

const ASSET_ASPECT = "1893 / 705";

// Every box below is measured directly against the mastered asset's
// own cropped canvas (pixel-level border scan), same technique used
// throughout the Barber Portal.
const SMART_ANALYTICS_BOX = { left: "29.42%", top: "18.16%", width: "12.84%", height: "8.79%" };
const DAY_TAB_BOX = { left: "46.38%", top: "18.72%", width: "6.07%", height: "7.66%" };
const WEEK_TAB_BOX = { left: "53.09%", top: "18.72%", width: "6.87%", height: "7.66%" };
const MONTH_TAB_BOX = { left: "60.64%", top: "18.16%", width: "7.50%", height: "8.79%" };
const YEAR_TAB_BOX = { left: "68.67%", top: "18.72%", width: "6.34%", height: "7.66%" };
const PREV_BOX = { left: "80.30%", top: "18.72%", width: "2.64%", height: "7.66%" };
const TODAY_BOX = { left: "84.52%", top: "18.16%", width: "8.72%", height: "8.79%" };
const NEXT_BOX = { left: "94.56%", top: "18.72%", width: "2.64%", height: "7.66%" };

const GRID_AREA_BOX = { left: "0.74%", top: "29.08%", width: "77.18%", height: "59.15%" };
const GRID_LEFT = 0.74;
const GRID_TOP = 36.17;
const COL_WIDTH = 11.02;
const ROW_HEIGHT = 10.41;

const ADD_APPOINTMENT_BOX = { left: "80.19%", top: "60.57%", width: "17.43%", height: "6.38%" };
const RIGHT_TEXT_PATCH_BOX = { left: "80.19%", top: "46.10%", width: "17.43%", height: "13.48%" };

const CELL_FILL = "#011530";
const PANEL_FILL = "#00102c";

const HIT_AREA_CLASS =
  "absolute rounded-2xl bg-transparent transition duration-200 ease-out hover:shadow-[0_0_18px_4px_rgba(91,155,255,0.4),0_0_26px_8px_rgba(255,61,154,0.22)]";

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
function money(n: number): string {
  return `£${n.toFixed(2)}`;
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
  if (b.isBlocked) return "BLOCKED";
  if (b.isBarter) return "BARTER";
  if (b.isWalkIn) return "WALK-IN";
  return b.clientName ?? "Appointment";
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
  weekDays: { date: string; label: string; count: number; isFullyBooked: boolean }[] | null;
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

            <Link href={`?view=day&date=${date}`} className={HIT_AREA_CLASS} style={DAY_TAB_BOX} aria-label="Day view" />
            <Link href={`?view=week&date=${date}`} className={HIT_AREA_CLASS} style={WEEK_TAB_BOX} aria-label="Week view" />
            <Link href={`?view=month&date=${date}`} className={HIT_AREA_CLASS} style={MONTH_TAB_BOX} aria-label="Month view" />
            <Link href={`?view=year&date=${date}`} className={HIT_AREA_CLASS} style={YEAR_TAB_BOX} aria-label="Year view" />

            <Link href={prevHref} className={HIT_AREA_CLASS} style={PREV_BOX} aria-label="Previous" />
            <Link href={todayHref} className={HIT_AREA_CLASS} style={TODAY_BOX} aria-label="Today" />
            <Link href={nextHref} className={HIT_AREA_CLASS} style={NEXT_BOX} aria-label="Next" />

            {/* Right panel — permanent copy + real today summary
                patched over the baked example text; the artwork's own
                "Your Calendar At a Glance" heading and crown are left
                untouched. */}
            <div className="absolute flex flex-col justify-center" style={RIGHT_TEXT_PATCH_BOX}>
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
                    left: `${GRID_LEFT + col * COL_WIDTH}%`,
                    top: `${GRID_TOP + row * ROW_HEIGHT}%`,
                    width: `${COL_WIDTH}%`,
                    height: `${ROW_HEIGHT}%`,
                  };
                  if (!cell) return <div key={i} className="absolute" style={box} aria-hidden="true" />;
                  return (
                    <Link
                      key={i}
                      href={`?view=day&date=${cell.date}`}
                      className="absolute overflow-hidden transition hover:bg-white/[0.04]"
                      style={box}
                    >
                      <div
                        className="absolute"
                        style={{ left: "6%", top: "8%", width: "26%", height: "30%", backgroundColor: CELL_FILL }}
                        aria-hidden="true"
                      />
                      <p
                        className={`absolute font-body ${cell.isFullyBooked ? "text-white/35" : "text-white"}`}
                        style={{ left: "6%", top: "8%", fontSize: "0.85vw" }}
                      >
                        {cell.day}
                      </p>
                      {cell.isFullyBooked && <div className="absolute inset-0 bg-black/35" aria-hidden="true" />}
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
                            <span className="mt-auto text-royal-light" style={{ fontSize: "0.7vw" }}>
                              {d.count === 0 ? "Free" : `${d.count} booking${d.count === 1 ? "" : "s"}`}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}

                  {view === "year" && yearMonths && (
                    <>
                      <p className="font-display text-white" style={{ fontSize: "1vw" }}>{date.slice(0, 4)}</p>
                      <div className="mt-[0.8%] grid flex-1 grid-cols-4 grid-rows-3" style={{ gap: "0.8%" }}>
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
                      <div className="flex items-center justify-between">
                        <p className="font-display text-white" style={{ fontSize: "1vw" }}>{dayLabel(date)}</p>
                        <button
                          type="button"
                          onClick={handleBlockWholeDay}
                          disabled={pending}
                          className="rounded-md border border-magenta/40 px-[1%] py-[0.4%] text-magenta transition hover:bg-magenta/10 disabled:opacity-50"
                          style={{ fontSize: "0.68vw" }}
                        >
                          Block whole day
                        </button>
                      </div>
                      <div className="mt-[1%] flex-1 overflow-y-auto" style={{ paddingRight: "0.5%" }}>
                        {timeline.length === 0 ? (
                          <p className="text-white/50" style={{ fontSize: "0.85vw" }}>No availability set for this day.</p>
                        ) : (
                          <ul className="space-y-[0.5%]">
                            {timeline.map((seg, i) => (
                              <li key={i}>
                                {seg.kind === "available" ? (
                                  <button
                                    type="button"
                                    onClick={() => setActiveSlot({ start: seg.start, end: seg.end })}
                                    className="flex w-full items-center justify-between rounded-md border border-royal-light/25 px-[1.2%] py-[0.8%] text-left text-royal-light transition hover:bg-royal-light/10"
                                    style={{ fontSize: "0.8vw" }}
                                  >
                                    <span>
                                      {formatTime12h(seg.start)} – {formatTime12h(seg.end)}
                                    </span>
                                    <span className="text-white/40" style={{ fontSize: "0.7vw" }}>Available</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDetail(seg.booking)}
                                    className={`flex w-full items-center justify-between rounded-md border px-[1.2%] py-[0.8%] text-left transition hover:bg-white/[0.06] ${
                                      seg.booking.isBlocked
                                        ? "border-white/15 text-white/50"
                                        : seg.booking.isBarter
                                          ? "border-magenta/40 text-magenta"
                                          : "border-royal/40 text-white"
                                    }`}
                                    style={{ fontSize: "0.8vw" }}
                                  >
                                    <span>
                                      {formatTime12h(seg.start)} – {formatTime12h(seg.end)} · {bookingKindLabel(seg.booking)}
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
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50" onClick={() => setActiveSlot(null)}>
            <div
              className="w-72 rounded-xl border border-royal-light/40 bg-navy-light p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm text-white">
                {formatTime12h(activeSlot.start)} – {formatTime12h(activeSlot.end)}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <button type="button" onClick={() => setModal("book")} className="rounded-md bg-royal px-3 py-2 text-left text-sm text-white hover:bg-royal-dark">
                  Book Appointment
                </button>
                <button type="button" onClick={() => setModal("walkin")} className="rounded-md border border-royal-light/40 px-3 py-2 text-left text-sm text-white hover:bg-white/5">
                  Add Walk-In
                </button>
                <button type="button" onClick={() => setModal("barter")} className="rounded-md border border-magenta/40 px-3 py-2 text-left text-sm text-magenta hover:bg-magenta/10">
                  Add Barter
                </button>
                <button type="button" onClick={() => setModal("block")} className="rounded-md border border-white/20 px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5">
                  Block Time
                </button>
              </div>
              <button type="button" onClick={() => setActiveSlot(null)} className="mt-3 text-xs text-white/40 hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Book / Walk-in / Barter / Block forms */}
        {activeSlot && modal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50" onClick={closeModal}>
            <div className="w-96 rounded-xl border border-royal-light/40 bg-navy-light p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <p className="font-display text-white" style={{ fontSize: "1.1rem" }}>
                {modal === "book" && "Book Appointment"}
                {modal === "walkin" && "Add Walk-In"}
                {modal === "barter" && "Add Barter"}
                {modal === "block" && "Block Time"}
              </p>
              <p className="mt-1 text-xs text-white/50">
                {formatTime12h(activeSlot.start)} on {dayLabel(date)}
              </p>

              {modal === "book" && (
                <form
                  className="mt-4 space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    fd.set("date", date);
                    fd.set("start_time", activeSlot.start);
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
                  <ServiceSelect services={services} />
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
                    fd.set("start_time", activeSlot.start);
                    runAction(() => createWalkIn(fd));
                  }}
                >
                  <input name="label" type="text" placeholder="Name (optional)" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm text-white placeholder:text-white/30" />
                  <ServiceSelect services={services} />
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
                    fd.set("start_time", activeSlot.start);
                    runAction(() => createBarterBooking(fd));
                  }}
                >
                  <input name="with_label" type="text" placeholder="Who was it with?" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm text-white placeholder:text-white/30" />
                  <ServiceSelect services={services} />
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
                    const minutes = Number(new FormData(e.currentTarget).get("duration"));
                    const [h, m] = activeSlot.start.split(":").map(Number);
                    const endTotal = h * 60 + m + minutes;
                    fd.set("date", date);
                    fd.set("start_time", activeSlot.start);
                    fd.set("end_time", `${pad(Math.floor(endTotal / 60) % 24)}:${pad(endTotal % 60)}`);
                    runAction(() => createBlockedTime(fd));
                  }}
                >
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

              <button type="button" onClick={closeModal} className="mt-3 text-xs text-white/40 hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Existing appointment detail */}
        {detail && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50" onClick={() => setDetail(null)}>
            <div className="w-96 rounded-xl border border-royal-light/40 bg-navy-light p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <p className="font-display text-white" style={{ fontSize: "1.1rem" }}>{bookingKindLabel(detail)}</p>
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
                  {pending ? "…" : detail.isBlocked ? "Unblock" : "Cancel"}
                </button>
                <button type="button" onClick={() => setDetail(null)} className="ml-auto text-xs text-white/40 hover:text-white">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ServiceSelect({ services }: { services: Service[] }) {
  return (
    <select name="service_id" required className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm text-white">
      <option value="">Choose a service…</option>
      {services.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name} · {s.durationMinutes}m · {money(s.price)}
        </option>
      ))}
    </select>
  );
}
