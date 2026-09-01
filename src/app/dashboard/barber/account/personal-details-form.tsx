"use client";

import { useState, useTransition } from "react";
import { updateBarberProfile } from "@/lib/actions/barber-account";
import { SubmitButton } from "@/components/form";

export function PersonalDetailsForm({
  fullName,
  phone,
}: {
  fullName: string;
  phone: string;
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
      const result = await updateBarberProfile(formData);
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
          Full name
        </span>
        <input
          name="full_name"
          type="text"
          required
          defaultValue={fullName}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-polar-text">Phone</span>
        <input
          name="phone"
          type="text"
          required
          defaultValue={phone}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
      </label>

      {error && <p className="text-sm text-polar-danger">{error}</p>}
      {saved && !error && <p className="text-sm text-polar-success">Saved</p>}

      <SubmitButton pending={pending} label="Save" pendingLabel="Saving…" />
    </form>
  );
}
