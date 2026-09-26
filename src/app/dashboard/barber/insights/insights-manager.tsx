"use client";

import { useState, useTransition } from "react";
import { createInsightField, updateInsightField, setInsightFieldActive } from "@/lib/actions/barber-insights";

export type InsightField = { id: string; label: string; options: string[]; isActive: boolean };

const INPUT = "w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text";

/** Question + dropdown answers editor, used for both create and edit. */
function FieldForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: InsightField;
  submitLabel: string;
  onSubmit: (fd: FormData) => Promise<{ error: string } | void>;
  onCancel?: () => void;
}) {
  const [options, setOptions] = useState<string[]>(initial?.options.length ? initial.options : ["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await onSubmit(fd);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {initial && <input type="hidden" name="field_id" value={initial.id} />}
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-polar-text">Question</span>
        <input name="label" required defaultValue={initial?.label ?? ""} placeholder="e.g. Hair difficulty" className={INPUT} />
      </label>
      <div className="text-sm">
        <span className="mb-1 block font-medium text-polar-text">Dropdown answers</span>
        <div className="space-y-2">
          {options.map((value, i) => (
            <div key={i} className="flex gap-2">
              <input
                name="options"
                value={value}
                onChange={(e) => setOptions((o) => o.map((v, j) => (j === i ? e.target.value : v)))}
                placeholder={`Answer ${i + 1}`}
                className={INPUT}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  aria-label={`Remove answer ${i + 1}`}
                  onClick={() => setOptions((o) => o.filter((_, j) => j !== i))}
                  className="rounded border border-polar-border px-3 text-polar-muted"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 12 && (
          <button type="button" onClick={() => setOptions((o) => [...o, ""])} className="mt-2 text-sm text-polar-text underline">
            + Add answer
          </button>
        )}
      </div>
      {error && <p className="text-sm text-polar-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded bg-polar-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function InsightsManager({ fields }: { fields: InsightField[] }) {
  const [creating, setCreating] = useState(fields.length === 0);
  const [justCreated, setJustCreated] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleActive(field: InsightField) {
    const fd = new FormData();
    fd.set("field_id", field.id);
    fd.set("is_active", String(!field.isActive));
    startTransition(async () => {
      await setInsightFieldActive(fd);
    });
  }

  return (
    <div className="mt-8 space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-polar-text">Your insights</h2>
        {fields.length === 0 ? (
          <p className="mt-2 text-sm text-polar-muted">No insights yet.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {fields.map((f) => (
              <li key={f.id} className={`rounded border border-polar-border p-3 ${f.isActive ? "" : "opacity-60"}`}>
                {editingId === f.id ? (
                  <FieldForm
                    initial={f}
                    submitLabel="Save changes"
                    onCancel={() => setEditingId(null)}
                    onSubmit={async (fd) => {
                      const r = await updateInsightField(fd);
                      if (!r) setEditingId(null);
                      return r;
                    }}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-polar-text">
                        {f.label}
                        {!f.isActive && <span className="ml-2 text-xs font-normal text-polar-muted">(off)</span>}
                      </p>
                      <p className="mt-1 text-sm text-polar-muted">{f.options.join(" / ")}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => setEditingId(f.id)} className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text">
                        Edit
                      </button>
                      <button type="button" disabled={pending} onClick={() => toggleActive(f)} className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text">
                        {f.isActive ? "Turn off" : "Turn on"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-polar-muted">Turning an insight off hides it from client profiles and Workflow; saved answers are kept.</p>
      </section>

      <section>
        {creating ? (
          <>
            <h2 className="text-sm font-semibold text-polar-text">Create an insight</h2>
            <div className="mt-2">
              <FieldForm
                key={fields.length}
                submitLabel="Create insight"
                onCancel={fields.length > 0 ? () => setCreating(false) : undefined}
                onSubmit={async (fd) => {
                  const r = await createInsightField(fd);
                  if (!r) {
                    setCreating(false);
                    setJustCreated(true);
                  }
                  return r;
                }}
              />
            </div>
          </>
        ) : (
          <div>
            {justCreated && <p className="mb-2 text-sm text-polar-success">Insight created.</p>}
            <button
              type="button"
              onClick={() => {
                setJustCreated(false);
                setCreating(true);
              }}
              className="rounded border border-polar-border px-4 py-2 text-sm font-semibold text-polar-text"
            >
              {fields.length === 0 ? "+ Create a field" : "+ Create another field"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
