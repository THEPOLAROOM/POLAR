"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Nunito_Sans } from "next/font/google";
import { signUpBarber } from "@/lib/actions/auth";
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

// Desktop panel typeface — the closest match to the approved UI
// reference's rounded geometric sans. Scoped to this page only.
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

// Because Barber genuinely has more fields than fit in the panel at
// once, the interior below the fixed header (logo/title/subtitle) is
// the ONLY thing that scrolls — see the flex-col split below. The
// panel's own shell/position (set by BarberScene) never moves; neither
// does the surrounding room artwork: page/background fixed, only the
// panel's interior scrolls.
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
//
// Desktop background v7 (16:9 barber-shop scene, native 1672x941: POLAR
// left holding the cape, empty chair right, navy back wall in the
// centre). Locked master asset — never edited, stretched or re-cropped
// on disk. The stage keeps the artwork's exact aspect ratio; everything
// on it (background + panel) is positioned in artwork coordinates, so
// the panel stays on the wall at every window size.
const BG_RATIO = 1672 / 941;

// Responsive fill. The stage covers the window (no dead bands) and the
// overflow is cropped dynamically by viewport aspect ratio — but never
// into SAFE, the region that must always stay visible (fractions of the
// artwork, measured off the source): POLAR's cape edge (x0.117) to the
// chair's far edge (x0.89), just above the panel (y0.16) to the feet and
// chair base (y0.887). The crop is centred on SAFE. Only past the
// extremes where covering would cut into SAFE (narrower than ~4:3 or
// wider than ~2.4:1) does the stage stop growing, leaving a minimal navy
// margin instead of cropping POLAR, the chair or the panel.
const SAFE = { x0: 0.115, x1: 0.895, y0: 0.16, y1: 0.9 };
const STAGE_W = `min(max(100vw, calc(100dvh * ${BG_RATIO})), calc(100vw / ${SAFE.x1 - SAFE.x0}), calc(100dvh * ${BG_RATIO} / ${SAFE.y1 - SAFE.y0}))`;
const STAGE_H = `calc(var(--stage-w) / ${BG_RATIO})`;
// Offset so SAFE's centre sits at the window centre, clamped so the
// stage always covers the window (or is centred when it can't).
const offset = (view: string, size: string, centre: number) =>
  `clamp(min(calc(${view} - ${size}), calc((${view} - ${size}) / 2)), calc(${view} / 2 - ${size} * ${centre}), max(0px, calc((${view} - ${size}) / 2)))`;
const STAGE_STYLE = {
  "--stage-w": STAGE_W,
  width: "var(--stage-w)",
  height: STAGE_H,
  left: offset("100vw", "var(--stage-w)", (SAFE.x0 + SAFE.x1) / 2),
  top: offset("100dvh", STAGE_H, (SAFE.y0 + SAFE.y1) / 2),
} as React.CSSProperties;

// Approved UI reference (barber-signup-panel-v1.webp — the supplied
// PNG, losslessly converted, pixel-identical, native 1399x1124). Its
// painted splatter/glow frame is the panel's frame layer. PANEL_BOX
// maps the frame's opaque extent (x237-1167, y61-1075 in reference px)
// to x585-1125, y200-789 of the 1672x941 background: centred on the
// wall (x~855), top just under the ceiling light bar, extending onto the
// open floor. Width is capped by clearance to POLAR (right edge x~540)
// and the chair (left edge x~1198). Uniform scale 0.5806, no distortion.
const PANEL_BOX = { left: "26.76%", top: "17.49%", width: "48.58%" };

// Every desktop panel size below is written in the reference's own
// pixels and converted to cqw of the panel box (reference width =
// 100cqw), so the real UI lands exactly where the reference draws it
// at any viewport size.
const r = (n: number) => `${((n * 100) / 1399).toFixed(3)}cqw`;

// Readability floor: panel text scales with the artwork, but never
// drops below a comfortable minimum (px, by text role) on small
// laptops / landscape tablets. On larger screens the artwork-scaled
// size is already bigger, so the approved look is unchanged there.
// The panel's own size and position are not affected.
const MIN_PX: Record<number, number> = { 19: 11, 19.6: 10.5, 20: 11, 21: 11.5, 23: 12, 24: 13, 25: 12.5, 28: 12.5, 29: 12.5 };
const fs = (n: number) => (MIN_PX[n] ? `max(${r(n)}, ${MIN_PX[n]}px)` : r(n));
// Vertical gap that is the approved r(full) whenever the panel renders
// wider than ~700px (desktop), and eases down to r(compact) on small
// laptops / tablets so the readability floor never pushes the
// collapsed form into scrolling. 100cqw = the panel's rendered width.
const gap = (full: number, compact: number) => `clamp(${r(compact)}, calc((100cqw - 640px) * 0.1), ${r(full)})`;

