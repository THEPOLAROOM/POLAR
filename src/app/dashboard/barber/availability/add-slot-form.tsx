"use client";

import { useState, useTransition } from "react";
import { createAvailabilitySlot } from "@/lib/actions/barber-availability";

const DAY_OPTIONS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

export function AddSlotForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setPending(true);
    // See client-details-form.tsx: a Server Function invoked from an
    // event handler (not a form's action prop) needs to run inside a
    // transition for its resolved result to be reliably applied.
    startTransition(async () => {
      const result = await createAvailabilitySlot(formData);
      setPending(false);
      if (result && "error" in result) {
        setError(result.error);
      } else {
        form.reset();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-polar-text">Day</span>
        <select
          name="day_of_week"
          required
          defaultValue=""
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        >
          <option value="" disabled>
            Choose a day
          </option>
          {DAY_OPTIONS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </label>

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
          End time
        </span>
        <input
          name="end_time"
          type="time"
          required
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
      </label>

      {error && <p className="text-sm text-polar-danger">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add slot"}
      </button>
    </form>
  );
}
