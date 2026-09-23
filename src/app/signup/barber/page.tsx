"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signUpBarber } from "@/lib/actions/auth";
import { SignupScene } from "@/components/signup/signup-scene";
import {
  UserIcon,
  EnvelopeIcon,
  LockIcon,
  PinIcon,
  EyeIcon,
  EyeOffIcon,
  ChevronDownIcon,
  ScissorsIcon,
} from "@/components/signup/icons";

// New approved Barber Portal scene (WWW.THEPOLAROOM.COM-CREATE-ACCOUNT-BARBER.png,
// converted to WebP), same room/panel silhouette as Client (see
// SignupScene) — same crop-to-fill technique, same opaque-fill panel
// occluding the baked reference content, same restored logo (the
// baked reference's own crown+wordmark is hidden along with
// everything else the fill occludes).
//
// Because Barber genuinely has more fields than fit in the panel at
// once, the interior below the fixed header (logo/title/subtitle) is
// the ONLY thing that scrolls — see the h-full flex-col split below.
// The panel's own shell/position (set entirely by SignupScene) never
// moves; neither does the surrounding room artwork. This is the exact
// architecture requested: page/background fixed, only the panel's
// interior scrolls.
//
// Every backend requirement from the prior audits is preserved
// unchanged: signUpBarber(), the exact FormData key names it reads,
// 12-character password minimum, home-address-always-required +
// work-address-required-unless-same-as-home (both the UI conditional
// AND the fact that the database trigger independently re-validates
// this regardless of what the UI does), the three real consent values
// (mirrored from one visible checkbox, same proven pattern as
// Client), and the manual/out-of-band Barber-role grant process (this
// page has no role selector and never could — role is decided
// entirely outside the frontend).
//
// Per the "Important Barber cleanup" instructions: work_location is
// UNCHANGED — same name, same optional/free-text behaviour, no schema
// or action change. Only a small clarifying caption was added under
// it (purely a UI label, not a semantic change) so it doesn't read as
// a duplicate of the separate Work/Commercial Address section below.
const INPUT_CLASS =
  "w-full rounded-lg border border-white/15 bg-white/5 text-white outline-none placeholder:text-white/40 focus:border-royal-light transition";

