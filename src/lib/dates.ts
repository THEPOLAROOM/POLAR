/**
 * "Today" as a YYYY-MM-DD string in the shop's local time (Europe/
 * London), not the server's own time zone. Every date/time value in
 * this app (barber_availability slots, bookings) is a naive local
 * value with that same implicit assumption — computing "today" via
 * UTC (e.g. `new Date().toISOString().slice(0, 10)`) is wrong for
 * roughly the first hour of each UK calendar day during British
 * Summer Time, when UTC is still on the previous date.
 */
export function getShopToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(new Date());
}

/**
 * Formats a stored 24-hour "HH:MM" or "HH:MM:SS" time string as
 * 12-hour with AM/PM for display, e.g. "16:54" -> "4:54 PM". Storage
 * (the underlying `time` columns) is unchanged — this is display-only.
 */
export function formatTime12h(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour24 = Number(hourStr);
  const minute = minuteStr ?? "00";
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
}
