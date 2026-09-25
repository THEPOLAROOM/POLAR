"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlinkClient } from "@/lib/actions/barber-client-links";

// Delete Client — removes this client from the barber's own list via
// unlinkClient (the unlink_client() function). Only the link is removed:
// the client's own POLAR account, bookings and details are untouched,
// and they can be added back later with Add Client. Always asks first.
export function RemoveClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function remove() {
    const fd = new FormData();
    fd.set("client_id", clientId);
    startTransition(async () => {
      await unlinkClient(fd);
      router.push("/dashboard/barber/clients");
    });
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="rounded border border-polar-danger/60 px-4 py-2 text-sm text-polar-danger">
        Delete client
      </button>
    );
  }

  return (
    <div role="alertdialog" aria-labelledby="remove-client-q" className="rounded border border-polar-danger/60 p-4">
      <p id="remove-client-q" className="text-sm font-semibold text-polar-text">
        Delete {clientName} from your clients?
      </p>
      <p className="mt-1 text-xs text-polar-muted">
        This removes them from your client list. Their own POLAR account and booking history are not deleted, and you can add them back later.
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text">
          Cancel
        </button>
        <button type="button" onClick={remove} disabled={pending} className="rounded bg-polar-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
