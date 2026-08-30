import { requireRole } from "@/lib/auth/require-role";

// Server-side ROLE check happens FIRST, same as every other protected
// barber page. Placeholder only — the client directory/list itself is
// built in a later stage; this route currently exists so that
// dashboard/barber/clients/[clientId] has a valid parent segment.
export default async function BarberClientsPage() {
  await requireRole("barber");

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">Clients</h1>
      <p className="mt-2 text-sm text-polar-muted">
        Client directory is built in a later stage.
      </p>
    </main>
  );
}
