import { requireRole } from "@/lib/auth/require-role";
import { logout } from "@/lib/actions/auth";

// Server-side ROLE check happens FIRST — this is the actual
// authorization enforcement point. A Client account (or anyone
// unauthenticated) navigating directly to this URL is redirected to
// /login before any barber-specific content is computed or sent to
// the browser. UI hiding is never relied on for this.
export default async function BarberDashboardPage() {
  const { user } = await requireRole("barber");

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        Barber Dashboard — Stage 3
      </h1>
      <p className="mt-2 text-sm text-polar-muted">
        Signed in as {user.email}. Barber role confirmed server-side.
      </p>
      <p className="mt-4 text-xs text-polar-muted">
        Functional placeholder only. Calendar, client directory, Workflow
        Mode and other barber features are built in later stages.
      </p>

      <form action={logout} className="mt-6">
        <button
          type="submit"
          className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text"
        >
          Log out
        </button>
      </form>
    </main>
  );
}
