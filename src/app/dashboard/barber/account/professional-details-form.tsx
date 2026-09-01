"use client";

import { useState, useTransition } from "react";
import { updateBarberProfessionalDetails } from "@/lib/actions/barber-account";
import { SubmitButton } from "@/components/form";

export function ProfessionalDetailsForm({
  barberName,
  businessName,
  yearsExperience,
  workLocation,
}: {
  barberName: string | null;
  businessName: string | null;
  yearsExperience: number | null;
  workLocation: string | null;
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
    startTransition(async () => {
      const result = await updateBarberProfessionalDetails(formData);
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
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-polar-text">
          Barber/stylist name
        </span>
        <input
          name="barber_name"
          type="text"
          defaultValue={barberName ?? ""}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-polar-text">
          Business name
        </span>
        <input
          name="business_name"
          type="text"
          defaultValue={businessName ?? ""}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-polar-text">
          Years of experience
        </span>
        <input
          name="years_experience"
          type="number"
          min="0"
          step="1"
          defaultValue={yearsExperience ?? ""}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-polar-text">
          Work location
        </span>
        <input
          name="work_location"
          type="text"
          defaultValue={workLocation ?? ""}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
      </label>

      {error && <p className="text-sm text-polar-danger">{error}</p>}
      {saved && !error && <p className="text-sm text-polar-success">Saved</p>}

      <SubmitButton pending={pending} label="Save" pendingLabel="Saving…" />
    </form>
  );
}
