import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { getBarberBookingsForDate } from "@/lib/queries/barber-schedule";
import { getShopToday, formatTime12h } from "@/lib/dates";
import { logout } from "@/lib/actions/auth";
import { BarberDashboardScene, DESTINATIONS } from "./dashboard-scene";

// Desktop scene (artwork + five destination click targets) lives in
// dashboard-scene.tsx; this page does the role check and data first.

// Server-side ROLE check happens FIRST, same as every other protected
// barber page.
export default async function BarberDashboardPage() {
  const { supabase, user } = await requireRole("barber");

  const today = getShopToday();
  const todaysBookings = await getBarberBookingsForDate(
    supabase,
    user.id,
    today
  );

  return (
    <div id="barber-dashboard-page">
      {/* This page's nav lives in the shared barber layout
          (src/app/dashboard/barber/layout.tsx), which every other
          barber route still needs untouched — so rather than editing
          that shared file (or its routes) to remove it there too,
          this plain (non-styled-jsx, since this is a Server
          Component) global style rule reaches out to hide just that
          one sibling `nav` only when this exact page is the one
          rendering, via the stable `#barber-dashboard-page` id
          above. */}
      <style>{`
        div:has(> #barber-dashboard-page) > nav {
          display: none;
        }
      `}</style>

      {/* Mobile — simple functional placeholder; the scene below is
          desktop/landscape-only for this pass. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">Home</h1>
        <p className="mt-2 text-sm text-polar-muted">Signed in as {user.email}.</p>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-polar-text">Today&apos;s Schedule</h2>
          {todaysBookings.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {todaysBookings.map((booking) => (
                <li key={booking.id} className="rounded border border-polar-border px-3 py-2">
                  <Link
                    href={`/dashboard/barber/clients/${booking.clientProfileId}`}
                    className="flex items-center justify-between text-sm text-polar-text"
                  >
                    <span>
                      {formatTime12h(booking.startTime)}–{formatTime12h(booking.endTime)} — {booking.clientName}
                    </span>
                    <span className="text-xs text-polar-muted">
                      {booking.recurrence === "weekly" ? "Weekly" : "One-off"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-polar-muted">No appointments today.</p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-polar-text">Quick links</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {DESTINATIONS.map((d) => (
              <li key={d.href}>
                <Link
                  href={d.href}
                  className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text"
                >
                  {d.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* Desktop / landscape — the dashboard scene, fixed to 100dvh so
          the route never scrolls. The shared barber nav is hidden for
          this page only via the `:has()` rule above. */}
      <BarberDashboardScene />

      {/* Minimal, unstyled-for-now Log Out control — this page hides
          the shared barber nav (see the style block above), so it
          otherwise has no logout affordance at all. Reuses the same
          logout() action every other "Log out" control in the app
          already uses. Final placement/styling belongs to a later
          visual pass. */}
      <form action={logout} className="fixed right-4 top-4 z-50">
        <button type="submit" className="text-sm text-white/70 underline hover:text-white">
          Log out
        </button>
      </form>
    </div>
  );
}
