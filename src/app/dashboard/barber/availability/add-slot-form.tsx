"use client";

import { useState, useTransition } from "react";
import { createAvailabilitySlot } from "@/lib/actions/barber-availability";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const startWeekday = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(year, month, d)));
  return cells;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Availability is a recurring weekly template (barber_availability
 * stores day_of_week, not a specific date) — that hasn't changed.
 * This calendar is a friendlier way to pick a weekday: clicking any
 * date derives its day-of-week and submits that, same as the old
 * dropdown did. `today` is passed in from the server (shop-local, via
 * getShopToday()) so "today" is highlighted correctly regardless of
 * the visitor's own device/timezone.
 */
export function AddSlotForm({ today }: { today: string }) {
  const todayDate = new Date(`${today}T00:00:00Z`);
  const [viewYear, setViewYear] = useState(todayDate.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getUTCMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  const cells = getMonthGrid(viewYear, viewMonth);
  const timeRangeInvalid =
    startTime !== "" && endTime !== "" && endTime <= startTime;

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selectedDate) {
      setError("Choose a date.");
      return;
    }
    // Client-side check, same rule the server already enforces in
    // createAvailabilitySlot — this just prevents the round trip.
    if (timeRangeInvalid) {
      setError("End time must be after start time.");
      return;
    }

    const dayOfWeek = new Date(`${selectedDate}T00:00:00Z`).getUTCDay();
    const formData = new FormData();
    formData.set("day_of_week", String(dayOfWeek));
    formData.set("start_time", startTime);
    formData.set("end_time", endTime);

    setPending(true);
    startTransition(async () => {
      const result = await createAvailabilitySlot(formData);
      setPending(false);
      if (result && "error" in result) {
        setError(result.error);
      } else {
        setSelectedDate(null);
        setStartTime("");
        setEndTime("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-4">
      <div>
        <span className="mb-1 block text-sm font-medium text-polar-text">
          Day
        </span>
        <p className="mb-2 text-xs text-polar-muted">
          Pick any date on the weekday you want — availability repeats every
          week.
        </p>
        <div className="flex items-center justify-between text-sm text-polar-text">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="rounded border border-polar-border px-2 py-1 text-xs"
          >
            ‹
          </button>
          <span>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded border border-polar-border px-2 py-1 text-xs"
          >
            ›
          </button>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">
          {WEEKDAY_HEADERS.map((label) => (
            <div key={label} className="text-polar-muted">
              {label}
            </div>
          ))}
          {cells.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} />;
            }
            const dateStr = toDateString(date);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                className={
                  "rounded border py-1 " +
                  (isSelected
                    ? "border-polar-text bg-polar-text text-white"
                    : isToday
                      ? "border-polar-text font-semibold text-polar-text"
                      : "border-polar-border text-polar-text")
                }
              >
                {date.getUTCDate()}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-polar-text">
          Start time
        </span>
        <input
          type="time"
          required
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-polar-text">
          End time
        </span>
        <input
          type="time"
          required
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
      </label>

      {timeRangeInvalid && (
        <p className="text-sm text-polar-danger">
          End time must be after start time.
        </p>
      )}
      {error && !timeRangeInvalid && (
        <p className="text-sm text-polar-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !selectedDate || timeRangeInvalid}
        className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add slot"}
      </button>
    </form>
  );
}
