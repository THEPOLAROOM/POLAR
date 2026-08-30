import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import type { ClientProfileDetails, CustomFieldDefinition } from "@/lib/types";
import { ClientDetailsForm } from "./client-details-form";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Server-side ROLE check happens FIRST, same as every other protected
// barber page. Every read below (profiles, client_profile_details,
// custom_field_values) is additionally scoped by RLS to a client this
// barber is explicitly linked to via barber_client_links — a client
// that doesn't exist and a client this barber isn't linked to both
// come back as "no row", and both are treated identically as
// notFound() below. This is deliberate: the page never reveals
// whether a given clientId exists at all to an unauthorised barber.
export default async function ClientProfileCardPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  if (!UUID_RE.test(clientId)) {
    notFound();
  }

  const { supabase, user } = await requireRole("barber");

  const [
    { data: profile },
    { data: details },
    { data: definitions },
    { data: values },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("id", clientId)
      .maybeSingle(),
    supabase
      .from("client_profile_details")
      .select(
        "hair_type, hair_colour, scalp_condition, skin_sensitivity, allergies, emergency_contact, updated_at"
      )
      .eq("profile_id", clientId)
      .maybeSingle(),
    supabase
      .from("custom_field_definitions")
      .select("id, label, field_type, options, display_order")
      .eq("barber_profile_id", user.id)
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("custom_field_values")
      .select("field_id, value")
      .eq("client_profile_id", clientId),
  ]);

  if (!profile) {
    notFound();
  }

  const clientDetails = details as ClientProfileDetails | null;
  const customFields = (definitions ?? []) as CustomFieldDefinition[];
  const valueByFieldId = new Map(
    (values ?? []).map((row) => [row.field_id as string, row.value as unknown])
  );

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        {profile.full_name}
      </h1>
      <p className="mt-1 text-sm text-polar-muted">{profile.phone}</p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">
          Client Details
        </h2>
        <ClientDetailsForm clientId={clientId} details={clientDetails} />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">
          Custom Fields
        </h2>
        {customFields.length > 0 ? (
          <dl className="mt-2 space-y-1 text-sm text-polar-muted">
            {customFields.map((field) => (
              <div key={field.id} className="flex justify-between gap-4">
                <dt>{field.label}</dt>
                <dd>{formatCustomFieldValue(valueByFieldId.get(field.id))}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-polar-muted">
            No custom fields set up yet.
          </p>
        )}
      </section>
    </main>
  );
}

function formatCustomFieldValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
