import { requireRole } from "@/lib/auth/require-role";
import { ClientDirectory } from "./client-directory";

// Server-side ROLE check happens FIRST, same as every other protected
// barber page. Same data source as before this redesign (unchanged):
// this barber's linked clients via barber_client_links -> profiles,
// scoped by both the query and the existing RLS policies. Sorting
// alphabetically here (not in the client component) means the server
// always hands down an already-ordered, real list.
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

  return <ClientDirectory clients={clients ?? []} />;
}
