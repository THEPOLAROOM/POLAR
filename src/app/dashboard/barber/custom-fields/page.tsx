import { requireRole } from "@/lib/auth/require-role";
import {
  createCustomFieldDefinition,
  setCustomFieldActive,
} from "@/lib/actions/custom-fields";
import type { CustomFieldDefinition } from "@/lib/types";

const FIELD_TYPE_OPTIONS: { value: CustomFieldDefinition["field_type"]; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes / No" },
  { value: "single_select", label: "Single select" },
  { value: "multi_select", label: "Multi select" },
  { value: "date", label: "Date" },
];

type CustomFieldRow = Pick<CustomFieldDefinition, "id" | "label" | "field_type"> & {
  is_active: boolean;
};

// Server-side ROLE check happens FIRST, same as every other protected
// barber page. The list below is scoped to this barber's own fields
// by both the query (.eq("barber_profile_id", user.id)) and the
// existing RLS policy (custom_field_definitions: barber reads own) —
// the create/toggle actions rely on the matching create/update
// policies rather than any additional app-level check.
export default async function CustomFieldsPage() {
  const { supabase, user } = await requireRole("barber");

  const { data: fields } = await supabase
    .from("custom_field_definitions")
    .select("id, label, field_type, is_active, created_at")
    .eq("barber_profile_id", user.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  const customFields = (fields ?? []) as CustomFieldRow[];

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">Custom Fields</h1>
      <p className="mt-1 text-sm text-polar-muted">
        Active fields appear on every client&apos;s profile card.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">Add a field</h2>
        <form action={createCustomFieldDefinition} className="mt-2 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-polar-text">
              Label
            </span>
            <input
              name="label"
              type="text"
              required
              className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-polar-text">
              Field type
            </span>
            <select
              name="field_type"
              required
              defaultValue=""
              className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
            >
              <option value="" disabled>
                Choose a type
              </option>
              {FIELD_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text"
          >
            Add field
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">
          Your fields
        </h2>
        {customFields.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {customFields.map((field) => (
              <li
                key={field.id}
                className="flex items-center justify-between gap-4 rounded border border-polar-border px-3 py-2"
              >
                <div>
                  <p className="text-sm text-polar-text">{field.label}</p>
                  <p className="text-xs text-polar-muted">
                    {field.field_type} ·{" "}
                    {field.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                <form action={setCustomFieldActive}>
                  <input type="hidden" name="field_id" value={field.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={field.is_active ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text"
                  >
                    {field.is_active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-polar-muted">
            No custom fields yet.
          </p>
        )}
      </section>
    </main>
  );
}
