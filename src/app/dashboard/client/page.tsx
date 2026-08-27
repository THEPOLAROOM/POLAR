import { requireRole } from "@/lib/auth/require-role";
import { logout } from "@/lib/actions/auth";

export default async function ClientDashboardPage() {
  const { user } = await requireRole("client");

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold">
        Client Dashboard — Stage 3
      </h1>

      <p className="mt-2 text-sm">
        Signed in as {user.email}.
      </p>

      <p className="mt-4 text-sm">
        Client role confirmed server-side.
      </p>

      <form action={logout} className="mt-6">
        <button type="submit">
          Log out
        </button>
      </form>
    </main>
  );
}