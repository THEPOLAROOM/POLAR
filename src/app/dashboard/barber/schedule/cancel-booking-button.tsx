"use client";

import { useState, useTransition } from "react";
import { cancelBookingAsBarber } from "@/lib/actions/barber-bookings";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  function handleClick() {
    const formData = new FormData();
    formData.set("booking_id", bookingId);

    setError(null);
    setPending(true);
    // See client-details-form.tsx: a Server Function invoked from an
    // event handler needs to run inside a transition for its resolved
    // result to be reliably applied.
    startTransition(async () => {
      const result = await cancelBookingAsBarber(formData);
      setPending(false);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <span>
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text disabled:opacity-50"
      >
        {pending ? "…" : "Cancel"}
      </button>
      {error && <p className="mt-1 text-xs text-polar-danger">{error}</p>}
    </span>
  );
}
