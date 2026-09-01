"use client";

import { useState, useTransition } from "react";
import { updateClientBalance } from "@/lib/actions/client-balance";
import { SubmitButton } from "@/components/form";

export function ClientBalanceForm({
  clientId,
  amount,
  note,
}: {
  clientId: string;
  amount: number;
  note: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setSaved(false);
    setPending(true);
    // See client-details-form.tsx: a Server Function invoked from an
    // event handler needs to run inside a transition for its resolved
    // result to be reliably applied.
    startTransition(async () => {
      const result = await updateClientBalance(formData);
      setPending(false);
      if (result && "error" in result) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-4">
      <input type="hidden" name="client_id" value={clientId} />

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-polar-text">
          Amount (£)
        </span>
        <input
          name="amount"
          type="number"
          step="0.01"
          defaultValue={amount}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
        <span className="mt-1 block text-xs text-polar-muted">
          £0.00 = settled. Positive = client owes you. Negative = client has
          credit.
        </span>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-polar-text">
          Note (optional)
        </span>
        <input
          name="note"
          type="text"
          defaultValue={note ?? ""}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
      </label>

      {error && <p className="text-sm text-polar-danger">{error}</p>}
      {saved && !error && <p className="text-sm text-polar-success">Saved</p>}

      <SubmitButton pending={pending} label="Save" pendingLabel="Saving…" />
    </form>
  );
}
