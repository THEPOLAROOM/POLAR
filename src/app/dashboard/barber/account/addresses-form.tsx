"use client";

import { useState, useTransition } from "react";
import { updateBarberAddresses } from "@/lib/actions/barber-account";
import { SubmitButton } from "@/components/form";

type Addresses = {
  home_address_line_1: string;
  home_address_line_2: string | null;
  home_town_city: string;
  home_county_region: string | null;
  home_postcode: string;
  home_country: string;
  work_same_as_home: boolean;
  work_address_line_1: string | null;
  work_address_line_2: string | null;
  work_town_city: string | null;
  work_county_region: string | null;
  work_postcode: string | null;
  work_country: string | null;
};

export function AddressesForm({ addresses }: { addresses: Addresses | null }) {
  const [workSameAsHome, setWorkSameAsHome] = useState(
    addresses?.work_same_as_home ?? false
  );
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
    startTransition(async () => {
      const result = await updateBarberAddresses(formData);
      setPending(false);
      if (result && "error" in result) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-polar-text">
          Personal/home address (always private, never shown to clients)
        </legend>
        <input
          name="home_address_line_1"
          type="text"
          required
          placeholder="Address line 1"
          defaultValue={addresses?.home_address_line_1 ?? ""}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
        <input
          name="home_address_line_2"
          type="text"
          placeholder="Address line 2 (optional)"
          defaultValue={addresses?.home_address_line_2 ?? ""}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
        <input
          name="home_town_city"
          type="text"
          required
          placeholder="Town/city"
          defaultValue={addresses?.home_town_city ?? ""}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
        <input
          name="home_county_region"
          type="text"
          placeholder="County/region (optional)"
          defaultValue={addresses?.home_county_region ?? ""}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
        <input
          name="home_postcode"
          type="text"
          required
          placeholder="Postcode"
          defaultValue={addresses?.home_postcode ?? ""}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
        <input
          name="home_country"
          type="text"
          required
          placeholder="Country"
          defaultValue={addresses?.home_country ?? ""}
          className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-polar-text">
          Work/commercial address
        </legend>
        <label className="flex items-center gap-2 text-sm text-polar-text">
          <input
            name="work_same_as_home"
            type="checkbox"
            checked={workSameAsHome}
            onChange={(e) => setWorkSameAsHome(e.target.checked)}
          />
          Same as my home address
        </label>

        {!workSameAsHome && (
          <>
            <input
              name="work_address_line_1"
              type="text"
              placeholder="Address line 1"
              defaultValue={addresses?.work_address_line_1 ?? ""}
              className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
            />
            <input
              name="work_address_line_2"
              type="text"
              placeholder="Address line 2 (optional)"
              defaultValue={addresses?.work_address_line_2 ?? ""}
              className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
            />
            <input
              name="work_town_city"
              type="text"
              placeholder="Town/city"
              defaultValue={addresses?.work_town_city ?? ""}
              className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
            />
            <input
              name="work_county_region"
              type="text"
              placeholder="County/region (optional)"
              defaultValue={addresses?.work_county_region ?? ""}
              className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
            />
            <input
              name="work_postcode"
              type="text"
              placeholder="Postcode"
              defaultValue={addresses?.work_postcode ?? ""}
              className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
            />
            <input
              name="work_country"
              type="text"
              placeholder="Country"
              defaultValue={addresses?.work_country ?? ""}
              className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
            />
          </>
        )}
      </fieldset>

      {error && <p className="text-sm text-polar-danger">{error}</p>}
      {saved && !error && <p className="text-sm text-polar-success">Saved</p>}

      <SubmitButton pending={pending} label="Save" pendingLabel="Saving…" />
    </form>
  );
}