// The reference also has its own baked copy of the logo, headings and
// controls. Those areas are masked out of the frame layer (soft-edged)
// so only the frame, splatter and panel interior show; the real HTML
// sits in exactly the same spots over PANEL_FILL. The asset file
// itself is untouched — this is a display mask, not an edit.
const HOLES: [number, number, number, number][] = [
  [580, 98, 240, 162], // logo
  [522, 276, 360, 46], // BARBER PORTAL
  [352, 322, 700, 134], // title + subtitle
  [266, 456, 872, 542], // sections, consent, button
  [512, 1003, 380, 50], // log in line
];
const MASK_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1399 1124' preserveAspectRatio='none'><filter id='f' x='-5%' y='-5%' width='110%' height='110%'><feGaussianBlur stdDeviation='4'/></filter><path filter='url(#f)' fill='#fff' fill-rule='evenodd' d='M-60 -60H1459V1184H-60Z ${HOLES.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h${-w}Z`).join(" ")}'/></svg>`;
const MASK_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(MASK_SVG)}")`;
// Sampled from the reference's own interior (top / middle / bottom).
const PANEL_FILL = "linear-gradient(180deg, #01132a 0%, #001127 55%, #001740 100%)";

const CYAN = "#00d9ee";
const LINK = "#00ebf5";

function BarberScene({ children }: { children: React.ReactNode }) {
  return (
    <main className={`${nunito.className} relative hidden h-[100dvh] overflow-hidden bg-navy sm:block`}>
      <div className="absolute" style={STAGE_STYLE}>
        <Image
          src="/signup/create-account-barber-v7.webp"
          alt="POLAR in the barber shop, next to an empty barber chair. Barber Portal — create your account."
          fill
          unoptimized
          className="object-contain"
          priority
        />
        <div className="absolute" style={{ ...PANEL_BOX, aspectRatio: "1399 / 1124", containerType: "inline-size" }}>
          <div className="absolute" style={{ left: r(248), top: r(72), width: r(908), height: r(992), borderRadius: r(36), background: PANEL_FILL }} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ WebkitMaskImage: MASK_URL, maskImage: MASK_URL, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }}
          >
            <Image src="/signup/barber-signup-panel-v1.webp" alt="" fill unoptimized className="object-contain" priority />
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

const INPUT_CLASS =
  "w-full border border-[#0560a0] bg-[#021027] text-white outline-none placeholder:text-white/40 focus:border-[#00d9ee] transition";
const INPUT_STYLE: React.CSSProperties = { padding: `${r(15)} ${r(20)}`, fontSize: fs(24), borderWidth: r(2), borderRadius: r(12) };

