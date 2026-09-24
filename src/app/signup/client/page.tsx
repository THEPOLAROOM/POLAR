"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Nunito_Sans } from "next/font/google";
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
} from "@/components/signup/icons";

// Desktop: 16:9 Client scene (v4) shown in full, with the same approved
// splatter panel and accordion layout as /signup/barber (see
// ClientScene below). The existing Client fields are grouped into two
// sections; every field name, placeholder, requirement and the
// signUpClient() flow are unchanged.
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

// Desktop panel typeface — same as /signup/barber's approved panel.
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

// Desktop background v4 (16:9 barber-shop scene, native 1672x941:
// POLAR seated in the chair on the right wearing the cape, navy back
// wall in the centre). Locked master asset — never edited, stretched
// or re-cropped on disk. Background + panel are positioned in artwork
// coordinates on one stage, so the panel stays on the wall at every
// window size.
const BG_RATIO = 1672 / 941;

// Responsive fill — identical to /signup/barber. The stage covers the
// window (no dead bands) and the overflow is cropped dynamically by
// viewport aspect ratio, but never into SAFE: POLAR's cape edge (x0.68)
// and the chair's far edge (x0.89) on the right, the matching left
// margin (x0.115), just above the panel (y0.16) to the chair base
// (y0.882). The crop is centred on SAFE. Only past the extremes where
// covering would cut into SAFE (narrower than ~4:3 or wider than
// ~2.4:1) does the stage stop growing, leaving a minimal navy margin.
const SAFE = { x0: 0.115, x1: 0.895, y0: 0.16, y1: 0.9 };
const STAGE_W = `min(max(100vw, calc(100dvh * ${BG_RATIO})), calc(100vw / ${SAFE.x1 - SAFE.x0}), calc(100dvh * ${BG_RATIO} / ${SAFE.y1 - SAFE.y0}))`;
const STAGE_H = `calc(var(--stage-w) / ${BG_RATIO})`;
const offset = (view: string, size: string, centre: number) =>
  `clamp(min(calc(${view} - ${size}), calc((${view} - ${size}) / 2)), calc(${view} / 2 - ${size} * ${centre}), max(0px, calc((${view} - ${size}) / 2)))`;
const STAGE_STYLE = {
  "--stage-w": STAGE_W,
  width: "var(--stage-w)",
  height: STAGE_H,
  left: offset("100vw", "var(--stage-w)", (SAFE.x0 + SAFE.x1) / 2),
  top: offset("100dvh", STAGE_H, (SAFE.y0 + SAFE.y1) / 2),
} as React.CSSProperties;

// Same approved panel as /signup/barber (barber-signup-panel-v1.webp,
// native 1399x1124, unedited): its painted splatter/glow frame is the
// panel's frame layer, with the reference's own baked text/controls
// masked out (display mask only) and the real form in their place.
// PANEL_BOX maps the frame's opaque extent (x237-1167, y61-1075 in
// reference px) to x507-1127, y156-833 of the background — same scale
// as /signup/barber (+15%, uniform 0.6677, no distortion), nudged 38px
// left of the wall centre so it clears POLAR's cape (left edge x~1138).
const PANEL_BOX = { left: "20.83%", top: "12.23%", width: "55.87%" };

// Panel sizes are written in the reference's own pixels and converted
// to cqw of the panel box (reference width = 100cqw).
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

const HOLES: [number, number, number, number][] = [
  [580, 98, 240, 162], // logo
  [522, 276, 360, 46], // portal label
  [352, 322, 700, 134], // title + subtitle
  [266, 456, 872, 542], // sections, consent, button
  [512, 1003, 380, 50], // log in line
];
const MASK_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1399 1124' preserveAspectRatio='none'><filter id='f' x='-5%' y='-5%' width='110%' height='110%'><feGaussianBlur stdDeviation='4'/></filter><path filter='url(#f)' fill='#fff' fill-rule='evenodd' d='M-60 -60H1459V1184H-60Z ${HOLES.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h${-w}Z`).join(" ")}'/></svg>`;
const MASK_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(MASK_SVG)}")`;
const PANEL_FILL = "linear-gradient(180deg, #01132a 0%, #001127 55%, #001740 100%)";

const CYAN = "#00d9ee";
const LINK = "#00ebf5";

