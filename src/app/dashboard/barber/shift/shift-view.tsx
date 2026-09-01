"use client";

import { useEffect, useState } from "react";
import type { ScheduledBooking } from "@/lib/queries/barber-schedule";
import { formatTime12h } from "@/lib/dates";

const DELAY_OPTIONS_MINUTES = [5, 10, 15, 30];

type Phase = "in_progress" | "prompt" | "delay";

/**
 * The already-approved active-shift workflow, kept deliberately
 * on-screen-only and ephemeral: nothing here is persisted anywhere
 * (no table, no RPC) — it's just a state machine over the barber's
 * own bookings for today, which are already fully visible to them via
 * existing RLS. Refreshing the page resets it back to the first
 * appointment; that's an accepted limitation of "simple/on-screen
 * only", not an oversight.
 */
export function ShiftView({ bookings }: { bookings: ScheduledBooking[] }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("in_progress");
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (phase !== "delay" || remainingSeconds <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setRemainingSeconds((seconds) => seconds - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, remainingSeconds]);

  useEffect(() => {
    if (phase === "delay" && remainingSeconds <= 0) {
      setPhase("prompt");
    }
  }, [phase, remainingSeconds]);

  if (bookings.length === 0) {
    return (
      <p className="mt-6 text-sm text-polar-muted">
        No appointments today.
      </p>
    );
  }

  if (index >= bookings.length) {
    return (
      <p className="mt-6 text-sm text-polar-muted">
        No more appointments today.
      </p>
    );
  }

  const current = bookings[index];
  const next = bookings[index + 1];

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded border border-polar-border px-3 py-2">
        <p className="text-sm text-polar-text">
          {formatTime12h(current.startTime)}–{formatTime12h(current.endTime)}{" "}
          —{" "}
          {current.clientName}
        </p>
        <p className="text-xs text-polar-muted">
          {current.recurrence === "weekly" ? "Weekly" : "One-off"}
        </p>
      </div>

      {phase === "in_progress" && (
        <button
          type="button"
          onClick={() => setPhase("prompt")}
          className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text"
        >
          Finish appointment
        </button>
      )}

      {phase === "prompt" && (
        <div>
          <p className="text-sm text-polar-text">
            Shall we proceed to next client?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIndex((i) => i + 1);
                setPhase("in_progress");
              }}
              className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text"
            >
              Yes{next ? ` — ${next.clientName}` : ""}
            </button>
            <button
              type="button"
              onClick={() => setPhase("delay")}
              className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text"
            >
              No
            </button>
          </div>
        </div>
      )}

      {phase === "delay" && (
        <div>
          {remainingSeconds > 0 ? (
            <p className="text-sm text-polar-muted">
              Resuming in {Math.floor(remainingSeconds / 60)}:
              {String(remainingSeconds % 60).padStart(2, "0")}
            </p>
          ) : (
            <>
              <p className="text-sm text-polar-text">Delay by:</p>
              <div className="mt-2 flex gap-2">
                {DELAY_OPTIONS_MINUTES.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setRemainingSeconds(minutes * 60)}
                    className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text"
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
