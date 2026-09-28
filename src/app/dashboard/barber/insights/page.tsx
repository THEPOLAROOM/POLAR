import { PolarPlainPage } from "@/components/polar-ui/polar-plain-page";
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
    <PolarPlainPage id="insights" title="Barber Insights" subtitle="Private to you" icon={<svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 00-3.6 10.8c.6.5 1 1.2 1.1 2V17h5v-1.2c.1-.8.5-1.5 1.1-2A6 6 0 0012 3z" /></svg>} backHref="/dashboard/barber/clients" backLabel="Back to Clients">
      <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/barber/clients" className="text-sm text-polar-muted">
        ‹ Back to Clients
      </Link>
      <p className="mt-1 text-sm text-polar-muted">
        Your own private questions about clients, answered on each client&apos;s profile. Only you can see them — clients never
        do.
      </p>
      <InsightsManager fields={fields} />
      </div>
    </PolarPlainPage>
  );
}
