"use client";

import { useState, useTransition } from "react";
import { updateClientProfileDetails } from "@/lib/actions/client-profile";
import { SubmitButton } from "@/components/form";
import type { ClientProfileDetails } from "@/lib/types";

const HAIR_TYPE_OPTIONS = [
  { value: "straight", label: "Straight" },
  { value: "wavy", label: "Wavy" },
  { value: "curly", label: "Curly" },
  { value: "coily", label: "Coily" },
];

const HAIR_DENSITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

const FIELDS: {
  name: keyof ClientProfileDetails;
  label: string;
  options?: { value: string; label: string }[];
}[] = [
  { name: "hair_type", label: "Hair type", options: HAIR_TYPE_OPTIONS },
  { name: "hair_density", label: "Hair density", options: HAIR_DENSITY_OPTIONS },
  { name: "hair_colour", label: "Hair colour" },
  { name: "scalp_condition", label: "Scalp condition" },
  { name: "skin_sensitivity", label: "Skin sensitivity" },
  { name: "allergies", label: "Allergies" },
  { name: "emergency_contact", label: "Emergency contact" },
];

export function ClientDetailsForm({
  clientId,
  details,
}: {
  clientId: string;
  details: ClientProfileDetails | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setSaved(false);
    setPending(true);
    // Server Functions invoked from an event handler (rather than a
    // form's action prop) need to run inside a transition — otherwise
    // the state update that depends on the resolved result isn't
    // reliably applied. See React's Server Functions docs.
    startTransition(async () => {
      const result = await updateClientProfileDetails(formData);
      setPending(false);
      if (result && "error" in result) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-4">
      <input type="hidden" name="client_id" value={clientId} />

      {FIELDS.map(({ name, label, options }) => (
        <label key={name} className="block text-sm">
          <span className="mb-1 block font-medium text-polar-text">
            {label}
          </span>
          {options ? (
            <select
              name={name}
              defaultValue={details?.[name] ?? ""}
              className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
            >
              {/* Placeholder is intentionally first: an existing value
                  that doesn't match one of these options (unset, or a
                  legacy free-text value) safely falls back to this
                  rather than silently landing on — and then saving
                  over the data with — the first real option. */}
              <option value="">—</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={name}
              type="text"
              defaultValue={details?.[name] ?? ""}
              className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
            />
          )}
        </label>
      ))}

      {error && <p className="text-sm text-polar-danger">{error}</p>}
      {saved && !error && <p className="text-sm text-polar-success">Saved</p>}

      <SubmitButton pending={pending} label="Save" pendingLabel="Saving…" />
    </form>
  );
}
