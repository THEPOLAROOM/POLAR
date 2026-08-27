"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";
import { Field, SubmitButton } from "@/components/form";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await login(formData);
    setPending(false);
    if (result && "error" in result) setError(result.error);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">Log in to POLAR</h1>
      <p className="mt-1 text-sm text-polar-muted">
        V1 private trial — functional screen, not final design.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Email" name="email" type="email" required />
        <Field label="Password" name="password" type="password" required />

        {error && <p className="text-sm text-polar-danger">{error}</p>}

        <SubmitButton pending={pending} label="Log in" pendingLabel="Logging in…" />
      </form>

      <p className="mt-4 text-sm text-polar-muted">
        New client?{" "}
        <Link className="underline" href="/signup/client">
          Create an account
        </Link>
      </p>
      <p className="mt-1 text-sm text-polar-muted">
        Barber applying for V1?{" "}
        <Link className="underline" href="/signup/barber">
          Barber sign-up
        </Link>
      </p>
    </main>
  );
}
