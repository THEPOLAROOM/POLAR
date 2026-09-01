import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";

// Server-side ROLE check happens FIRST, same as every other protected
// barber page. The list is scoped to this barber's own clients by
// both the query (.eq("barber_profile_id", user.id)) and the existing
// RLS policy (barber_client_links: barber reads own links); profiles
// are readable via the existing "profiles: linked barber reads"
// policy for exactly these linked clients.
export default async function BarberClientsPage() {
  const { supabase, user } = await requireRole("barber");

  const { data: links } = await supabase
    .from("barber_client_links")
    .select("client_profile_id")
    .eq("barber_profile_id", user.id);

  const clientIds = (links ?? []).map(
    (link) => link.client_profile_id as string
  );

  const { data: clients } =
    clientIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", clientIds)
          .order("full_name", { ascending: true })
      : { data: [] as { id: string; full_name: string }[] };

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">Clients</h1>

      {clients && clients.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {clients.map((client) => (
            <li key={client.id}>
              <Link
                href={`/dashboard/barber/clients/${client.id}`}
                className="block rounded border border-polar-border px-3 py-2 text-sm text-polar-text"
              >
                {client.full_name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-polar-muted">No clients yet.</p>
      )}
    </main>
  );
}
