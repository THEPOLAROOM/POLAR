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