function ChevronDown({ open }: { open: boolean }) {
  return (
    <ChevronDownIcon
      className={`h-[1vw] w-[1vw] shrink-0 text-royal-light transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    />
  );
}

function Section({
  icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center text-left transition hover:bg-white/[0.03]"
        style={{ gap: "0.9vw", padding: "0.85vw 1vw" }}
      >
        <span className="block shrink-0 text-royal-light" style={{ height: "1.3vw", width: "1.3vw" }}>
          {icon}
        </span>
        <span className="flex-1">
          <span className="block text-white" style={{ fontSize: "0.85vw" }}>{title}</span>
          <span className="block text-white/50" style={{ fontSize: "0.68vw" }}>{subtitle}</span>
        </span>
        <ChevronDown open={open} />
      </button>
      {/* grid-template-rows 0fr/1fr, not max-height — animates smoothly
          regardless of the section's real content height, and (unlike
          display:none) keeps every required field inside genuinely
          present in the form's layout, not removed from it. */}
      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <div className="flex flex-col" style={{ padding: "0 1vw 1vw 1vw", gap: "0.7vw" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function TextField({
  name,
  label,
  type = "text",
  required,
  placeholder,
  onInvalid,
  minLength,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  onInvalid?: () => void;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-[0.3vw] block text-white/70" style={{ fontSize: "0.68vw" }}>
        {label}
        {required && <span className="text-magenta"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        onInvalid={onInvalid}
        className={INPUT_CLASS}
        style={{ padding: "0.6vw 0.8vw", fontSize: "0.78vw" }}
      />
    </label>
  );
}

export default function BarberSignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [workSameAsHome, setWorkSameAsHome] = useState(false);
  const [openSections, setOpenSections] = useState({ personal: true, professional: false, addresses: false });

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }
  function openSection(key: keyof typeof openSections) {
    setOpenSections((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await signUpBarber(formData);
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
      {/* Mobile — no artwork (none was supplied for this breakpoint,
          and this wide landscape scene would either hide the panel or
          crop the mascot badly if force-fit to portrait — same call
          already made for /login's mascot scene). Restyled to the
          same restrained navy/electric-blue/cyan palette as desktop;
          every field/section/action below is otherwise identical.
          Normal page scroll — the "page must not scroll" requirement
          is explicitly a desktop-only constraint. */}
      <main className="min-h-screen bg-navy px-5 py-10 text-white sm:hidden">
        <div className="relative mx-auto" style={{ width: "40%", maxWidth: 180, aspectRatio: "1774 / 887" }}>
          <Image src="/login/login-logo.png" alt="POLAR London" fill className="object-contain" priority />
        </div>
        <p className="mt-4 text-center font-display text-xs tracking-[0.25em] text-royal-light">BARBER PORTAL</p>
        <h1 className="mt-2 text-center font-display text-2xl tracking-wide">
          Create <span className="text-royal-light">your</span> account
        </h1>
        <p className="mt-1 text-center text-sm text-white/60">Join POLAR. Be part of something bigger.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <MobileSection icon={<UserIcon className="h-5 w-5" />} title="Personal Details" subtitle="Your account information" open={openSections.personal} onToggle={() => toggleSection("personal")}>
            <MobileField name="full_name" label="Full Name" required onInvalid={() => openSection("personal")} />
            <MobileField name="phone" label="Phone Number" type="tel" required onInvalid={() => openSection("personal")} />
            <MobileField name="email" label="Email" type="email" required onInvalid={() => openSection("personal")} />
            <div>
              <span className="mb-1 block text-xs text-white/70">Password *</span>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={12}
                  placeholder="Minimum 12 characters"
                  onInvalid={() => openSection("personal")}
                  className="w-full rounded-lg border border-white/15 bg-white/5 py-2.5 pl-3 pr-10 text-sm text-white outline-none placeholder:text-white/40 focus:border-royal-light"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-3 flex items-center text-white/50 hover:text-white">
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </MobileSection>

          <MobileSection icon={<ScissorsIcon className="h-5 w-5" />} title="Professional Details" subtitle="Tell us about your barbering background" open={openSections.professional} onToggle={() => toggleSection("professional")}>
            <MobileField name="barber_name" label="Barber / Stylist Name" />
            <MobileField name="business_name" label="Business Name" />
            <MobileField name="years_experience" label="Years of Experience" type="number" />
            <div>
              <MobileField name="work_location" label="Work Location" />
              <p className="mt-1 text-[11px] text-white/40">A short description for your profile — e.g. &quot;Central London&quot; or &quot;Mobile barber&quot;. Not your address.</p>
            </div>
          </MobileSection>

          <MobileSection icon={<PinIcon className="h-5 w-5" />} title="Addresses" subtitle="Home and work location" open={openSections.addresses} onToggle={() => toggleSection("addresses")}>
            <p className="text-xs font-medium text-white/80">Personal / Home Address</p>
            <p className="text-[11px] text-white/40">Always private. Never shown to clients.</p>
            <MobileField name="home_address_line_1" label="Address Line 1" required onInvalid={() => openSection("addresses")} />
            <MobileField name="home_address_line_2" label="Address Line 2 (optional)" />
            <MobileField name="home_town_city" label="Town / City" required onInvalid={() => openSection("addresses")} />
            <MobileField name="home_county_region" label="County / Region (optional)" />
            <MobileField name="home_postcode" label="Postcode" required onInvalid={() => openSection("addresses")} />
            <MobileField name="home_country" label="Country" required onInvalid={() => openSection("addresses")} />

            <p className="mt-2 text-xs font-medium text-white/80">Work / Commercial Address</p>
            <p className="text-[11px] text-white/40">Where you provide services from. May be shown to clients with a confirmed appointment.</p>
            <label className="flex items-start gap-2 text-xs text-white/70">
              <input type="checkbox" name="work_same_as_home" checked={workSameAsHome} onChange={(e) => setWorkSameAsHome(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/5" />
              Same as my Personal/Home Address
            </label>
            {!workSameAsHome && (
              <>
                <MobileField name="work_address_line_1" label="Address Line 1" required onInvalid={() => openSection("addresses")} />
                <MobileField name="work_address_line_2" label="Address Line 2 (optional)" />
                <MobileField name="work_town_city" label="Town / City" required onInvalid={() => openSection("addresses")} />
                <MobileField name="work_county_region" label="County / Region (optional)" />
                <MobileField name="work_postcode" label="Postcode" required onInvalid={() => openSection("addresses")} />
                <MobileField name="work_country" label="Country" required onInvalid={() => openSection("addresses")} />
              </>
            )}
          </MobileSection>

          <label className="flex items-start gap-2 text-xs text-white/70">
            <input type="checkbox" required onChange={handleConsentChange} className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/5" />
            <span>
              I agree to the{" "}
              <Link href="/legal/terms" target="_blank" className="text-royal-light underline">Terms &amp; Conditions</Link>{" "}
              and{" "}
              <Link href="/legal/privacy" target="_blank" className="text-royal-light underline">Privacy Policy</Link>
              , and confirm I am aged 16 or over.
            </span>
          </label>
          <input type="checkbox" name="terms_accepted" className="hidden" />
          <input type="checkbox" name="privacy_accepted" className="hidden" />
          <input type="checkbox" name="age_confirmed" className="hidden" />

          {error && <p className="text-sm text-magenta">{error}</p>}

          <button type="submit" disabled={pending} className="w-full rounded-lg bg-royal py-3 text-center font-display text-sm tracking-wide text-white shadow-ice transition hover:bg-royal-dark disabled:opacity-60">
            {pending ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="text-royal-light underline">Log in</Link>
        </p>
      </main>

      {/* Desktop — new approved scene. Fixed header (logo/title/
          subtitle) + a single internally-scrollable region holding
          every section, consent and the submit button. The panel
          shell/position (SignupScene) and the room around it never
          move; only this inner region scrolls, and only when its
          content genuinely doesn't fit. */}
      <SignupScene src="/signup/create-account-barber-v2.webp" alt="POLAR — Barber Portal. Create your account.">
        <div className="flex h-full w-full flex-col">
          <div className="shrink-0 px-[8%] pt-[5%]">
            <div className="relative mx-auto" style={{ width: "14%", aspectRatio: "1774 / 887" }}>
              <Image src="/login/login-logo.png" alt="POLAR London" fill className="object-contain" priority />
            </div>
            <p className="mt-[0.7vw] font-display text-[0.8vw] tracking-[0.25em] text-royal-light">BARBER PORTAL</p>
            <h1 className="mt-[0.35vw] font-display text-[1.8vw] leading-none tracking-wide text-white">
              Create <span className="text-royal-light">your</span> account
            </h1>
            <p className="mt-[0.4vw] text-[0.78vw] text-white/60">Join POLAR. Be part of something bigger.</p>
          </div>

          <div className="mt-[1vw] min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ padding: "0 8% 6% 8%" }}>
            <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: "0.7vw" }}>
              <Section
                icon={<UserIcon className="h-full w-full" />}
                title="Personal Details"
                subtitle="Your account information"
                open={openSections.personal}
                onToggle={() => toggleSection("personal")}
              >
                <TextField name="full_name" label="Full Name" required onInvalid={() => openSection("personal")} />
                <TextField name="phone" label="Phone Number" type="tel" required onInvalid={() => openSection("personal")} />
                <TextField name="email" label="Email" type="email" required onInvalid={() => openSection("personal")} />
                <label className="block">
                  <span className="mb-[0.3vw] block text-white/70" style={{ fontSize: "0.68vw" }}>
                    Password <span className="text-magenta">*</span>
                  </span>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={12}
                      placeholder="Minimum 12 characters"
                      onInvalid={() => openSection("personal")}
                      className={INPUT_CLASS}
                      style={{ padding: "0.6vw 0.8vw", fontSize: "0.78vw", paddingRight: "10%" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-[3%] flex items-center text-white/50 hover:text-white"
                    >
                      {showPassword ? <EyeOffIcon className="h-[0.9vw] w-[0.9vw]" /> : <EyeIcon className="h-[0.9vw] w-[0.9vw]" />}
                    </button>
                  </div>
                </label>
              </Section>

              <Section
                icon={<ScissorsIcon className="h-full w-full" />}
                title="Professional Details"
                subtitle="Tell us about your barbering background"
                open={openSections.professional}
                onToggle={() => toggleSection("professional")}
              >
                <p className="text-white/40" style={{ fontSize: "0.62vw" }}>
                  Optional — you can fill this in later from your dashboard instead.
                </p>
                <TextField name="barber_name" label="Barber / Stylist Name" />
                <TextField name="business_name" label="Business Name" />
                <TextField name="years_experience" label="Years of Experience" type="number" />
                <div>
                  <TextField name="work_location" label="Work Location" />
                  <p className="text-white/40" style={{ marginTop: "0.3vw", fontSize: "0.6vw" }}>
                    A short description for your profile — e.g. &quot;Central London&quot; or &quot;Mobile barber&quot;. Not your address.
                  </p>
                </div>
              </Section>

              <Section
                icon={<PinIcon className="h-full w-full" />}
                title="Addresses"
                subtitle="Home and work location"
                open={openSections.addresses}
                onToggle={() => toggleSection("addresses")}
              >
                <p className="font-medium text-white/80" style={{ fontSize: "0.72vw" }}>Personal / Home Address</p>
                <p className="text-white/40" style={{ fontSize: "0.62vw", marginTop: "-0.4vw" }}>Always private. Never shown to clients.</p>
                <TextField name="home_address_line_1" label="Address Line 1" required onInvalid={() => openSection("addresses")} />
                <TextField name="home_address_line_2" label="Address Line 2 (optional)" />
                <TextField name="home_town_city" label="Town / City" required onInvalid={() => openSection("addresses")} />
                <TextField name="home_county_region" label="County / Region (optional)" />
                <TextField name="home_postcode" label="Postcode" required onInvalid={() => openSection("addresses")} />
                <TextField name="home_country" label="Country" required onInvalid={() => openSection("addresses")} />

                <p className="font-medium text-white/80" style={{ fontSize: "0.72vw", marginTop: "0.3vw" }}>Work / Commercial Address</p>
                <p className="text-white/40" style={{ fontSize: "0.62vw", marginTop: "-0.4vw" }}>
                  Where you provide services from. May be shown to clients with a confirmed appointment.
                </p>
                <label className="flex items-center text-white/70" style={{ gap: "0.5vw", fontSize: "0.7vw" }}>
                  <input
                    type="checkbox"
                    name="work_same_as_home"
                    checked={workSameAsHome}
                    onChange={(e) => setWorkSameAsHome(e.target.checked)}
                    className="rounded border-white/30 bg-white/5"
                    style={{ height: "0.9vw", width: "0.9vw" }}
                  />
                  Same as my Personal/Home Address
                </label>
                {!workSameAsHome && (
                  <>
                    <TextField name="work_address_line_1" label="Address Line 1" required onInvalid={() => openSection("addresses")} />
                    <TextField name="work_address_line_2" label="Address Line 2 (optional)" />
                    <TextField name="work_town_city" label="Town / City" required onInvalid={() => openSection("addresses")} />
                    <TextField name="work_county_region" label="County / Region (optional)" />
                    <TextField name="work_postcode" label="Postcode" required onInvalid={() => openSection("addresses")} />
                    <TextField name="work_country" label="Country" required onInvalid={() => openSection("addresses")} />
                  </>
                )}
              </Section>

              <label className="flex items-start text-white/70" style={{ gap: "0.5vw", fontSize: "0.68vw" }}>
                <input
                  type="checkbox"
                  required
                  onChange={handleConsentChange}
                  className="rounded border-white/30 bg-white/5"
                  style={{ marginTop: "0.15vw", height: "1vw", width: "1vw" }}
                />
                <span>
                  I agree to the{" "}
                  <Link href="/legal/terms" target="_blank" className="text-royal-light underline">Terms &amp; Conditions</Link>{" "}
                  and{" "}
                  <Link href="/legal/privacy" target="_blank" className="text-royal-light underline">Privacy Policy</Link>
                  , and confirm I am aged 16 or over.
                </span>
              </label>
              <input type="checkbox" name="terms_accepted" className="hidden" />
              <input type="checkbox" name="privacy_accepted" className="hidden" />
              <input type="checkbox" name="age_confirmed" className="hidden" />

              {error && (
                <p className="text-magenta" style={{ fontSize: "0.72vw" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-royal text-center font-display tracking-wide text-white shadow-ice transition hover:bg-royal-dark disabled:opacity-60"
                style={{ padding: "0.8vw", fontSize: "0.8vw" }}
              >
                {pending ? "Creating account…" : "Create Account"}
              </button>

              <p className="text-center text-white/50" style={{ fontSize: "0.68vw" }}>
                Already have an account?{" "}
                <Link href="/login" className="text-royal-light underline">Log in</Link>
              </p>
            </form>
          </div>
        </div>
      </SignupScene>
    </>
  );
}

function MobileSection({
  icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 p-3 text-left">
        <span className="text-royal-light">{icon}</span>
        <span className="flex-1">
          <span className="block text-sm text-white">{title}</span>
          <span className="block text-xs text-white/50">{subtitle}</span>
        </span>
        <ChevronDownIcon className={`h-4 w-4 text-royal-light transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <div className="flex flex-col gap-2 p-3 pt-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

function MobileField({
  name,
  label,
  type = "text",
  required,
  onInvalid,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  onInvalid?: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-white/70">
        {label}
        {required && <span className="text-magenta"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        onInvalid={onInvalid}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-royal-light"
      />
    </label>
  );
}