function ChevronDown({ open }: { open: boolean }) {
  return (
    <span
      className={`block shrink-0 text-[#0ab0ff] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      style={{ height: r(72), width: r(72) }}
    >
      <ChevronDownIcon className="h-full w-full [stroke-width:2.1]" />
    </span>
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
    <div className="overflow-hidden" style={{ border: `${r(2)} solid #0560a0`, borderRadius: r(16), background: "rgba(5,26,50,0.85)" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center text-left transition hover:bg-white/[0.03]"
        style={{ minHeight: r(105), padding: `${r(10)} ${r(14)} ${r(10)} ${r(28)}` }}
      >
        <span className="block shrink-0" style={{ height: r(64), width: r(64), color: "#12e4f7" }}>
          {icon}
        </span>
        <span className="flex-1" style={{ marginLeft: r(37) }}>
          <span className="block font-bold text-white" style={{ fontSize: fs(25), lineHeight: 1.2 }}>{title}</span>
          <span className="block text-white/85" style={{ fontSize: fs(21), lineHeight: 1.2, marginTop: r(8) }}>{subtitle}</span>
        </span>
        <ChevronDown open={open} />
      </button>
      {/* grid-template-rows 0fr/1fr, not max-height — animates smoothly
          regardless of the section's real content height, and (unlike
          display:none) keeps every required field inside genuinely
          present in the form's layout, not removed from it. */}
      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <div className="flex flex-col" style={{ padding: `${r(2)} ${r(31)} ${r(30)}`, gap: r(18) }}>
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
      <span className="block text-white/80" style={{ fontSize: fs(21), marginBottom: r(8) }}>
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
        style={INPUT_STYLE}
      />
    </label>
  );
}

export default function BarberSignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [workSameAsHome, setWorkSameAsHome] = useState(false);
  const [openSections, setOpenSections] = useState({ personal: false, professional: false, addresses: false });

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

      {/* Desktop — background v7 shown in full, approved UI reference
          as the panel (see BarberScene). Fixed header (logo/title/
          subtitle) + a single internally-scrollable region holding
          every section, consent and the submit button — it only
          scrolls once expanded content exceeds the reference's own
          body area. The panel and the room never move. */}
      <BarberScene>
        <div className="absolute" style={{ left: r(536), top: r(96.5), width: r(331), aspectRatio: "1774 / 887" }}>
          <Image src="/login/login-logo.png" alt="POLAR London" fill sizes="20vw" className="object-contain" priority />
        </div>
        <p
          className="absolute inset-x-0 text-center font-bold uppercase"
          style={{ top: r(284), fontSize: fs(28), lineHeight: 1, letterSpacing: "0.28em", paddingLeft: "0.28em", color: "#08c6f2" }}
        >
          Barber Portal
        </p>
        <h1 className="absolute inset-x-0 text-center font-extrabold text-white" style={{ top: r(326), fontSize: fs(70), lineHeight: 1, letterSpacing: "-0.005em" }}>
          Create <span style={{ color: "#06cdfb" }}>your</span> account
        </h1>
        <p className="absolute inset-x-0 text-center text-white/90" style={{ top: r(409), fontSize: fs(29), lineHeight: 1.1 }}>
          Join POLAR. Be part of something bigger.
        </p>

        {/* barber-scroll: a thin POLAR-tinted scrollbar instead of the
            browser's thick default white one — scroll itself (wheel,
            touch, keyboard via focus) is completely unaffected, only
            its visual chrome changes. Firefox via scrollbar-width/
            scrollbar-color, Chromium/WebKit via the pseudo-elements.
            polar-check: the reference's cyan outlined checkbox — still
            a native checkbox (required/validation/keyboard unchanged),
            only its drawing is custom. Sizes in cqw = reference px. */}
        <style jsx global>{`
          .barber-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(91, 155, 255, 0.5) transparent;
          }
          .barber-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .barber-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .barber-scroll::-webkit-scrollbar-thumb {
            background-color: rgba(91, 155, 255, 0.5);
            border-radius: 999px;
          }
          .barber-scroll::-webkit-scrollbar-thumb:hover {
            background-color: rgba(91, 155, 255, 0.75);
          }
          .polar-check {
            appearance: none;
            -webkit-appearance: none;
            flex-shrink: 0;
            width: 3.002cqw;
            height: 3.002cqw;
            border: 0.214cqw solid ${CYAN};
            border-radius: 0.5cqw;
            background: transparent;
            cursor: pointer;
            transition: background-color 0.15s;
          }
          .polar-check:checked {
            background: ${CYAN} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23011026' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12.5l4.5 4.5L19 7.5'/></svg>") center / 80% no-repeat;
          }
          .polar-check:focus-visible {
            outline: 2px solid ${LINK};
            outline-offset: 2px;
          }
        `}</style>
        <div
          className="barber-scroll absolute overflow-y-auto overscroll-contain"
          style={{ left: r(270), top: r(460), width: r(864), height: r(542), padding: `${r(6)} ${r(9)} ${r(8)}` }}
        >
            <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: r(11) }}>
              <Section
                icon={<UserIcon className="h-full w-full [stroke-width:1.9]" />}
                title="Personal Details"
                subtitle="Your account information"
                open={openSections.personal}
                onToggle={() => toggleSection("personal")}
              >
                <TextField name="full_name" label="Full Name" required onInvalid={() => openSection("personal")} />
                <TextField name="phone" label="Phone Number" type="tel" required onInvalid={() => openSection("personal")} />
                <TextField name="email" label="Email" type="email" required onInvalid={() => openSection("personal")} />
                <label className="block">
                  <span className="block text-white/80" style={{ fontSize: fs(21), marginBottom: r(8) }}>
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
                      style={{ ...INPUT_STYLE, paddingRight: "10%" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-[3%] flex items-center text-white/50 hover:text-white"
                    >
                      <span className="block" style={{ height: r(28), width: r(28) }}>
                        {showPassword ? <EyeOffIcon className="h-full w-full" /> : <EyeIcon className="h-full w-full" />}
                      </span>
                    </button>
                  </div>
                </label>
              </Section>

              <Section
                icon={<ScissorsIcon className="h-full w-full [stroke-width:1.9]" />}
                title="Professional Details"
                subtitle="Tell us about your barbering background"
                open={openSections.professional}
                onToggle={() => toggleSection("professional")}
              >
                <p className="text-white/50" style={{ fontSize: fs(20) }}>
                  Optional — you can fill this in later from your dashboard instead.
                </p>
                <TextField name="barber_name" label="Barber / Stylist Name" />
                <TextField name="business_name" label="Business Name" />
                <TextField name="years_experience" label="Years of Experience" type="number" />
                <div>
                  <TextField name="work_location" label="Work Location" />
                  <p className="text-white/50" style={{ marginTop: r(8), fontSize: fs(19) }}>
                    A short description for your profile — e.g. &quot;Central London&quot; or &quot;Mobile barber&quot;. Not your address.
                  </p>
                </div>
              </Section>

              <Section
                icon={<PinIcon className="h-full w-full [stroke-width:1.9]" />}
                title="Addresses"
                subtitle="Home and work location"
                open={openSections.addresses}
                onToggle={() => toggleSection("addresses")}
              >
                <p className="font-bold text-white/90" style={{ fontSize: fs(23) }}>Personal / Home Address</p>
                <p className="text-white/50" style={{ fontSize: fs(20), marginTop: r(-10) }}>Always private. Never shown to clients.</p>
                <TextField name="home_address_line_1" label="Address Line 1" required onInvalid={() => openSection("addresses")} />
                <TextField name="home_address_line_2" label="Address Line 2 (optional)" />
                <TextField name="home_town_city" label="Town / City" required onInvalid={() => openSection("addresses")} />
                <TextField name="home_county_region" label="County / Region (optional)" />
                <TextField name="home_postcode" label="Postcode" required onInvalid={() => openSection("addresses")} />
                <TextField name="home_country" label="Country" required onInvalid={() => openSection("addresses")} />

                <p className="font-bold text-white/90" style={{ fontSize: fs(23), marginTop: r(10) }}>Work / Commercial Address</p>
                <p className="text-white/50" style={{ fontSize: fs(20), marginTop: r(-10) }}>
                  Where you provide services from. May be shown to clients with a confirmed appointment.
                </p>
                <label className="flex items-center text-white/85" style={{ gap: r(16), fontSize: fs(21) }}>
                  <input
                    type="checkbox"
                    name="work_same_as_home"
                    checked={workSameAsHome}
                    onChange={(e) => setWorkSameAsHome(e.target.checked)}
                    className="polar-check"
                    style={{ width: r(32), height: r(32) }}
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

              <label className="flex items-center text-white/90" style={{ gap: r(20), fontSize: fs(19.6), lineHeight: 1.25, marginTop: gap(12, 2) }}>
                <input type="checkbox" required onChange={handleConsentChange} className="polar-check" />
                <span>
                  I agree to the{" "}
                  <Link href="/legal/terms" target="_blank" className="underline underline-offset-2" style={{ color: LINK }}>Terms &amp; Conditions</Link>{" "}
                  and{" "}
                  <Link href="/legal/privacy" target="_blank" className="underline underline-offset-2" style={{ color: LINK }}>Privacy Policy</Link>
                  , and confirm I am aged 16 or over.
                </span>
              </label>
              <input type="checkbox" name="terms_accepted" className="hidden" />
              <input type="checkbox" name="privacy_accepted" className="hidden" />
              <input type="checkbox" name="age_confirmed" className="hidden" />

              {error && (
                <p className="text-magenta" style={{ fontSize: fs(21) }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full text-center font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                style={{
                  marginTop: gap(13, 3),
                  height: r(82),
                  fontSize: fs(28),
                  borderRadius: r(18),
                  border: `${r(2)} solid rgba(90,220,255,0.9)`,
                  background: "linear-gradient(180deg, #1a8dff 0%, #0061fc 50%, #0056ef 100%)",
                  boxShadow: `0 0 ${r(26)} rgba(0,130,255,0.75), inset 0 ${r(2)} ${r(6)} rgba(255,255,255,0.25)`,
                }}
              >
                {pending ? "Creating account…" : "Create Account"}
              </button>
            </form>
        </div>

        <p className="absolute inset-x-0 text-center text-white/90" style={{ top: r(1013), fontSize: fs(25), lineHeight: 1.2 }}>
          Already have an account?{" "}
          <Link href="/login" className="font-bold underline underline-offset-2" style={{ color: LINK }}>Log in</Link>
        </p>
      </BarberScene>
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
