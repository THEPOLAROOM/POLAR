import { requireAuth } from "@/lib/auth/require-role";
import { logout } from "@/lib/actions/auth";

// Server-side auth check happens FIRST, before anything else runs.
// An unauthenticated request never reaches the content below.
export default async function ClientDashboardPage() {
  const { user } = await requireAuth();

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        Client Dashboard — Stage 3
      </h1>
      <p className="mt-2 text-sm text-polar-muted">Signed in as {user.email}.</p>
      <p className="mt-4 text-xs text-polar-muted">
        Functional placeholder only. Client Profile Card, booking and other
        client features are built in later stages.
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
