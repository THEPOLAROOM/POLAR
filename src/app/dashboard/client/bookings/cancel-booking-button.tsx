"use client";

import { useState, useTransition } from "react";
import { cancelBooking } from "@/lib/actions/bookings";

// Positioned as an invisible overlay directly over the baked "Cancel
// Appointment" button in the mastered My Appointments UI asset — see
// CANCEL_BOX in page.tsx. Requires an explicit confirm step (a small
// centered dialog) before the actual cancelBooking() call, per the
// "do not instantly cancel on first click" requirement; the dialog
// itself is real HTML (not part of the asset) since no confirm state
// was supplied in the mastered design.
export function CancelBookingButton({
  bookingId,
  box,
}: {
  bookingId: string;
  box: React.CSSProperties;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  function handleConfirm() {
    const formData = new FormData();
    formData.set("booking_id", bookingId);

    setError(null);
    setPending(true);
    // See client-details-form.tsx: a Server Function invoked from an
    // event handler needs to run inside a transition for its resolved
    // result to be reliably applied.
    startTransition(async () => {
      const result = await cancelBooking(formData);
      setPending(false);
      if (result && "error" in result) {
        setError(result.error);
      } else {
        setConfirming(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Cancel appointment"
        onClick={() => setConfirming(true)}
        className="absolute rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta"
        style={box}
      />

      {confirming && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-6 w-full max-w-sm rounded-2xl border border-magenta/50 bg-navy p-6 text-center text-white shadow-ice-lg">
            <p className="font-display text-lg tracking-wide">Cancel this appointment?</p>
            <p className="mt-2 text-sm text-white/70">
              This can&rsquo;t be undone. You&rsquo;ll need to book a new appointment if you change your mind.
            </p>
            {error && <p className="mt-2 text-xs text-magenta">{error}</p>}
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 disabled:opacity-50"
              >
                Never mind
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="rounded-lg border border-magenta bg-magenta/10 px-4 py-2 text-sm font-semibold text-magenta transition hover:bg-magenta/20 disabled:opacity-50"
              >
                {pending ? "Cancelling…" : "Yes, cancel it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
