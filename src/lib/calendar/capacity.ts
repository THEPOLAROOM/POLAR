// POLAR Capacity View — how booked a working day is, as a fraction of
// its genuinely bookable time. Pure and dependency-free so thresholds
// and edge cases can be tested/refined independently of the UI.
//
//   bookable = working-hours windows − blocked time / breaks
//   booked   = client / walk-in / barter minutes inside bookable time
//   ratio    = booked ÷ bookable   (0–1)
//
// Minutes, not appointment counts, so services of different lengths are
// weighted correctly. Overlapping bookings are merged and anything
// outside working hours is ignored, so the ratio never exceeds 1.

export type CapacityStatus =
  /** No working hours that weekday — not "0% booked". */
  | "off"
  /** Working day, but all of it is blocked (e.g. "Block whole day"). */
  | "blocked"
  /** Working day with bookable time; `ratio` is meaningful. */
  | "open";

export type DayCapacity = {
  status: CapacityStatus;
  bookableMinutes: number;
  bookedMinutes: number;
  /** booked ÷ bookable (0–1) when status is "open", otherwise null. */
  ratio: number | null;
};

type Window = { startTime: string; endTime: string };
type Occupancy = { startTime: string; endTime: string; isBlocked: boolean };
type Interval = [number, number];

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

function merge(intervals: Interval[]): Interval[] {
  const sorted = intervals.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const out: Interval[] = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

function intersect(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = [];
  for (const [s1, e1] of a) for (const [s2, e2] of b) {
    const s = Math.max(s1, s2), e = Math.min(e1, e2);
    if (e > s) out.push([s, e]);
  }
  return merge(out);
}

function subtract(a: Interval[], b: Interval[]): Interval[] {
  let rest = a;
  for (const [bs, be] of b) {
    rest = rest.flatMap(([s, e]): Interval[] => {
      if (be <= s || bs >= e) return [[s, e]];
      const parts: Interval[] = [];
      if (bs > s) parts.push([s, bs]);
      if (be < e) parts.push([be, e]);
      return parts;
    });
  }
  return rest;
}

const total = (xs: Interval[]) => xs.reduce((sum, [s, e]) => sum + (e - s), 0);

export function computeDayCapacity(windows: Window[], occupancies: Occupancy[]): DayCapacity {
  const working = merge(windows.map((w) => [toMinutes(w.startTime), toMinutes(w.endTime)]));
  if (total(working) === 0) return { status: "off", bookableMinutes: 0, bookedMinutes: 0, ratio: null };

  const span = (o: Occupancy): Interval => [toMinutes(o.startTime), toMinutes(o.endTime)];
  const blocked = merge(occupancies.filter((o) => o.isBlocked).map(span));
  const bookable = subtract(working, blocked);
  const bookableMinutes = total(bookable);
  if (bookableMinutes === 0) return { status: "blocked", bookableMinutes: 0, bookedMinutes: 0, ratio: null };

  const booked = intersect(merge(occupancies.filter((o) => !o.isBlocked).map(span)), bookable);
  const bookedMinutes = total(booked);
  return { status: "open", bookableMinutes, bookedMinutes, ratio: bookedMinutes / bookableMinutes };
}
