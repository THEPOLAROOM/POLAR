// Deliberately minimal — Stage 3 is functional-only per the Visual
// Rule. Final premium visual design happens in the dedicated V1
// Visual Mastering Phase, after all V1 functionality is complete.

export function Field({
  label,
  name,
  type = "text",
  required,
  minLength,
  helper,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  helper?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-polar-text">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
      />
      {helper && (
        <span className="mt-1 block text-xs text-polar-muted">{helper}</span>
      )}
    </label>
  );
}

export function Checkbox({
  name,
  required,
  children,
}: {
  name: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" name={name} required={required} className="mt-1" />
      <span>{children}</span>
    </label>
  );
}

export function SubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-polar-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
