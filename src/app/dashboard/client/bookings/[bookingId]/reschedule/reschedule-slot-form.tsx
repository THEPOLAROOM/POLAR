"use client";

import { useState, useTransition } from "react";
import { rescheduleBooking } from "@/lib/actions/bookings";

export function RescheduleSlotForm({
  bookingId,
  date,
  startTime,
  endTime,
}: {
  bookingId: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  function handleClick() {
    const formData = new FormData();
    formData.set("booking_id", bookingId);
    formData.set("date", date);
    formData.set("start_time", startTime);
    formData.set("end_time", endTime);

    setError(null);
    setPending(true);
    // See client-details-form.tsx: a Server Function invoked from an
    // event handler needs to run inside a transition for its resolved
    // result to be reliably applied. On success this action redirects
    // back to the bookings list, so there is no success state here.
    startTransition(async () => {
      const result = await rescheduleBooking(formData);
      setPending(false);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text disabled:opacity-50"
      >
        {pending ? "…" : "Reschedule here"}
      </button>
      {error && <p className="mt-1 text-xs text-polar-danger">{error}</p>}
    </div>
  );
}
