"use client";

import { useState } from "react";
import Link from "next/link";
import { resendVerification } from "@/lib/actions/auth";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleResend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    await resendVerification(formData);
    setPending(false);
    setStatus(
      "If that address has a pending POLAR account, a new verification email has been sent."
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="text-xl font-semibold text-polar-text">Check your email</h1>
      <p className="mt-2 text-sm text-polar-muted">
        We&apos;ve sent a verification link to the email address you signed up
        with. Click the link to confirm your account, then log in.
      </p>

      <form onSubmit={handleResend} className="mt-6 space-y-3 text-left">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-polar-text">
            Didn&apos;t get it? Enter your email to resend:
          </span>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded border border-polar-border px-4 py-2 text-sm text-polar-text disabled:opacity-50"
        >
          {pending ? "Sending…" : "Resend verification email"}
        </button>
      </form>

      {status && <p className="mt-3 text-xs text-polar-muted">{status}</p>}

      <p className="mt-6 text-sm text-polar-muted">
        Already verified?{" "}
        <Link className="underline" href="/login">
          Log in
        </Link>
      </p>
    </main>
  );
}
