import Link from "next/link";
import Image from "next/image";
import { requireRole } from "@/lib/auth/require-role";
import { POLAR_BARBER_PROFILE_ID } from "@/lib/config";
import { getShopToday, formatTime12h } from "@/lib/dates";
import { DashboardNav } from "@/components/dashboard-nav";
import { CancelBookingButton } from "./cancel-booking-button";
import { PreviousAppointmentsToggle, type PreviousAppointment } from "./previous-appointments";

const NAV_LINKS = [
  { href: "/dashboard/client", label: "Dashboard" },
  { href: "/dashboard/client/book", label: "Book Appointment" },
  { href: "/dashboard/client/bookings", label: "My Bookings" },
];

const DAY_LABELS_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_LABELS_SHORT = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

// The overlay (plus every real-HTML piece positioned against it)
// renders at this fraction of the background's width, centred via
// equal insets on every side — same "breathing room" treatment as
// the Client Dashboard desktop composition.
const OVERLAY_SCALE = 0.6;
const OVERLAY_INSET_PCT = `${((1 - OVERLAY_SCALE) / 2) * 100}%`;
const OVERLAY_INSET = {
  left: OVERLAY_INSET_PCT,
  right: OVERLAY_INSET_PCT,
  top: OVERLAY_INSET_PCT,
  bottom: OVERLAY_INSET_PCT,
};

// Boxes below are measured directly against the mastered UI asset's
// native 1672x941 canvas (polar-client-appointments-ui-mastered.png),
// same technique as the client dashboard — now relative to the
// scaled-down OVERLAY_INSET wrapper rather than the full background.
// Do not adjust without re-measuring the asset.
const EDIT_BOX = { left: "66.21%", top: "45.70%", width: "24.40%", height: "11.16%" };
const CANCEL_BOX = { left: "66.21%", top: "58.45%", width: "24.40%", height: "7.97%" };
const PREV_BAR_BOX = { left: "14.35%", top: "76.94%", width: "76.26%", height: "13.50%" };
// Sits just below the toggle bar (bottom edge ~90.44%). Not part of
// the mastered asset (no expanded state was supplied), so it's
// allowed to extend past the aspect-box's own bottom edge into the
// revealed room floor below — the outer viewport wrapper (not this
// box) is what actually clips content, and there is real space there.
const PREV_LIST_BOX = { left: "14.35%", top: "90.9%", width: "76.26%", maxHeight: "20vh" };

const WEEKDAY_BOX = { left: "17.64%", top: "40.91%", width: "5.08%", height: "3.51%" };
const DAY_BOX = { left: "16.15%", top: "46.23%", width: "7.78%", height: "7.76%" };
const MONTHYEAR_BOX = { left: "15.85%", top: "52.92%", width: "8.97%", height: "5.74%" };
const TIME_PILL_BOX = { left: "14.59%", top: "61.11%", width: "11.18%", height: "6.59%" };

const FIELD_ROW_COMMON = { left: "36.24%", width: "27.75%", height: "5.31%" };
const FIELD_ROWS_TOP = {
  service: "37.41%",
  duration: "44.53%",
  shop: "51.86%",
  barber: "58.77%",
  style: "66.10%",
} as const;

const DATE_BG = "#061527";
const FIELD_RECT_BG = "#162539";
const TIME_PILL_BG = "#007FFB";

type ServiceInfo = { name: string; duration_minutes: number } | null;

type BookingRow = {
  id: string;
  recurrence: "one_off" | "weekly";
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled";
  service_id: string | null;
  services: ServiceInfo;
};

