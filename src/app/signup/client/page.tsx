"use client";

import { useState } from "react";
import Link from "next/link";
import { signUpClient } from "@/lib/actions/auth";
import { Field, Checkbox, SubmitButton } from "@/components/form";
import { LEGAL_VERSIONS } from "@/lib/legal/versions";

export default function ClientSignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await signUpClient(formData);
    setPending(false);
    if (result && "error" in result) setError(result.error);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        Create a POLAR client account
      </h1>
      <p className="mt-1 text-sm text-polar-muted">
        V1 private trial — functional screen, not final design.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Full Name" name="full_name" required />
        <Field label="Phone Number" name="phone" type="tel" required />
        <Field label="Email" name="email" type="email" required />
        <Field
          label="Password"
          name="password"
          type="password"
          required
          minLength={12}
          helper="Minimum 12 characters."
        />

        <fieldset className="space-y-4 border-t border-polar-border pt-4">
          <legend className="text-sm font-medium text-polar-text">
            Address
          </legend>
          <p className="text-xs text-polar-muted">
            Your address is kept private. Only you and appropriately
            authorised POLAR roles can access it.
          </p>
          <Field label="Address Line 1" name="address_line_1" required />
          <Field label="Address Line 2 (optional)" name="address_line_2" />
          <Field label="Town / City" name="town_city" required />
          <Field label="County / Region (optional)" name="county_region" />
          <Field label="Postcode" name="postcode" required />
          <Field label="Country" name="country" required />
        </fieldset>

        <div className="space-y-3 border-t border-polar-border pt-4">
          <Checkbox name="terms_accepted" required>
            I have read and accept the{" "}
            <Link className="underline" href="/legal/terms" target="_blank">
              Terms &amp; Conditions ({LEGAL_VERSIONS.terms})
            </Link>
            .
          </Checkbox>
          <Checkbox name="privacy_accepted" required>
            I have read and accept the{" "}
            <Link className="underline" href="/legal/privacy" target="_blank">
              Privacy Policy ({LEGAL_VERSIONS.privacy})
            </Link>
            .
          </Checkbox>
          <Checkbox name="age_confirmed" required>
            I confirm that I am aged 16 or over.
          </Checkbox>
        </div>

        {error && <p className="text-sm text-polar-danger">{error}</p>}

        <SubmitButton
          pending={pending}
          label="Create account"
          pendingLabel="Creating account…"
        />
      </form>

      <p className="mt-4 text-sm text-polar-muted">
        Already have an account?{" "}
        <Link className="underline" href="/login">
          Log in
        </Link>
      </p>
    </main>
  );
}
