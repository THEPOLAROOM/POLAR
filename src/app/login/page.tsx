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
// by changing only this box.
const TABLET_WRAPPER = { left: "0%", top: "0%", width: "100%", height: "100%" };

// Layer 3 — the real login UI, positioned inside the tablet's own
// screen area (measured directly against login-tablet.png: the
// screen spans roughly x[420,1255] y[151,699] out of 1672x941; inset
// further so every control stays clear of where the thumbs overlap
// the screen around mid-height). UI_SCALE grows/shrinks the whole
// form around its own centre without moving the tablet itself.
const UI_SCREEN_BOX = { left: "30%", top: "19%", width: "40%", height: "52%" };
const UI_SCALE = 1;

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

            {/* Layer 2 — POLAR POV hands + tablet */}
            <div className="absolute" style={TABLET_WRAPPER}>
              <Image
                src="/login/login-tablet.png"
                alt=""
                fill
                priority
                className="object-cover"
                aria-hidden="true"
              />

              {/* Layer 3 — real login UI, inside the tablet screen */}
              <div className="absolute flex flex-col" style={UI_SCREEN_BOX}>
                <div
                  className="flex h-full w-full flex-col items-center justify-center px-[6%]"
                  style={{ transform: `scale(${UI_SCALE})`, transformOrigin: "center" }}
                >
                  <CrownIcon className="h-[6%] w-[6%] text-royal-light" />
                  <p className="mt-[2%] font-display text-[2.6vw] leading-none tracking-wide text-white">POLAR</p>
                  <p className="mt-[0.6%] text-[0.7vw] tracking-[0.3em] text-white/60">LONDON</p>

                  <p className="mt-[5%] text-[1.35vw] font-semibold tracking-wide text-white">WELCOME BACK</p>
                  <p className="mt-[0.6%] text-[0.85vw] text-white/50">Log in to continue.</p>

                  <form onSubmit={handleSubmit} className="mt-[6%] w-full space-y-[3%]">
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-[4%] flex items-center text-white/40">
                        <EnvelopeIcon className="h-[1.1vw] w-[1.1vw]" />
                      </span>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="Email Address"
                        className="w-full rounded-md border border-white/15 bg-white/5 py-[2.6%] pl-[11%] pr-[4%] text-[0.9vw] text-white outline-none placeholder:text-white/40 focus:border-royal-light"
                      />
                    </div>

                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-[4%] flex items-center text-white/40">
                        <LockIcon className="h-[1.1vw] w-[1.1vw]" />
                      </span>
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Password"
                        className="w-full rounded-md border border-white/15 bg-white/5 py-[2.6%] pl-[11%] pr-[11%] text-[0.9vw] text-white outline-none placeholder:text-white/40 focus:border-royal-light"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-[4%] flex items-center text-white/40 hover:text-white"
                      >
                        {showPassword ? <EyeOffIcon className="h-[1.1vw] w-[1.1vw]" /> : <EyeIcon className="h-[1.1vw] w-[1.1vw]" />}
                      </button>
                    </div>

                    {error && <p className="text-[0.8vw] text-magenta">{error}</p>}

                    <button
                      type="submit"
                      disabled={pending}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-royal py-[2.6%] text-[0.95vw] font-bold uppercase tracking-widest text-white shadow-[0_0_25px_-4px_rgba(11,95,255,0.8)] transition hover:bg-royal-dark disabled:opacity-60"
                    >
                      {pending ? "Logging in…" : "Log in"}
                      {!pending && <ArrowIcon className="h-[1vw] w-[1vw]" />}
                    </button>
                  </form>

                  <p className="mt-[3%] text-[0.8vw] text-white/40">Forgot password?</p>

                  <div className="mt-[5%] flex w-full items-center gap-3">
                    <div className="h-px flex-1 bg-white/15" />
                    <CrownIcon className="h-[1vw] w-[1vw] text-white/30" />
                    <div className="h-px flex-1 bg-white/15" />
                  </div>

                  <p className="mt-[4%] text-[0.85vw] text-white/60">
                    New to POLAR?{" "}
                    <Link href="/signup" className="text-royal-light underline">
                      Create Account
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
