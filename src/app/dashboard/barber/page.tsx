import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { getBarberBookingsForDate } from "@/lib/queries/barber-schedule";
import { getShopToday, formatTime12h } from "@/lib/dates";

const QUICK_LINKS = [
  { href: "/dashboard/barber/schedule", label: "Schedule" },
  { href: "/dashboard/barber/availability", label: "Availability" },
  { href: "/dashboard/barber/clients", label: "Clients" },
  { href: "/dashboard/barber/shift", label: "Active Shift" },
  { href: "/dashboard/barber/custom-fields", label: "Custom Fields" },
];

// Server-side ROLE check happens FIRST — this is the actual
// authorization enforcement point, same as every other protected
// barber page; the nav bar around this page is navigation only.
export default async function BarberDashboardPage() {
  const { supabase, user } = await requireRole("barber");

  const today = getShopToday();
  const todaysBookings = await getBarberBookingsForDate(
    supabase,
    user.id,
    today
  );

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        Barber Dashboard
      </h1>
      <p className="mt-2 text-sm text-polar-muted">
        Signed in as {user.email}.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">
          Today&apos;s Schedule
        </h2>
        {todaysBookings.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {todaysBookings.map((booking) => (
              <li
                key={booking.id}
                className="rounded border border-polar-border px-3 py-2"
              >
                <Link
                  href={`/dashboard/barber/clients/${booking.clientProfileId}`}
                  className="flex items-center justify-between text-sm text-polar-text"
                >
                  <span>
                    {formatTime12h(booking.startTime)}–
                    {formatTime12h(booking.endTime)} — {booking.clientName}
                  </span>
                  <span className="text-xs text-polar-muted">
                    {booking.recurrence === "weekly" ? "Weekly" : "One-off"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-polar-muted">
            No appointments today.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">
          Quick links
        </h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
