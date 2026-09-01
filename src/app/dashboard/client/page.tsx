import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";

export default async function ClientDashboardPage() {
  const { user } = await requireRole("client");

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        Client Dashboard
      </h1>
      <p className="mt-2 text-sm text-polar-muted">
        Signed in as {user.email}.
      </p>

      <ul className="mt-6 flex flex-wrap gap-2">
        <li>
          <Link
            href="/dashboard/client/book"
            className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text"
          >
            Book Appointment
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/client/bookings"
            className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text"
          >
            My Bookings
          </Link>
        </li>
      </ul>
    </main>
  );
}
