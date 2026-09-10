"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { login } from "@/lib/actions/auth";

// Three independently-controllable layers, each its own absolutely
// positioned wrapper with its own scale/position constants — per
// instruction, so e.g. "make the tablet 10% larger" or "make the
// login UI 8% larger" only ever touches one block below, never the
// others. All three assets/coordinates are measured against the same
// 1672x941 canvas the rest of the desktop pages already use.

// Layer 1 — background room (public/login/login-background.png).
const BG_WRAPPER = { left: "0%", top: "0%", width: "100%", height: "100%" };

// Layer 2 — POLAR POV hands + blank tablet
// (public/login/login-tablet.png). Same canvas as the background, so
// it defaults to the same full-bleed framing; adjust independently
// by changing only this box. TABLET_SCALE is a pure size reduction
// applied via transform (scaled around the box's own centre, not an
// inset), which keeps the same centre alignment/perspective/general
// vertical position while revealing more background around it —
// changing only this one number is enough to resize it further.
const TABLET_WRAPPER = { left: "0%", top: "0%", width: "100%", height: "100%" };
const TABLET_SCALE = 0.94;

// Layer 3 — the real login UI, positioned inside the tablet's own
// screen area (measured directly against login-tablet.png: the
// screen spans roughly x[420,1255] y[151,699] out of 1672x941).
// Inset further in from that so every control stays clear of where
// the thumbs overlap the screen, AND overflow-hidden below is a hard
// clip — nothing belonging to Layer 3 can ever paint outside this
// box (bezel/hands/background), regardless of content length.
// UI_SCALE grows/shrinks the whole form around its own centre
// without moving the tablet itself.
const UI_SCREEN_BOX = { left: "31%", top: "21%", width: "38%", height: "50%" };
const UI_SCALE = 1;