function addDaysUTC(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The soonest date >= today this booking occurs on, or null if it
// never occurs again. Weekly bookings are stored as a single row per
// series (not per occurrence), so the next occurrence has to be
// computed rather than read directly off start_date, which is just
// the series' original start.
function nextOccurrenceOnOrAfter(
  booking: Pick<BookingRow, "recurrence" | "start_date" | "end_date">,
  today: string
): string | null {
  if (booking.recurrence === "one_off") {
    return booking.start_date >= today ? booking.start_date : null;
  }
  if (booking.end_date && booking.end_date < today) return null;
  const base = booking.start_date > today ? booking.start_date : today;
  const bookingDow = new Date(`${booking.start_date}T00:00:00Z`).getUTCDay();
  const baseDow = new Date(`${base}T00:00:00Z`).getUTCDay();
  const next = addDaysUTC(base, (bookingDow - baseDow + 7) % 7);
  if (booking.end_date && next > booking.end_date) return null;
  return next;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTH_LABELS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Server-side ROLE check happens FIRST, same as every other protected
// dashboard page. All bookings/service reads are scoped to the
// caller's own via both the query and existing RLS ("bookings: client
// reads own", "services: any client reads active"). Barber/Shop come
// from the new get_barber_display_info() RPC (mirrors the existing
// get_barber_work_address() pattern exactly — SECURITY DEFINER, gated
// on the caller having a confirmed booking with that barber) since no
// prior read path exposed the barber's name/business name to a client.
export default async function MyAppointmentsPage() {
  const { supabase, user } = await requireRole("client");
  const today = getShopToday();

  const [{ data: bookingsRaw }, { data: barberInfoRows }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, recurrence, start_date, end_date, start_time, end_time, status, service_id, services(name, duration_minutes)"
      )
      .eq("client_profile_id", user.id)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase.rpc("get_barber_display_info", {
      target_barber_id: POLAR_BARBER_PROFILE_ID,
    }),
  ]);

  const bookings = (bookingsRaw ?? []) as unknown as BookingRow[];
  const barberInfo = (
    barberInfoRows as { barber_name: string | null; shop_name: string | null }[] | null
  )?.[0] ?? null;

  let upcoming: { booking: BookingRow; occurrenceDate: string } | null = null;
  for (const booking of bookings) {
    if (booking.status !== "confirmed") continue;
    const occurrenceDate = nextOccurrenceOnOrAfter(booking, today);
    if (
      occurrenceDate &&
      (!upcoming ||
        occurrenceDate < upcoming.occurrenceDate ||
        (occurrenceDate === upcoming.occurrenceDate &&
          booking.start_time < upcoming.booking.start_time))
    ) {
      upcoming = { booking, occurrenceDate };
    }
  }

  const previousAppointments: PreviousAppointment[] = bookings
    .filter((b) => b.id !== upcoming?.booking.id)
    .sort(
      (a, b) =>
        b.start_date.localeCompare(a.start_date) ||
        b.start_time.localeCompare(a.start_time)
    )
    .map((b) => ({
      id: b.id,
      dateLabel: formatDateLabel(b.start_date),
      timeLabel: `${formatTime12h(b.start_time)}–${formatTime12h(b.end_time)}`,
      serviceName: b.services?.name ?? "Service unavailable",
      statusLabel: b.status === "confirmed" ? "Confirmed" : "Cancelled",
    }));

  const occurrence = upcoming
    ? new Date(`${upcoming.occurrenceDate}T00:00:00Z`)
    : null;
  const weekdayLabel = occurrence ? DAY_LABELS_SHORT[occurrence.getUTCDay()] : null;
  const dayNumberLabel = occurrence ? String(occurrence.getUTCDate()) : null;
  const monthYearLabel = occurrence
    ? `${MONTH_LABELS_SHORT[occurrence.getUTCMonth()]} ${occurrence.getUTCFullYear()}`
    : null;
  const timeLabel = upcoming ? formatTime12h(upcoming.booking.start_time) : null;
  const serviceLabel = upcoming?.booking.services?.name ?? null;
  const durationLabel = upcoming?.booking.services
    ? `${upcoming.booking.services.duration_minutes} min`
    : null;
  const shopLabel = barberInfo?.shop_name ?? null;
  const barberLabel = barberInfo?.barber_name ?? null;

  return (
    <>
      <div className="sm:hidden">
        <DashboardNav links={NAV_LINKS} />
      </div>

      {/* Mobile/tablet — simple functional placeholder. Desktop-only
          pass per instruction; the mastered mobile design is separate,
          upcoming work. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">My Appointments</h1>
        {upcoming ? (
          <div className="mt-4 rounded border border-polar-border px-3 py-2">
            <p className="text-sm text-polar-text">
              {formatDateLabel(upcoming.occurrenceDate)} · {timeLabel}
            </p>
            <p className="text-xs text-polar-muted">{serviceLabel ?? "—"}</p>
            <div className="mt-2 flex items-center gap-2">
              <Link
                href={`/dashboard/client/bookings/${upcoming.booking.id}/reschedule`}
                className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text"
              >
                Edit
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-polar-muted">No upcoming appointment.</p>
        )}
      </main>

      {/* Desktop — two-asset architecture: the same POLAR Room
          background as the client dashboard, plus the mastered,
          transparent My Appointments UI overlay
          (polar-client-appointments-ui-mastered.png). No CSS draws
          the panels/card — that design lives entirely in the overlay
          PNG. Real HTML on top: the date/time/field values and the
          two action buttons/toggle.

          The overlay (plus everything positioned against it) is
          scaled down to OVERLAY_SCALE of the background's width and
          centred within it via equal insets on all four sides —
          same breathing-room treatment as the Client Dashboard.
          Since the background box already holds the artwork's exact
          1672:941 aspect ratio, shrinking every side by the same
          percentage preserves that ratio automatically without
          stretching, and every box below stays aligned since it's
          positioned relative to this same scaled wrapper. */}
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

            <div className="absolute" style={OVERLAY_INSET}>
            <Image
              src="/dashboard/polar-client-appointments-ui-mastered.png"
              alt=""
              fill
              priority
              className="object-cover"
              aria-hidden="true"
            />

            {upcoming ? (
              <>
                <div className="absolute flex items-center justify-center" style={{ ...WEEKDAY_BOX, backgroundColor: DATE_BG }}>
                  <p className="font-display text-white" style={{ fontSize: `${1.4 * OVERLAY_SCALE}vw` }}>{weekdayLabel}</p>
                </div>
                <div className="absolute flex items-center justify-center" style={{ ...DAY_BOX, backgroundColor: DATE_BG }}>
                  <p className="font-display font-bold text-white" style={{ fontSize: `${4.8 * OVERLAY_SCALE}vw`, lineHeight: 1 }}>{dayNumberLabel}</p>
                </div>
                <div className="absolute flex items-center justify-center" style={{ ...MONTHYEAR_BOX, backgroundColor: DATE_BG }}>
                  <p className="font-display text-white" style={{ fontSize: `${3.1 * OVERLAY_SCALE}vw` }}>{monthYearLabel}</p>
                </div>
                <div className="absolute flex items-center justify-center rounded-full" style={{ ...TIME_PILL_BOX, backgroundColor: TIME_PILL_BG }}>
                  <p className="font-display font-bold text-white" style={{ fontSize: `${2 * OVERLAY_SCALE}vw` }}>{timeLabel}</p>
                </div>

                {(
                  [
                    ["service", serviceLabel],
                    ["duration", durationLabel],
                    ["shop", shopLabel],
                    ["barber", barberLabel],
                    ["style", null],
                  ] as const
                ).map(([key, value]) => (
                  <div
                    key={key}
                    className="absolute flex items-center overflow-hidden px-4"
                    style={{ ...FIELD_ROW_COMMON, top: FIELD_ROWS_TOP[key], backgroundColor: FIELD_RECT_BG }}
                  >
                    <p className="truncate font-body text-white/90" style={{ fontSize: `${1.35 * OVERLAY_SCALE}vw` }}>
                      {value ?? "—"}
                    </p>
                  </div>
                ))}

                <Link
                  href={`/dashboard/client/bookings/${upcoming.booking.id}/reschedule`}
                  aria-label="Edit appointment"
                  className="absolute rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light"
                  style={EDIT_BOX}
                />
                <CancelBookingButton bookingId={upcoming.booking.id} box={CANCEL_BOX} />
              </>
            ) : null}

            <PreviousAppointmentsToggle
              box={PREV_BAR_BOX}
              listBox={PREV_LIST_BOX}
              appointments={previousAppointments}
            />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
