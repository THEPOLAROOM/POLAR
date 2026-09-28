import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { InsightsManager, type InsightField } from "./insights-manager";

// Barber Insights setup: the barber defines their own private dropdown
// questions once; they then appear on every client's profile for an
// answer. Read-only in Workflow. Barber-only (see lib/actions/barber-insights).
export default async function BarberInsightsPage() {
  const { supabase, user } = await requireRole("barber");

  const { data } = await supabase
    .from("custom_field_definitions")
    .select("id, label, options, is_active")
    .eq("barber_profile_id", user.id)
    .eq("field_type", "single_select")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  const fields: InsightField[] = (data ?? []).map((f) => ({
    id: f.id as string,
    label: f.label as string,
    options: ((f.options as string[] | null) ?? []).filter(Boolean),
    isActive: f.is_active as boolean,
  }));

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <Link href="/dashboard/barber/clients" className="text-sm text-polar-muted">
        ‹ Back to Clients
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-polar-text">Barber Insights</h1>
      <p className="mt-1 text-sm text-polar-muted">
        Your own private questions about clients, answered on each client&apos;s profile. Only you can see them — clients never
        do.
      </p>
      <InsightsManager fields={fields} />
    </main>
  );
}