// Layer 4 — official POLAR LONDON logo PNG (public/login/login-logo.png),
// used exactly as supplied. Independent box so its position/size can be
// tuned later without touching any other layer. Height is driven by the
// asset's own aspect ratio (not a fixed %) so object-contain never
// crops or distorts it.
const LOGO_WRAPPER = { left: "4%", top: "5%", width: "15%" };
const LOGO_ASPECT = "1774 / 887";

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 118 0v4" />
    </svg>
  );
}
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.6 10.6 0 0112 5c6.4 0 10 7 10 7a17.6 17.6 0 01-3.6 4.6M6.5 6.6C4 8.3 2 12 2 12s3.6 7 10 7a10.4 10.4 0 004-.8" />
      <path d="M9.5 9.6a3 3 0 004 4" />
    </svg>
  );
}
function CrownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8zm2 12h14v2H5v-2z" />
    </svg>
  );
}
function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <>
      {/* Mobile — simple functional placeholder. The mastered POLAR
          POV tablet design is desktop-only for this pass; mobile is
          separate, upcoming work. */}
      <main className="mx-auto max-w-md px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">Log in to POLAR</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-polar-text">Email</span>
            <input name="email" type="email" required className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-polar-text">Password</span>
            <input name="password" type="password" required className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text" />
          </label>

          {error && <p className="text-sm text-polar-danger">{error}</p>}

          <button type="submit" disabled={pending} className="w-full rounded bg-polar-primary py-3 text-center text-sm font-semibold text-white disabled:opacity-60">
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-sm text-polar-muted">
          New client?{" "}
          <Link className="underline" href="/signup/client">Create an account</Link>
        </p>
        <p className="mt-1 text-sm text-polar-muted">
          Barber applying for V1?{" "}
          <Link className="underline" href="/signup/barber">Barber sign-up</Link>
        </p>
      </main>

      {/* Desktop — three independently-positioned layers: background
          room, POLAR POV hands + tablet, and the real login UI
          rendered inside the tablet's screen. Neither PNG is
          recreated in CSS and no fake form is baked onto the tablet —
          every control below is real, wired to the existing login()
          action unchanged. */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full aspect-[1672/941]">
            {/* Layer 1 — background */}
            <div className="absolute" style={BG_WRAPPER}>
              <Image
                src="/login/login-background.png"
                alt=""
                fill
                priority
                className="object-cover"
                aria-hidden="true"
              />
            </div>

            {/* Layer 2 — POLAR POV hands + tablet. The scale wrapper
                is `relative` (not just transformed) so Layer 3 below,
                positioned absolutely against it, unambiguously scales
                and stays aligned with the tablet as one unit. */}
            <div className="absolute" style={TABLET_WRAPPER}>
              <div
                className="relative h-full w-full"
                style={{ transform: `scale(${TABLET_SCALE})`, transformOrigin: "center" }}
              >
                <Image
                  src="/login/login-tablet.png"
                  alt=""
                  fill
                  priority
                  className="object-cover"
                  aria-hidden="true"
                />

                {/* Layer 3 — real login UI, strictly clipped to the
                    tablet screen: overflow-hidden here is a hard
                    guarantee nothing can ever paint over the bezel,
                    hands or background, regardless of content
                    length. */}
                <div className="absolute flex flex-col overflow-hidden" style={UI_SCREEN_BOX}>
                  {/* Atmosphere — restrained navy/royal-blue/magenta glow,
                      masked to fade to fully transparent well before the
                      box edges so it reads as part of the tablet's own
                      display rather than a separate rectangular panel. No
                      flat edge-to-edge fill here on purpose — at the box
                      boundary this layer is invisible, letting the
                      tablet's own screen show through directly. */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse 85% 65% at 28% 8%, rgba(58,102,255,0.22), transparent 65%), radial-gradient(ellipse 55% 45% at 100% 100%, rgba(255,61,154,0.10), transparent 70%), radial-gradient(ellipse 110% 95% at 50% 50%, rgba(6,10,24,0.5), transparent 88%)",
                      WebkitMaskImage: "radial-gradient(ellipse 78% 78% at 50% 50%, black 45%, transparent 92%)",
                      maskImage: "radial-gradient(ellipse 78% 78% at 50% 50%, black 45%, transparent 92%)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.05]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(115deg, rgba(190,215,255,0.9) 0px, rgba(190,215,255,0.9) 1px, transparent 1px, transparent 16px)",
                      WebkitMaskImage: "radial-gradient(ellipse 68% 68% at 50% 50%, black 35%, transparent 88%)",
                      maskImage: "radial-gradient(ellipse 68% 68% at 50% 50%, black 35%, transparent 88%)",
                    }}
                  />

                  <div
                    className="relative flex h-full w-full flex-col items-center justify-center px-[7%]"
                    style={{ transform: `scale(${UI_SCALE})`, transformOrigin: "center" }}
                  >
                    <p className="font-display text-[1.3vw] tracking-[0.03em] text-ice-100 drop-shadow-[0_0_10px_rgba(91,155,255,0.45)]">WELCOME BACK</p>
                    <p className="mt-[0.3vw] text-[0.78vw] text-white/50">Log in to continue.</p>

                    <form onSubmit={handleSubmit} className="mt-[1.6vw] w-full">
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-[4%] flex items-center text-royal-light/70">
                          <EnvelopeIcon className="h-[1vw] w-[1vw]" />
                        </span>
                        <input
                          name="email"
                          type="email"
                          required
                          placeholder="Email Address"
                          className="w-full rounded-md border border-ice-glow/25 bg-navy-light/30 py-[0.85vw] pl-[11%] pr-[4%] text-[0.85vw] text-ice-100 shadow-[0_0_10px_-6px_rgba(127,209,255,0.6)] outline-none backdrop-blur-md placeholder:text-royal-light/40 transition focus:border-ice-glow/70 focus:bg-navy-light/40 focus:shadow-[0_0_0_1px_rgba(127,209,255,0.4),0_0_18px_-4px_rgba(91,155,255,0.65)]"
                        />
                      </div>

                      <div className="relative mt-[0.9vw]">
                        <span className="pointer-events-none absolute inset-y-0 left-[4%] flex items-center text-royal-light/70">
                          <LockIcon className="h-[1vw] w-[1vw]" />
                        </span>
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="Password"
                          className="w-full rounded-md border border-ice-glow/25 bg-navy-light/30 py-[0.85vw] pl-[11%] pr-[11%] text-[0.85vw] text-ice-100 shadow-[0_0_10px_-6px_rgba(127,209,255,0.6)] outline-none backdrop-blur-md placeholder:text-royal-light/40 transition focus:border-magenta/50 focus:bg-navy-light/40 focus:shadow-[0_0_0_1px_rgba(255,61,154,0.35),0_0_18px_-4px_rgba(91,155,255,0.65)]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute inset-y-0 right-[4%] flex items-center text-white/40 hover:text-white"
                        >
                          {showPassword ? <EyeOffIcon className="h-[1vw] w-[1vw]" /> : <EyeIcon className="h-[1vw] w-[1vw]" />}
                        </button>
                      </div>

                      {error && <p className="mt-[0.5vw] text-[0.72vw] text-magenta">{error}</p>}

                      <button
                        type="submit"
                        disabled={pending}
                        className="mt-[1vw] flex w-full items-center justify-center gap-2 rounded-md bg-royal py-[0.85vw] font-display text-[0.85vw] tracking-[0.15em] text-white shadow-[0_0_0_1px_rgba(91,155,255,0.5),0_0_18px_-2px_rgba(91,155,255,0.85)] transition hover:bg-royal-dark disabled:opacity-60"
                      >
                        {pending ? "LOGGING IN…" : "LOG IN"}
                        {!pending && <ArrowIcon className="h-[0.9vw] w-[0.9vw]" />}
                      </button>
                    </form>

                    <p className="mt-[0.9vw] text-[0.72vw] text-white/35">Forgot password?</p>

                    <div className="mt-[1.5vw] flex w-full items-center gap-2">
                      <div className="h-px flex-1 bg-white/10" />
                      <CrownIcon className="h-[0.75vw] w-[0.75vw] text-white/25" />
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <p className="mt-[1.1vw] text-[0.78vw] text-white/50">
                      New to POLAR?{" "}
                      <Link href="/signup" className="text-royal-light underline">
                        Create Account
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 4 — official logo PNG, independent of every other
                layer, drawn on top of both the background and the
                tablet so it always reads as page branding. */}
            <div
              className="absolute"
              style={{ left: LOGO_WRAPPER.left, top: LOGO_WRAPPER.top, width: LOGO_WRAPPER.width, aspectRatio: LOGO_ASPECT }}
            >
              <Image
                src="/login/login-logo.png"
                alt="POLAR London"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
