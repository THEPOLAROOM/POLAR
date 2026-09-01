"use client";

import { useState, useTransition } from "react";
import { createWalkIn } from "@/lib/actions/walk-ins";

type Service = { id: string; name: string; duration_minutes: number };

export function WalkInForm({
  date,
  services,
}: {
  date: string;
  services: Service[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setPending(true);
    // See client-details-form.tsx: a Server Function invoked from an
    // event handler needs to run inside a transition for its resolved
    // result to be reliably applied.
    startTransition(async () => {
      const result = await createWalkIn(formData);
      setPending(false);
      if (result && "error" in result) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text"
      >
        + Walk-In
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded border border-polar-border p-3"
    >
      <input type="hidden" name="date" value={date} />

      {services.length === 0 ? (
        <p className="text-sm text-polar-muted">
          Add a service in My Services first.
        </p>
      ) : (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-polar-text">
            Service
          </span>
          <select
            name="service_id"
            required
            defaultValue=""
            className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
          >
            <option value="" disabled>
              Choose a service
            </option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.duration_minutes} min)
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-polar-text">
          Start time
        </span>
        <input
          name="start_time"
          type="time"
          required
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-polar-text">
          Name (optional)
        </span>
        <input
          name="label"
          type="text"
          placeholder="e.g. Walk-in"
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
      </label>

      {error && <p className="text-sm text-polar-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || services.length === 0}
          className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
