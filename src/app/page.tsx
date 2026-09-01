import Link from "next/link";

// Temporary V1 testing homepage — not a visual design pass. Replaces
// the Stage 1 internal health-check status page, which is no longer
// needed here now that login/signup/dashboards exist; the underlying
// system it checked (Supabase connectivity, RLS default-deny on
// _health_check) is unchanged, just no longer displayed on /.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-polar-text">
          THE POLAR ROOM
        </h1>
        <p className="mt-1 text-sm text-polar-muted">
          Welcome to POLAR — Your Personal Booking Assistant.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/login"
          className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text"
        >
          Log In
        </Link>
        <Link
          href="/signup/client"
          className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text"
        >
          Create Client Account
        </Link>
        <Link
          href="/signup/barber"
          className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text"
        >
          Create Barber Account
        </Link>
      </div>
    </main>
  );
}
