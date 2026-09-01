"use client";

import { useState, useTransition } from "react";
import { setAvailabilityActive } from "@/lib/actions/barber-availability";

export function ToggleSlotButton({
  slotId,
  isActive,
}: {
  slotId: string;
  isActive: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setPending(true);
    // See add-slot-form.tsx / client-details-form.tsx: a Server
    // Function invoked from an event handler needs to run inside a
    // transition for its resolved result to be reliably applied.
    startTransition(async () => {
      const result = await setAvailabilityActive(formData);
      setPending(false);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="text-right">
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="slot_id" value={slotId} />
        <input
          type="hidden"
          name="is_active"
          value={isActive ? "false" : "true"}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text disabled:opacity-50"
        >
          {pending ? "…" : isActive ? "Make Unavailable" : "Make Available"}
        </button>
      </form>
      {error && <p className="mt-1 text-xs text-polar-danger">{error}</p>}
    </div>
  );
}
