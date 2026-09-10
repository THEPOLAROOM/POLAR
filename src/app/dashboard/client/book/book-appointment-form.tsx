"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { formatTime12h } from "@/lib/dates";
import { bookSlot, getBookableSlots, type BookableSlot } from "@/lib/actions/bookings";
import type { ServiceOption } from "./page";

// Boxes below are measured directly against the mastered UI asset's
// native 1536x1024 canvas (polar-book-appointment-ui-mastered.png),
// same technique used on the Client Dashboard / My Appointments.
// Unlike those pages, almost every cell here is a genuinely empty,
// fully dynamic control (no baked placeholder content to cover) —
// so most boxes below size/position REAL interactive elements
// directly, rather than patching baked text. Do not adjust without
// re-measuring the asset.
const OVERLAY_WIDTH_PCT = 58;
const OVERLAY_TOP_PCT = 25;
const OVERLAY_LEFT_PCT = (100 - OVERLAY_WIDTH_PCT) / 2;

const PANEL_BG = "#000E18";

const SERVICE_DROPDOWN_BOX = { left: "5.47%", top: "32.52%", width: "23.96%", height: "6.35%" };

const CALENDAR_NAV_PREV_BOX = { left: "36.13%", top: "33.20%", width: "2.60%", height: "4.39%" };
const CALENDAR_NAV_NEXT_BOX = { left: "57.10%", top: "33.20%", width: "2.60%", height: "4.39%" };
const CALENDAR_MONTHYEAR_BOX = { left: "42.32%", top: "33.79%", width: "11.72%", height: "2.93%" };

// 7 columns, 6 possible rows (the mastered art shows 5 — a 6th row
// only ever appears for months that genuinely need one, using the
// exact same cell styling/spacing).
const CAL_COL_LEFT_PCT = 544 / 1536; // fraction, first column left edge
const CAL_COL_PITCH_PCT = 56.3 / 1536;
const CAL_CELL_W_PCT = 46 / 1536;
const CAL_ROW_TOP_PCT = 431 / 1024;
const CAL_ROW_PITCH_PCT = 53.3 / 1024;
const CAL_CELL_H_PCT = 44 / 1024;

const TIME_GRID_BOX = { left: "63.15%", top: "31.64%", width: "33.85%", height: "25%" };

const RECURRING_NO_BOX = { left: "63.15%", top: "65.92%", width: "15.95%", height: "5.08%" };
const RECURRING_YES_BOX = { left: "80.40%", top: "65.92%", width: "16.60%", height: "5.08%" };
const STEPPER_PANEL_BOX = { left: "63.15%", top: "74.61%", width: "33.85%", height: "9.28%" };

