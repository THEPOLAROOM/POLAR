import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import type { ClientProfileDetails, CustomFieldDefinition } from "@/lib/types";
import { ClientDetailsForm } from "./client-details-form";
import { ClientBalanceForm } from "./client-balance-form";
import { updateClientCustomFieldValues } from "@/lib/actions/custom-field-values";

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
    { data: balance },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("id", clientId)
      .maybeSingle(),
    supabase
      .from("client_profile_details")
      .select(
        "hair_type, hair_density, hair_colour, scalp_condition, skin_sensitivity, allergies, emergency_contact, updated_at"
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
    // client_balances: awaiting migration approval (see 0010) — this
    // resolves with { data: null, error } rather than throwing if the
    // table doesn't exist yet live, so the section below just renders
    // its zero-balance default until the migration is applied.
    supabase
      .from("client_balances")
      .select("amount, note")
      .eq("profile_id", clientId)
      .maybeSingle(),
  ]);

  if (!profile) {
    notFound();
  }

  const clientDetails = details as ClientProfileDetails | null;
  const customFields = (definitions ?? []) as CustomFieldDefinition[];
  const valueByFieldId = new Map(
    (values ?? []).map((row) => [row.field_id as string, row.value as unknown])
  );
  const clientBalance = balance as { amount: number; note: string | null } | null;

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        {profile.full_name}
      </h1>
      <p className="mt-1 text-sm text-polar-muted">{profile.phone}</p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">Balance</h2>
        <ClientBalanceForm
          clientId={clientId}
          amount={clientBalance?.amount ?? 0}
          note={clientBalance?.note ?? null}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">
          Client Details
        </h2>
        <ClientDetailsForm clientId={clientId} details={clientDetails} />
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-polar-text">
            Custom Fields
          </h2>
          <Link
            href="/dashboard/barber/custom-fields"
            aria-label="Manage custom fields"
            title="Manage custom fields"
            className="text-xs text-polar-muted"
          >
            ✏️
          </Link>
        </div>
        {customFields.length > 0 ? (
          <form
            action={updateClientCustomFieldValues}
            className="mt-2 space-y-4"
          >
            <input type="hidden" name="client_id" value={clientId} />
            {customFields.map((field) => {
              const value = valueByFieldId.get(field.id);
              const inputName = `field_${field.id}`;
              return (
                <label key={field.id} className="block text-sm">
                  <span className="mb-1 block font-medium text-polar-text">
                    {field.label}
                  </span>
                  {field.field_type === "boolean" ? (
                    <select
                      name={inputName}
                      defaultValue={
                        value === true ? "true" : value === false ? "false" : ""
                      }
                      className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
                    >
                      <option value="">—</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : field.field_type === "single_select" ? (
                    <select
                      name={inputName}
                      defaultValue={typeof value === "string" ? value : ""}
                      className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
                    >
                      <option value="">—</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.field_type === "multi_select" ? (
                    <select
                      name={inputName}
                      multiple
                      defaultValue={Array.isArray(value) ? (value as string[]) : []}
                      className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
                    >
                      {(field.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.field_type === "number" ? (
                    <input
                      name={inputName}
                      type="number"
                      defaultValue={typeof value === "number" ? value : ""}
                      className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
                    />
                  ) : field.field_type === "date" ? (
                    <input
                      name={inputName}
                      type="date"
                      defaultValue={typeof value === "string" ? value : ""}
                      className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
                    />
                  ) : (
                    <input
                      name={inputName}
                      type="text"
                      defaultValue={typeof value === "string" ? value : ""}
                      className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
                    />
                  )}
                </label>
              );
            })}
            <button
              type="submit"
              className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text"
            >
              Save
            </button>
          </form>
        ) : (
          <p className="mt-2 text-sm text-polar-muted">
            No custom fields set up yet.
          </p>
        )}
      </section>
    </main>
  );
}

