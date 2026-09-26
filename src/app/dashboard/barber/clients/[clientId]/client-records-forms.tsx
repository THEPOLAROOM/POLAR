"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { saveClientKeyNotes, uploadClientPhoto, removeClientPhoto } from "@/lib/actions/client-records";
import { saveClientInsights } from "@/lib/actions/barber-insights";

type Result = { error: string } | void;
const INPUT = "w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text";

function useAction() {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  function run(action: () => Promise<Result>) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const r = await action();
      if (r && "error" in r) setError(r.error);
      else setSaved(true);
    });
  }
  return { error, saved, pending, run };
}

/** Private client photo (barber-uploaded, private bucket, signed URL). */
export function ClientPhotoForm({ clientId, photoUrl }: { clientId: string; photoUrl: string | null }) {
  const { error, pending, run } = useAction();
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.set("client_id", clientId);
    fd.set("file", file);
    run(() => uploadClientPhoto(fd));
  }

  function onRemove() {
    if (!window.confirm("Remove this client's photo?")) return;
    const fd = new FormData();
    fd.set("client_id", clientId);
    run(() => removeClientPhoto(fd));
  }

  return (
    <div className="mt-2 flex items-center gap-4">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-polar-border bg-polar-bg">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Client photo" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-polar-muted">No photo</span>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <button type="button" disabled={pending} onClick={() => fileRef.current?.click()} className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text">
            {pending ? "Saving…" : photoUrl ? "Change photo" : "Upload photo"}
          </button>
          {photoUrl && (
            <button type="button" disabled={pending} onClick={onRemove} className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text">
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-polar-muted">JPEG, PNG or WebP, up to 5 MB. Private to you — never shown to clients.</p>
        {error && <p className="text-sm text-polar-danger">{error}</p>}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" />
    </div>
  );
}

/** Private Key Notes for this barber + client. */
export function KeyNotesForm({ clientId, notes }: { clientId: string; notes: string | null }) {
  const { error, saved, pending, run } = useAction();
  return (
    <form
      className="mt-2 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        run(() => saveClientKeyNotes(fd));
      }}
    >
      <input type="hidden" name="client_id" value={clientId} />
      <textarea name="key_notes" rows={4} maxLength={2000} defaultValue={notes ?? ""} placeholder="Private working notes about this client…" className={INPUT} />
      {error && <p className="text-sm text-polar-danger">{error}</p>}
      {saved && !error && <p className="text-sm text-polar-success">Saved</p>}
      <button type="submit" disabled={pending} className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text">
        {pending ? "Saving…" : "Save notes"}
      </button>
    </form>
  );
}

export type ClientInsight = { id: string; label: string; options: string[]; value: string | null };

/** This barber's private Barber Insight answers for this client. */
export function ClientInsightsForm({ clientId, insights }: { clientId: string; insights: ClientInsight[] }) {
  const { error, saved, pending, run } = useAction();
  if (insights.length === 0) {
    return (
      <p className="mt-2 text-sm text-polar-muted">
        No insights set up yet.{" "}
        <Link href="/dashboard/barber/insights" className="underline">
          Create your insight questions
        </Link>
        .
      </p>
    );
  }
  return (
    <form
      className="mt-2 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        run(() => saveClientInsights(fd));
      }}
    >
      <input type="hidden" name="client_id" value={clientId} />
      {insights.map((f) => (
        <label key={f.id} className="block text-sm">
          <span className="mb-1 block font-medium text-polar-text">{f.label}</span>
          <select name={`insight_${f.id}`} defaultValue={f.value && f.options.includes(f.value) ? f.value : ""} className={INPUT}>
            <option value="">—</option>
            {f.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      ))}
      {error && <p className="text-sm text-polar-danger">{error}</p>}
      {saved && !error && <p className="text-sm text-polar-success">Saved</p>}
      <button type="submit" disabled={pending} className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text">
        {pending ? "Saving…" : "Save insights"}
      </button>
    </form>
  );
}
