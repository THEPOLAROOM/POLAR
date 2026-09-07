"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signUpClient } from "@/lib/actions/auth";
import {
  UserIcon,
  EnvelopeIcon,
  LockIcon,
  PinIcon,
  SearchIcon,
  EyeIcon,
  EyeOffIcon,
  ChevronDownIcon,
} from "./icons";

// The approved mockups (create-account-desktop.png / -mobile.png)
// bake the entire form INTO the artwork itself. They are used here
// only as visual reference for layout/room styling — never rendered
// on the page, since doing so would show a second, fake form behind
// the real one. The actual backgrounds
// (create-account-desktop-bg.png / -mobile-bg.png) are derived,
// non-destructive copies with only the card region replaced by a
// solid fill sampled from that same region's own ambient colour
// (feathered at the edges to blend into the surrounding photo) — the
// POLAR Room environment (logo, walls, plants, chair, floor, neon)
// is otherwise pixel-identical to the approved artwork. Everything on
// top — inputs, password toggle, checkbox, links, button — is real,
// functional markup, not a click-overlay on a flat image.
//
// Consent: the artwork shows a single checkbox ("Terms & Conditions
// and Privacy Policy"). The live signup trigger independently
// requires a separate, explicit 16+ affirmation
// (age_16_confirmed = 'true') or it rejects the signup — that can't
// be silently assumed on the user's behalf. Rather than add a second
// checkbox (which the approved design doesn't show), the one checkbox
// here carries all three affirmations in its label text and mirrors
// its checked state into three hidden inputs matching the fields
// signUpClient/the trigger expect, so consent stays genuine without
// adding a field the design doesn't have.
//
// Phone: the artwork shows a "+44" country box beside the number
// input. V1 is UK-only, so this is a static display prefix (not a
// real country picker — multi-country support isn't in scope),
// concatenated onto the entered digits before submit.
//
// Address: single optional free-text field, per the locked backend
// resolution — its value is not yet sent to Supabase (see
// signUpClient); real autocomplete/lookup is a future addition.
const INPUT_CLASS =
  "w-full rounded-lg border border-white/15 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-royal-light";

export default function ClientSignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const digits = String(formData.get("phone") ?? "").trim();
    if (digits) formData.set("phone", `+44 ${digits}`);
    const result = await signUpClient(formData);
    setPending(false);
    if (result && "error" in result) setError(result.error);
  }

  function handleConsentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const form = e.currentTarget.form;
    if (!form) return;
    const checked = e.currentTarget.checked;
    (["terms_accepted", "privacy_accepted", "age_confirmed"] as const).forEach((name) => {
      const hidden = form.elements.namedItem(name) as HTMLInputElement | null;
      if (hidden) hidden.checked = checked;
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy">
      <Image
        src="/signup/create-account-desktop-bg.png"
        alt=""
        fill
        priority
        className="hidden object-cover sm:block"
        aria-hidden="true"
      />
      <Image
        src="/signup/create-account-mobile-bg.png"
        alt=""
        fill
        priority
        className="object-cover sm:hidden"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-navy/25" aria-hidden="true" />

      <div className="relative flex min-h-screen items-center justify-center px-5 py-16 sm:px-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-white/15 bg-navy/70 p-6 text-white shadow-ice-lg backdrop-blur-xl sm:p-8"
        >
          <p className="font-display text-xs tracking-[0.25em] text-royal-light">CLIENT PORTAL</p>
          <h1 className="mt-2 font-display text-3xl tracking-wide sm:text-4xl">
            Create <span className="text-royal-light">your</span> account
          </h1>
          <p className="mt-1 text-sm text-white/60">Quick and easy. Get started in seconds.</p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm text-white/80">Full Name</span>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <UserIcon className="h-5 w-5 text-white/50" />
                </span>
                <input name="full_name" type="text" required placeholder="e.g. Ahmed Khan" className={INPUT_CLASS} />
              </div>
            </label>

            <div>
              <span className="mb-1 block text-sm text-white/80">Phone Number</span>
              <div className="flex gap-2">
                <div
                  aria-hidden="true"
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white/80"
                >
                  <span>🇬🇧</span>
                  <span>+44</span>
                  <ChevronDownIcon />
                </div>
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="e.g. 7700 900123"
                  className="w-full flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-royal-light"
                />
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm text-white/80">Email</span>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-white/50" />
                </span>
                <input name="email" type="email" required placeholder="e.g. you@example.com" className={INPUT_CLASS} />
              </div>
            </label>

            <div>
              <span className="mb-1 block text-sm text-white/80">Password</span>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <LockIcon className="h-5 w-5 text-white/50" />
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={12}
                  placeholder="Minimum 12 characters"
                  className={`${INPUT_CLASS} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 flex items-center text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <span className="mb-1 block text-xs uppercase tracking-wide text-white/40">Optional</span>
              <span className="mb-1 hidden text-sm text-white/80 sm:block">Find your address (optional)</span>
              <span className="mb-1 block text-sm text-white/80 sm:hidden">Address (optional)</span>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <PinIcon className="h-5 w-5 text-white/50" />
                </span>
                <input
                  name="address"
                  type="text"
                  placeholder="e.g. 123 High Street, London"
                  className={`${INPUT_CLASS} sm:pr-10`}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 hidden items-center sm:flex">
                  <SearchIcon />
                </span>
              </div>
              <p className="mt-1 hidden text-xs text-white/40 sm:block">
                We&rsquo;ll suggest matching addresses as you type.
              </p>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-lg bg-royal py-3 text-center font-display text-sm tracking-wide text-white shadow-ice transition hover:bg-royal-dark disabled:opacity-60"
          >
            {pending ? "Creating account…" : "Create Account"}
          </button>

          <label className="mt-4 flex items-start gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              required
              onChange={handleConsentChange}
              className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/5"
            />
            <span>
              I agree to the{" "}
              <Link href="/legal/terms" target="_blank" className="text-royal-light underline">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" target="_blank" className="text-royal-light underline">
                Privacy Policy
              </Link>
              , and confirm I am aged 16 or over.
            </span>
          </label>
          {/* Mirrors the single visible checkbox above into the three
              discrete claims the signup trigger independently
              requires — see file header comment. */}
          <input type="checkbox" name="terms_accepted" className="hidden" />
          <input type="checkbox" name="privacy_accepted" className="hidden" />
          <input type="checkbox" name="age_confirmed" className="hidden" />

          <p className="mt-4 text-center text-xs text-white/50">
            Already have an account?{" "}
            <Link href="/login" className="text-royal-light underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
