"use client";

import { useState, useTransition } from "react";
import { bookSlot } from "@/lib/actions/bookings";

export function BookSlotForm({
  date,
  serviceId,
  startTime,
}: {
  date: string;
  serviceId: string | null;
  startTime: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  function submit(recurrence: "one_off" | "weekly") {
    if (!serviceId) {
      setError("Choose a service first.");
      return;
    }

    const formData = new FormData();
    formData.set("recurrence", recurrence);
    formData.set("date", date);
    formData.set("service_id", serviceId);
    formData.set("start_time", startTime);

    setError(null);
    setPending(true);
    // See client-details-form.tsx: a Server Function invoked from an
    // event handler needs to run inside a transition for its resolved
    // result to be reliably applied.
    startTransition(async () => {
      const result = await bookSlot(formData);
      setPending(false);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="text-right">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !serviceId}
          onClick={() => submit("one_off")}
          className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text disabled:opacity-50"
        >
          Book once
        </button>
        <button
          type="button"
          disabled={pending || !serviceId}
          onClick={() => submit("weekly")}
          className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text disabled:opacity-50"
        >
          Book weekly
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-polar-danger">{error}</p>}
    </div>
  );
}
