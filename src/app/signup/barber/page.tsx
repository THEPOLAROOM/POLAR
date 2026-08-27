"use client";

import { useState } from "react";
import Link from "next/link";
import { signUpBarber } from "@/lib/actions/auth";
import { Field, Checkbox, SubmitButton } from "@/components/form";
import { LEGAL_VERSIONS } from "@/lib/legal/versions";

export default function BarberSignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [workSameAsHome, setWorkSameAsHome] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await signUpBarber(formData);
    setPending(false);
    if (result && "error" in result) setError(result.error);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">
        Create a POLAR barber / stylist account
      </h1>
      <p className="mt-1 text-sm text-polar-muted">
        V1 private trial — functional screen, not final design. Creating this
        account does not grant Barber access by itself; Barber privileges are
        granted separately.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-polar-text">
            Personal Details
          </legend>
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
        </fieldset>

        <fieldset className="space-y-4 border-t border-polar-border pt-4">
          <legend className="text-sm font-medium text-polar-text">
            Professional Details
          </legend>
          <Field label="Barber / Stylist Name" name="barber_name" />
          <Field label="Business Name" name="business_name" />
          <Field
            label="Years of Experience"
            name="years_experience"
            type="number"
          />
          <Field label="Work Location" name="work_location" />
        </fieldset>

        <fieldset className="space-y-4 border-t border-polar-border pt-4">
          <legend className="text-sm font-medium text-polar-text">
            Personal / Home Address
          </legend>
          <p className="text-xs text-polar-muted">
            Always private. Never shown to clients.
          </p>
          <Field label="Address Line 1" name="home_address_line_1" required />
          <Field label="Address Line 2 (optional)" name="home_address_line_2" />
          <Field label="Town / City" name="home_town_city" required />
          <Field label="County / Region (optional)" name="home_county_region" />
          <Field label="Postcode" name="home_postcode" required />
          <Field label="Country" name="home_country" required />
        </fieldset>

        <fieldset className="space-y-4 border-t border-polar-border pt-4">
          <legend className="text-sm font-medium text-polar-text">
            Work / Commercial Address
          </legend>
          <p className="text-xs text-polar-muted">
            This is the location you provide services from. If you choose
            your Home Address here, that address may be shown to clients
            with a confirmed appointment. If you later move to a shop or
            studio, you can update this independently of your Home Address.
          </p>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="work_same_as_home"
              checked={workSameAsHome}
              onChange={(e) => setWorkSameAsHome(e.target.checked)}
              className="mt-1"
            />
            <span>Same as my Personal/Home Address</span>
          </label>

          {!workSameAsHome && (
            <div className="space-y-4">
              <Field label="Address Line 1" name="work_address_line_1" required />
              <Field label="Address Line 2 (optional)" name="work_address_line_2" />
              <Field label="Town / City" name="work_town_city" required />
              <Field label="County / Region (optional)" name="work_county_region" />
              <Field label="Postcode" name="work_postcode" required />
              <Field label="Country" name="work_country" required />
            </div>
          )}
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
