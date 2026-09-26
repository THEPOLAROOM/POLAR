// Total Visits — how many times a client has actually been seen, counted
// as appointment OCCURRENCES, not booking rows (a weekly booking is one
// row but many visits). Pure and dependency-free so the rule is testable.
//
// Counting rule:
//   - Only confirmed client appointments are passed in (callers exclude
//     cancelled rows, blocked time and breaks).
//   - A one-off booking is 1 visit once it has happened.
//   - A weekly booking is expanded with the same rule the Calendar uses
//     (every `recurrence_interval_weeks` weeks from start_date, same
//     weekday, up to end_date if set) and every occurrence that has
//     happened counts.
//   - "Has happened" = a date before today, or today once its end time
//     has passed (shop time). Future occurrences are never counted.
//   - One-off bookings marked no_show are not visits. (no_show is a
//     per-row flag; the current schema has no per-occurrence no-show or
//     cancellation for weekly series, so those can't be excluded.)

export type VisitRow = {
  recurrence: "one_off" | "weekly";
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  recurrence_interval_weeks: number | null;
  end_time: string; // HH:MM[:SS]
  no_show: boolean | null;
};

const DAY_MS = 86400000;
const toMs = (d: string) => Date.parse(`${d}T00:00:00Z`);

export function countVisits(rows: VisitRow[], now: { today: string; nowTime: string }): number {
  const nowHHMM = now.nowTime.slice(0, 5);
  let total = 0;
  for (const row of rows) {
    const endedToday = row.end_time.slice(0, 5) <= nowHHMM;
    // Last date whose occurrence has fully happened.
    const lastDate = endedToday ? now.today : new Date(toMs(now.today) - DAY_MS).toISOString().slice(0, 10);

    if (row.recurrence === "one_off") {
      if (!row.no_show && row.start_date <= lastDate) total += 1;
      continue;
    }

    const limit = row.end_date && row.end_date < lastDate ? row.end_date : lastDate;
    if (row.start_date > limit) continue;
    const intervalDays = (row.recurrence_interval_weeks || 1) * 7;
    const span = Math.round((toMs(limit) - toMs(row.start_date)) / DAY_MS);
    total += Math.floor(span / intervalDays) + 1;
  }
  return total;
}
