"use client";

import { useState } from "react";

export type PreviousAppointment = {
  id: string;
  dateLabel: string;
  timeLabel: string;
  serviceName: string;
  statusLabel: string;
};

// Toggle button is an invisible overlay over the baked "Previous
// Appointments" bar in the mastered UI asset — see PREV_BAR_BOX in
// page.tsx. The expanded list itself is real HTML, not part of the
// asset (no expanded state was supplied in the mastered design), kept
// visually consistent with the rest of the card (dark glass, royal
// border). Collapsed by default; nothing is fetched or rendered until
// expanded — the full list is passed down already loaded (it's the
// same bookings query the page already ran), just not shown until
// the client asks for it.
export function PreviousAppointmentsToggle({
  box,
  listBox,
  appointments,
}: {
  box: React.CSSProperties;
  listBox: React.CSSProperties;
  appointments: PreviousAppointment[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Hide previous appointments" : "Show previous appointments"}
        onClick={() => setOpen((v) => !v)}
        className="absolute rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light"
        style={box}
      />

      {open && (
        <div
          className="absolute z-10 overflow-y-auto rounded-2xl border border-royal-light/40 bg-navy/95 p-4 text-white shadow-ice-lg backdrop-blur-md"
          style={listBox}
        >
          {appointments.length === 0 ? (
            <p className="text-sm text-white/60">No previous appointments yet.</p>
          ) : (
            <ul className="space-y-2">
              {appointments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="text-white">{a.dateLabel} · {a.timeLabel}</p>
                    <p className="text-white/60">{a.serviceName}</p>
                  </div>
                  <span
                    className={
                      a.statusLabel === "Confirmed"
                        ? "shrink-0 rounded-full bg-green-600/20 px-2 py-1 text-xs font-medium text-green-400"
                        : "shrink-0 rounded-full bg-white/10 px-2 py-1 text-xs font-medium text-white/50"
                    }
                  >
                    {a.statusLabel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
