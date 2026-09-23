"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signUpClient } from "@/lib/actions/auth";
import { SignupScene } from "@/components/signup/signup-scene";
import {
  UserIcon,
  EnvelopeIcon,
  LockIcon,
  PinIcon,
  SearchIcon,
  EyeIcon,
  EyeOffIcon,
  ChevronDownIcon,
} from "@/components/signup/icons";

// Desktop artwork replaced with the new approved Client Portal scene
// (WWW.THEPOLAROOM.COM-CREATE-ACCOUNT-CLIENT.png, converted to WebP).
// The room itself is untouched, approved creative — SignupScene
// renders it byte-for-byte via the shared crop-to-fill technique. The
// artwork's own baked reference panel is fully occluded by the real
// panel below (same footprint, measured against the art — see
// SignupScene's PANEL_BOX), so nothing baked is ever actually shown.
//
// Mobile is intentionally left on its EXISTING background/card
// treatment (create-account-mobile-bg.png) rather than force-fitting
// this new wide desktop scene into portrait — no new mobile artwork
// was supplied, and the current mobile experience already works and
// is purpose-built for that breakpoint; only the shared field content
// below (which mobile and desktop both render) changes.
//
// Consent: still one visible checkbox mirroring its checked state
// into the three hidden inputs (terms_accepted/privacy_accepted/
// age_confirmed) signUpClient's server-side trigger independently
// requires — unchanged from before, exactly matching the approved
// design's single checkbox.
//
// Phone: unchanged — static "+44" prefix (V1 is UK-only) concatenated
// onto the entered digits before submit.
//
// Password: the approved mockup's placeholder text says "Minimum 8
// characters" — the REAL, enforced requirement stays at 12 (unchanged
// minLength + server re-check), so the placeholder text shown here
// says "Minimum 12 characters", not 8 — matching the mockup's copy
// literally would just be a visible lie about what the form actually
// requires.
const INPUT_CLASS =
  "w-full rounded-lg border border-white/15 bg-white/5 py-2.5 sm:py-1 pl-10 sm:pl-8 pr-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-royal-light sm:text-xs";