const CONFIRM_BOX = { left: "1.69%", top: "86.91%", width: "96.61%", height: "6.15%" };
const HELPER_BOX = { left: "36.78%", top: "93.55%", width: "26.43%", height: "4.39%" };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toDateStr(year: number, month0: number, day: number): string {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

// Calendar grid cells for one month, Monday-first, as a flat array
// (length a multiple of 7) of day numbers or null for the leading/
// trailing blanks — exactly the structure the mastered design shows,
// just computed for whichever real month is being viewed instead of
// a fixed example.
function getMonthCells(year: number, month0: number): (number | null)[] {
  const firstDow = new Date(Date.UTC(year, month0, 1)).getUTCDay(); // Sun=0..Sat=6
  const leading = (firstDow + 6) % 7; // Mon=0..Sun=6
  const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const cells: (number | null)[] = Array(leading).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function BookAppointmentForm({
  services,
  availableDaysOfWeek,
  today,
}: {
  services: ServiceOption[];
  availableDaysOfWeek: number[];
  today: string;
}) {
  const [serviceId, setServiceId] = useState<string>("");
  const [viewYear, setViewYear] = useState(() => Number(today.slice(0, 4)));
  const [viewMonth0, setViewMonth0] = useState(() => Number(today.slice(5, 7)) - 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<BookableSlot[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState<"no" | "yes">("no");
  const [intervalWeeks, setIntervalWeeks] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [slotsPending, startSlotsTransition] = useTransition();
  const [submitPending, startSubmitTransition] = useTransition();

  const availableSet = useMemo(() => new Set(availableDaysOfWeek), [availableDaysOfWeek]);
  const cells = useMemo(() => getMonthCells(viewYear, viewMonth0), [viewYear, viewMonth0]);

  const todayYear = Number(today.slice(0, 4));
  const todayMonth0 = Number(today.slice(5, 7)) - 1;
  const isViewingCurrentOrPastMonth =
    viewYear < todayYear || (viewYear === todayYear && viewMonth0 <= todayMonth0);

  function goPrevMonth() {
    if (isViewingCurrentOrPastMonth) return;
    setViewMonth0((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }
  function goNextMonth() {
    setViewMonth0((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  function selectDate(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setSlots(null);
    setSlotsError(null);
    startSlotsTransition(async () => {
      const result = await getBookableSlots(dateStr);
      if ("error" in result) {
        setSlotsError(result.error);
      } else {
        setSlots(result.slots);
      }
    });
  }

  function handleConfirm() {
    if (!serviceId || !selectedDate || !selectedTime) return;
    const formData = new FormData();
    formData.set("recurrence", isRecurring === "yes" ? "weekly" : "one_off");
    formData.set("date", selectedDate);
    formData.set("service_id", serviceId);
    formData.set("start_time", selectedTime);
    formData.set(
      "recurrence_interval_weeks",
      String(isRecurring === "yes" ? intervalWeeks : 1)
    );

    setSubmitError(null);
    startSubmitTransition(async () => {
      const result = await bookSlot(formData);
      if (result && "error" in result) {
        setSubmitError(result.error);
      } else {
        setSubmitSuccess(true);
        setSelectedDate(null);
        setSelectedTime(null);
        setSlots(null);
        setIsRecurring("no");
        setIntervalWeeks(1);
      }
    });
  }

  const canConfirm = Boolean(serviceId && selectedDate && selectedTime);

  return (
    <>
      {/* Mobile/tablet — simple functional placeholder, same fields
          as desktop, plain markup. Desktop-only pass per the mastered
          asset supplied for this task; a mastered mobile design is
          separate, upcoming work. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">Book an appointment</h1>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium text-polar-text">Service</span>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
          >
            <option value="" disabled>
              Choose a service
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMinutes} min)
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium text-polar-text">Date</span>
          <input
            type="date"
            min={today}
            defaultValue={selectedDate ?? ""}
            onChange={(e) => e.target.value && selectDate(e.target.value)}
            className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
          />
        </label>

        {selectedDate && (
          <div className="mt-4">
            {slotsPending && <p className="text-sm text-polar-muted">Loading times…</p>}
            {slotsError && <p className="text-sm text-polar-danger">{slotsError}</p>}
            {slots && slots.length === 0 && (
              <p className="text-sm text-polar-muted">No availability on this day.</p>
            )}
            {slots && slots.length > 0 && (
              <ul className="space-y-2">
                {slots.map((slot) => (
                  <li key={slot.startTime} className="flex items-center justify-between rounded border border-polar-border px-3 py-2">
                    <span className="text-sm text-polar-text">{formatTime12h(slot.startTime)}</span>
                    {slot.booked ? (
                      <span className="text-xs text-polar-muted">BOOKED</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedTime(slot.startTime)}
                        className={`rounded border px-3 py-1 text-xs ${selectedTime === slot.startTime ? "border-polar-primary bg-polar-primary text-white" : "border-polar-border text-polar-text"}`}
                      >
                        {selectedTime === slot.startTime ? "Selected" : "Select"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <label className="mt-4 flex items-center gap-2 text-sm text-polar-text">
          <input
            type="checkbox"
            checked={isRecurring === "yes"}
            onChange={(e) => setIsRecurring(e.target.checked ? "yes" : "no")}
          />
          Repeat this appointment weekly
        </label>
        {isRecurring === "yes" && (
          <label className="mt-2 block text-sm">
            <span className="mb-1 block font-medium text-polar-text">Every how many weeks?</span>
            <input
              type="number"
              min={1}
              value={intervalWeeks}
              onChange={(e) => setIntervalWeeks(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
              className="w-24 rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
            />
          </label>
        )}

        {submitError && <p className="mt-4 text-sm text-polar-danger">{submitError}</p>}
        {submitSuccess && <p className="mt-4 text-sm text-polar-success">Appointment booked.</p>}

        <button
          type="button"
          disabled={!canConfirm || submitPending}
          onClick={handleConfirm}
          className="mt-6 w-full rounded bg-polar-primary py-3 text-center text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitPending ? "Booking…" : "Confirm Appointment"}
        </button>
      </main>

      {/* Desktop — two-asset architecture: the same Client Dashboard
          desktop background, plus the mastered, transparent Book An
          Appointment UI overlay (polar-book-appointment-ui-mastered.png)
          as an independently-sized inset box (its own 1536:1024
          ratio; the two assets don't share an aspect ratio, same
          situation as the mobile My Appointments overlay), centred
          and positioned so the POLAR LONDON wall branding stays
          visible above it. Every cell in the mastered art is an
          empty, fully dynamic control (service dropdown, calendar
          days, time slots, recurring toggle/stepper) — there is no
          baked placeholder content to patch over here, so real
          interactive elements are sized/positioned directly against
          the measured boxes instead. */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full aspect-[1672/941]">
            <Image
              src="/dashboard/polar-client-dashboard-desktop-background.png"
              alt=""
              fill
              priority
              className="object-cover"
              aria-hidden="true"
            />

            <div
              className="absolute"
              style={{
                left: `${OVERLAY_LEFT_PCT}%`,
                top: `${OVERLAY_TOP_PCT}%`,
                width: `${OVERLAY_WIDTH_PCT}%`,
                aspectRatio: "1536 / 1024",
              }}
            >
              <Image
                src="/dashboard/polar-book-appointment-ui-mastered.png"
                alt=""
                fill
                priority
                className="object-cover"
                aria-hidden="true"
              />

              {/* Panel 1 — Select a Service. Header/label baked; the
                  dropdown itself is real. */}
              <select
                aria-label="Select a service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="absolute appearance-none rounded-lg border border-royal-light/60 bg-navy/80 px-3 text-white outline-none"
                style={{ ...SERVICE_DROPDOWN_BOX, fontSize: "1vw" }}
              >
                <option value="" disabled>
                  Select a service
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.id} className="bg-navy text-white">
                    {s.name} ({s.durationMinutes} min)
                  </option>
                ))}
              </select>

              {/* Panel 2 — Choose a Date. Header, day-of-week labels
                  and legend are baked; nav, Month/Year, and every day
                  cell are real. */}
              <button
                type="button"
                aria-label="Previous month"
                onClick={goPrevMonth}
                disabled={isViewingCurrentOrPastMonth}
                className="absolute disabled:opacity-30"
                style={CALENDAR_NAV_PREV_BOX}
              />
              <button
                type="button"
                aria-label="Next month"
                onClick={goNextMonth}
                className="absolute"
                style={CALENDAR_NAV_NEXT_BOX}
              />
              <div
                className="absolute flex items-center justify-center whitespace-nowrap font-display text-white"
                style={{ ...CALENDAR_MONTHYEAR_BOX, backgroundColor: PANEL_BG, fontSize: "1.05vw" }}
              >
                {MONTH_NAMES[viewMonth0]} {viewYear}
              </div>

              {cells.map((day, i) => {
                if (day === null) return null;
                const row = Math.floor(i / 7);
                const col = i % 7;
                const dateStr = toDateStr(viewYear, viewMonth0, day);
                const dow = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
                const isPast = dateStr < today;
                const isToday = dateStr === today;
                const isAvailable = !isPast && availableSet.has(dow);
                const isSelected = dateStr === selectedDate;

                const left = `${(CAL_COL_LEFT_PCT + CAL_COL_PITCH_PCT * col) * 100}%`;
                const top = `${(CAL_ROW_TOP_PCT + CAL_ROW_PITCH_PCT * row) * 100}%`;
                const cellW = `${CAL_CELL_W_PCT * 100}%`;
                const cellH = `${CAL_CELL_H_PCT * 100}%`;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => selectDate(dateStr)}
                    aria-label={dateStr}
                    aria-pressed={isSelected}
                    className={[
                      "absolute flex items-center justify-center rounded-md text-white transition",
                      isSelected
                        ? "bg-royal border border-royal-light"
                        : isAvailable
                          ? "bg-emerald-500/15 border border-emerald-400/60 hover:bg-emerald-500/30"
                          : "bg-white/5 border border-white/10 text-white/25 cursor-not-allowed",
                      isToday ? "ring-2 ring-magenta" : "",
                    ].join(" ")}
                    style={{ left, top, width: cellW, height: cellH, fontSize: "0.85vw" }}
                  >
                    {day}
                  </button>
                );
              })}

              {/* Panel 3 — Choose a Time + Make This a Recurring
                  Appointment. Headers baked; slot grid, toggle, and
                  stepper are real. */}
              <div className="absolute grid grid-cols-4 gap-[1%]" style={TIME_GRID_BOX}>
                {slotsError && (
                  <p className="col-span-4 text-xs text-magenta">{slotsError}</p>
                )}
                {!selectedDate && (
                  <p className="col-span-4 self-start font-body text-white/40" style={{ fontSize: "0.85vw" }}>
                    Choose a date to see available times.
                  </p>
                )}
                {selectedDate && slotsPending && (
                  <p className="col-span-4 self-start font-body text-white/40" style={{ fontSize: "0.85vw" }}>
                    Loading times…
                  </p>
                )}
                {selectedDate && !slotsPending && slots && slots.length === 0 && (
                  <p className="col-span-4 self-start font-body text-white/40" style={{ fontSize: "0.85vw" }}>
                    No availability on this day.
                  </p>
                )}
                {slots?.map((slot) => {
                  const isSelected = selectedTime === slot.startTime;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={slot.booked}
                      onClick={() => setSelectedTime(slot.startTime)}
                      className={[
                        "rounded-lg border px-1 py-2 text-white transition",
                        isSelected
                          ? "bg-royal border-royal-light"
                          : slot.booked
                            ? "border-white/10 bg-white/5 text-white/25 cursor-not-allowed"
                            : "border-royal-light/50 bg-navy/60 hover:bg-royal/20",
                      ].join(" ")}
                      style={{ fontSize: "0.85vw" }}
                    >
                      {formatTime12h(slot.startTime)}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsRecurring("no")}
                aria-pressed={isRecurring === "no"}
                className={`absolute rounded-lg border transition ${isRecurring === "no" ? "border-royal-light bg-royal/10" : "border-white/15 bg-transparent"}`}
                style={RECURRING_NO_BOX}
              />
              <button
                type="button"
                onClick={() => setIsRecurring("yes")}
                aria-pressed={isRecurring === "yes"}
                className={`absolute rounded-lg border transition ${isRecurring === "yes" ? "border-magenta bg-magenta/10" : "border-white/15 bg-transparent"}`}
                style={RECURRING_YES_BOX}
              />

              {isRecurring === "yes" && (
                <div
                  className="absolute flex items-center justify-center gap-3"
                  style={STEPPER_PANEL_BOX}
                >
                  <button
                    type="button"
                    aria-label="Fewer weeks"
                    onClick={() => setIntervalWeeks((n) => Math.max(1, n - 1))}
                    className="flex aspect-square h-[45%] items-center justify-center rounded-md border border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    −
                  </button>
                  <span
                    className="flex h-[45%] min-w-[2.5em] items-center justify-center rounded-md border border-white/20 bg-navy/60 px-3 text-white"
                    style={{ fontSize: "1vw" }}
                  >
                    {intervalWeeks}
                  </span>
                  <button
                    type="button"
                    aria-label="More weeks"
                    onClick={() => setIntervalWeeks((n) => n + 1)}
                    className="flex aspect-square h-[45%] items-center justify-center rounded-md border border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    +
                  </button>
                  <span className="text-white/80" style={{ fontSize: "0.9vw" }}>
                    week{intervalWeeks === 1 ? "" : "s"}
                  </span>
                </div>
              )}

              <button
                type="button"
                disabled={!canConfirm || submitPending}
                onClick={handleConfirm}
                aria-label="Confirm appointment"
                className="absolute rounded-lg disabled:cursor-not-allowed"
                style={CONFIRM_BOX}
              />

              <div
                className="absolute flex items-center justify-center whitespace-nowrap font-body text-white/70"
                style={{ ...HELPER_BOX, fontSize: "0.8vw" }}
              >
                {submitError
                  ? submitError
                  : submitSuccess
                    ? "Appointment booked."
                    : submitPending
                      ? "Booking…"
                      : "Select a service, date and time to continue."}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