function ClientScene({ children }: { children: React.ReactNode }) {
  return (
    <main className={`${nunito.className} relative hidden h-[100dvh] overflow-hidden bg-navy sm:block`}>
      <div className="absolute" style={STAGE_STYLE}>
        <Image
          src="/signup/create-account-client-v4.webp"
          alt="POLAR seated in the barber chair wearing a cape. Client Portal — create your account."
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

const PANEL_INPUT_CLASS =
  "w-full border border-[#0560a0] bg-[#021027] text-white outline-none placeholder:text-white/40 focus:border-[#00d9ee] transition";
const PANEL_INPUT_STYLE: React.CSSProperties = { padding: `${r(15)} ${r(20)}`, fontSize: fs(24), borderWidth: r(2), borderRadius: r(12) };
const PANEL_LABEL_STYLE: React.CSSProperties = { fontSize: fs(21), marginBottom: r(8) };

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
        <span
          className={`block shrink-0 text-[#0ab0ff] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ height: r(72), width: r(72) }}
        >
          <ChevronDownIcon className="h-full w-full [stroke-width:2.1]" />
        </span>
      </button>
      {/* grid-template-rows 0fr/1fr: animates smoothly and keeps every
          required field present in the form's layout while collapsed. */}
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

export default function ClientSignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openSections, setOpenSections] = useState({ personal: false, address: false });

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

      {/* Desktop — background v4 shown in full, with the same approved
          splatter panel as /signup/barber (see ClientScene). Fixed
          header + a single internally-scrollable region holding the
          sections, consent and the submit button. Fields, names,
          placeholders, validation and signUpClient() are unchanged —
          they are only grouped into the approved accordion sections. */}
      <ClientScene>
        <div className="absolute" style={{ left: r(536), top: r(96.5), width: r(331), aspectRatio: "1774 / 887" }}>
          <Image src="/login/login-logo.png" alt="POLAR London" fill sizes="20vw" className="object-contain" priority />
        </div>
        <p
          className="absolute inset-x-0 text-center font-bold uppercase"
          style={{ top: r(284), fontSize: fs(28), lineHeight: 1, letterSpacing: "0.28em", paddingLeft: "0.28em", color: "#08c6f2" }}
        >
          Client Portal
        </p>
        <h1 className="absolute inset-x-0 text-center font-extrabold text-white" style={{ top: r(326), fontSize: fs(70), lineHeight: 1, letterSpacing: "-0.005em" }}>
          Create <span style={{ color: "#06cdfb" }}>your</span> account
        </h1>
        <p className="absolute inset-x-0 text-center text-white/90" style={{ top: r(409), fontSize: fs(29), lineHeight: 1.1 }}>
          Quick and easy. Get started in seconds.
        </p>

        {/* client-scroll: thin POLAR-tinted scrollbar; polar-check: the
            approved cyan outlined checkbox (still a native checkbox —
            required/validation/keyboard unchanged). Sizes in cqw =
            reference px. */}
        <style jsx global>{`
          .client-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(91, 155, 255, 0.5) transparent;
          }
          .client-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .client-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .client-scroll::-webkit-scrollbar-thumb {
            background-color: rgba(91, 155, 255, 0.5);
            border-radius: 999px;
          }
          .client-scroll::-webkit-scrollbar-thumb:hover {
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
          className="client-scroll absolute flex flex-col overflow-y-auto overscroll-contain"
          style={{ left: r(270), top: r(460), width: r(864), height: r(542), padding: `${r(6)} ${r(9)} ${r(8)}` }}
        >
          <form onSubmit={handleSubmit} className="my-auto flex flex-col" style={{ gap: r(11) }}>
            <Section
              icon={<UserIcon className="h-full w-full [stroke-width:1.9]" />}
              title="Personal Details"
              subtitle="Your account information"
              open={openSections.personal}
              onToggle={() => toggleSection("personal")}
            >
              <label className="block">
                <span className="block text-white/80" style={PANEL_LABEL_STYLE}>
                  Full Name <span className="text-magenta">*</span>
                </span>
                <input name="full_name" type="text" required placeholder="Ahmed Muhomed" onInvalid={() => openSection("personal")} className={PANEL_INPUT_CLASS} style={PANEL_INPUT_STYLE} />
              </label>

              <div>
                <span className="block text-white/80" style={PANEL_LABEL_STYLE}>
                  Phone Number <span className="text-magenta">*</span>
                </span>
                <div className="flex" style={{ gap: r(12) }}>
                  <div
                    aria-hidden="true"
                    className="flex shrink-0 items-center border border-[#0560a0] bg-[#021027] text-white/80"
                    style={{ ...PANEL_INPUT_STYLE, gap: r(8) }}
                  >
                    <span>🇬🇧</span>
                    <span>+44</span>
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="e.g. 7700 900123"
                    onInvalid={() => openSection("personal")}
                    className={`${PANEL_INPUT_CLASS} flex-1`}
                    style={PANEL_INPUT_STYLE}
                  />
                </div>
              </div>

              <label className="block">
                <span className="block text-white/80" style={PANEL_LABEL_STYLE}>
                  Email <span className="text-magenta">*</span>
                </span>
                <input name="email" type="email" required placeholder="e.g. you@example.com" onInvalid={() => openSection("personal")} className={PANEL_INPUT_CLASS} style={PANEL_INPUT_STYLE} />
              </label>

              <label className="block">
                <span className="block text-white/80" style={PANEL_LABEL_STYLE}>
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
                    className={PANEL_INPUT_CLASS}
                    style={{ ...PANEL_INPUT_STYLE, paddingRight: "10%" }}
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
              icon={<PinIcon className="h-full w-full [stroke-width:1.9]" />}
              title="Address"
              subtitle="Optional — you can add this later"
              open={openSections.address}
              onToggle={() => toggleSection("address")}
            >
              <label className="block">
                <span className="block text-white/80" style={PANEL_LABEL_STYLE}>
                  Address (optional)
                </span>
                <div className="relative">
                  <input
                    name="address"
                    type="text"
                    placeholder="Start typing your address..."
                    className={PANEL_INPUT_CLASS}
                    style={{ ...PANEL_INPUT_STYLE, paddingRight: "10%" }}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-[3%] flex items-center text-white/40">
                    <span className="block" style={{ height: r(26), width: r(26) }}>
                      <SearchIcon className="h-full w-full" />
                    </span>
                  </span>
                </div>
                <p className="text-white/50" style={{ marginTop: r(8), fontSize: fs(19) }}>
                  We&rsquo;ll suggest matching addresses as you type.
                </p>
              </label>
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
      </ClientScene>
    </>
  );
}