// Desktop-only sizing — the panel is now a measured box inside the
// crop-to-fill artwork (SignupScene.PANEL_BOX), not a fixed max-w-md
// rem card, so its content scales with the viewport like every other
// mastered page in this project. Sized generously (this panel is
// ~54vw x ~47vw at the common binding case) so Client's compact field
// set never needs to scroll internally — verified empty margin below
// the "Log in" line at every tested resolution.
const DESKTOP_INPUT_CLASS =
  "w-full rounded-lg border border-white/15 bg-white/5 pl-[11%] pr-[4%] text-white outline-none placeholder:text-white/40 focus:border-royal-light transition";

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
    <>
      {/* Mobile — unchanged background/card treatment (see file header
          comment). Field content/copy below matches desktop exactly. */}
      <main className="relative min-h-screen overflow-hidden bg-navy sm:hidden">
        <Image
          src="/signup/create-account-mobile-bg.png"
          alt=""
          fill
          priority
          className="object-cover"
          aria-hidden="true"
        />

        <div className="relative flex min-h-screen items-start justify-center px-5 pb-16 pt-[28dvh]">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-navy/70 p-6 text-white shadow-ice-lg backdrop-blur-xl"
          >
            <p className="font-display text-xs tracking-[0.25em] text-royal-light">CLIENT PORTAL</p>
            <h1 className="mt-2 font-display text-3xl tracking-wide">
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
                  <input name="full_name" type="text" required placeholder="Ahmed Muhomed" className={INPUT_CLASS} />
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
                    <ChevronDownIcon className="h-3.5 w-3.5" />
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
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <span className="mb-1 block text-xs uppercase tracking-wide text-white/40">Optional</span>
                <span className="mb-1 block text-sm text-white/80">Address (optional)</span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <PinIcon className="h-5 w-5 text-white/50" />
                  </span>
                  <input name="address" type="text" placeholder="e.g. 123 High Street, London" className={INPUT_CLASS} />
                </div>
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

      {/* Desktop — new approved scene, real panel positioned over the
          artwork's own measured reference-panel footprint. */}
      <SignupScene src="/signup/create-account-client-v2.webp" alt="POLAR — Client Portal. Create your account.">
        <form onSubmit={handleSubmit} className="flex h-full w-full flex-col px-[8%] pt-[5%]">
          {/* The artwork's own baked reference panel has a small
              crown+wordmark centred at its top — fully hidden along
              with the rest of that reference content by the opaque
              fill (SignupScene). Restored here using the existing
              approved logo asset (public/login/login-logo.png, same
              one already used elsewhere) rather than leaving the
              panel without any POLAR branding of its own. */}
          <div className="relative mx-auto" style={{ width: "16%", aspectRatio: "1774 / 887" }}>
            <Image src="/login/login-logo.png" alt="POLAR London" fill className="object-contain" priority />
          </div>
          <p className="mt-[0.9vw] font-display text-[0.85vw] tracking-[0.25em] text-royal-light">CLIENT PORTAL</p>
          <h1 className="mt-[0.6vw] font-display text-[2.1vw] leading-none tracking-wide text-white">
            Create <span className="text-royal-light">your</span> account
          </h1>
          <p className="mt-[0.5vw] text-[0.85vw] text-white/60">Quick and easy. Get started in seconds.</p>

          <div className="mt-[1.4vw] flex flex-col gap-[0.75vw]">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-[3.5%] flex items-center">
                <UserIcon className="h-[1vw] w-[1vw] text-white/50" />
              </span>
              <input
                name="full_name"
                type="text"
                required
                placeholder="Ahmed Muhomed"
                className={DESKTOP_INPUT_CLASS}
                style={{ paddingTop: "0.7vw", paddingBottom: "0.7vw", fontSize: "0.8vw" }}
              />
            </div>

            <div className="flex gap-[0.6vw]">
              <div
                aria-hidden="true"
                className="flex shrink-0 items-center gap-[0.4vw] rounded-lg border border-white/15 bg-white/5 text-white/80"
                style={{ padding: "0.7vw 0.9vw", fontSize: "0.8vw" }}
              >
                <span>🇬🇧</span>
                <span>+44</span>
                <ChevronDownIcon className="h-[0.7vw] w-[0.7vw]" />
              </div>
              <input
                name="phone"
                type="tel"
                required
                placeholder="e.g. 7700 900123"
                className="w-full flex-1 rounded-lg border border-white/15 bg-white/5 text-white outline-none placeholder:text-white/40 focus:border-royal-light transition"
                style={{ padding: "0.7vw 0.9vw", fontSize: "0.8vw" }}
              />
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-[3.5%] flex items-center">
                <EnvelopeIcon className="h-[1vw] w-[1vw] text-white/50" />
              </span>
              <input
                name="email"
                type="email"
                required
                placeholder="e.g. you@example.com"
                className={DESKTOP_INPUT_CLASS}
                style={{ paddingTop: "0.7vw", paddingBottom: "0.7vw", fontSize: "0.8vw" }}
              />
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-[3.5%] flex items-center">
                <LockIcon className="h-[1vw] w-[1vw] text-white/50" />
              </span>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={12}
                placeholder="Minimum 12 characters"
                className={DESKTOP_INPUT_CLASS}
                style={{ paddingTop: "0.7vw", paddingBottom: "0.7vw", fontSize: "0.8vw", paddingRight: "11%" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-[3.5%] flex items-center text-white/50 hover:text-white"
              >
                {showPassword ? <EyeOffIcon className="h-[1vw] w-[1vw]" /> : <EyeIcon className="h-[1vw] w-[1vw]" />}
              </button>
            </div>

            <div className="border-t border-white/10" style={{ paddingTop: "0.9vw" }}>
              <span className="mb-[0.3vw] block text-white/40" style={{ fontSize: "0.6vw", letterSpacing: "0.05em" }}>
                OPTIONAL
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-[3.5%] flex items-center">
                  <PinIcon className="h-[1vw] w-[1vw] text-white/50" />
                </span>
                <input
                  name="address"
                  type="text"
                  placeholder="Start typing your address..."
                  className={DESKTOP_INPUT_CLASS}
                  style={{ paddingTop: "0.7vw", paddingBottom: "0.7vw", fontSize: "0.8vw", paddingRight: "11%" }}
                />
                <span className="pointer-events-none absolute inset-y-0 right-[3.5%] flex items-center text-white/40">
                  <SearchIcon className="h-[0.85vw] w-[0.85vw]" />
                </span>
              </div>
              <p className="text-white/40" style={{ marginTop: "0.4vw", fontSize: "0.65vw" }}>
                We&rsquo;ll suggest matching addresses as you type.
              </p>
            </div>
          </div>

          {error && (
            <p className="text-magenta" style={{ marginTop: "0.7vw", fontSize: "0.72vw" }}>
              {error}
            </p>
          )}

          <label className="flex items-start text-white/70" style={{ marginTop: "1.1vw", gap: "0.5vw", fontSize: "0.68vw" }}>
            <input
              type="checkbox"
              required
              onChange={handleConsentChange}
              className="rounded border-white/30 bg-white/5"
              style={{ marginTop: "0.15vw", height: "1vw", width: "1vw" }}
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
          <input type="checkbox" name="terms_accepted" className="hidden" />
          <input type="checkbox" name="privacy_accepted" className="hidden" />
          <input type="checkbox" name="age_confirmed" className="hidden" />

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-royal text-center font-display tracking-wide text-white shadow-ice transition hover:bg-royal-dark disabled:opacity-60"
            style={{ marginTop: "1.1vw", padding: "0.8vw", fontSize: "0.8vw" }}
          >
            {pending ? "Creating account…" : "Create Account"}
          </button>

          <p className="text-center text-white/50" style={{ marginTop: "0.7vw", fontSize: "0.68vw" }}>
            Already have an account?{" "}
            <Link href="/login" className="text-royal-light underline">
              Log in
            </Link>
          </p>
        </form>
      </SignupScene>
    </>
  );
}
