"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { login } from "@/lib/actions/auth";

// New mastered login scene (LOGIN-DUMMY-PAGE.png, converted to WebP) —
// the mascot presenting a large blank tablet, replacing the old
// three-layer background+hands+tablet composite. Rendered as-is, never
// redesigned/cropped/altered. Same native 1672x941 canvas the old
// asset used, so no downstream ratio math changes. Only one real
// thing is added on top: the actual login form, positioned inside the
// tablet's own screen area — nothing is baked onto the artwork.
const CANVAS_ASPECT = "1672 / 941";

// The safe UI zone inside the tablet screen. NOT the screen's full
// geometric bounds — two of its four corners are genuinely obscured
// in the photo itself (the mascot's left paw grips over the top-left,
// its sleeve drapes over the top-right), the crown watermark is baked
// into the top-centre of the screen, and paint-splatter decoration
// occupies all four corners. This box is the largest axis-aligned
// rectangle that stays clear of all of that — measured by cropping
// candidate boxes directly out of the source artwork and visually
// confirming each was clean, iterating until verified empty. The
// panel below is deliberately NOT rotated to match the tablet's own
// slight perspective tilt: the safe zone sits centred well inside the
// screen without touching any tilted edge, so an upright, fully
// readable/undistorted form reads as sitting "in" the screen just as
// well as a corner-pinned one would, without the usability risk of
// rotating real form controls.
const UI_SCREEN_BOX = { left: "33.19%", top: "45.70%", width: "27.51%", height: "23.91%" };

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
      {/* Mobile — the new artwork was supplied/scoped for desktop only
          (a wide landscape mascot+tablet composition; cropping it down
          to a phone-portrait frame would either hide the tablet screen
          entirely or crop the mascot oddly, neither of which is "the
          same design, smaller"), so mobile keeps its existing
          no-artwork approach rather than forcing the desktop scene
          onto it. Restyled to the same restrained navy/cyan palette as
          the new desktop design for visual consistency, but every
          field/action/route below is identical to what was already
          here. */}
      <main className="flex min-h-screen flex-col justify-center bg-navy px-6 py-16 sm:hidden">
        <div className="mx-auto w-full max-w-sm">
          <p className="text-center font-display text-xl tracking-[0.03em] text-ice-100">WELCOME BACK</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-royal-light/70">
                <EnvelopeIcon className="h-4 w-4" />
              </span>
              <input
                name="email"
                type="email"
                required
                placeholder="Email Address"
                className="w-full rounded-md border border-ice-glow/25 bg-navy-light/50 py-3 pl-10 pr-3 text-sm text-ice-100 outline-none placeholder:text-royal-light/40 focus:border-ice-glow/70"
              />
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-royal-light/70">
                <LockIcon className="h-4 w-4" />
              </span>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                className="w-full rounded-md border border-ice-glow/25 bg-navy-light/50 py-3 pl-10 pr-10 text-sm text-ice-100 outline-none placeholder:text-royal-light/40 focus:border-magenta/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-white"
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>

            {error && <p className="text-sm text-magenta">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-royal py-3 text-center font-display text-sm tracking-[0.1em] text-white disabled:opacity-60"
            >
              {pending ? "LOGGING IN…" : "LOG IN"}
              {!pending && <ArrowIcon className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-white/50">
            New to POLAR?{" "}
            <Link href="/signup" className="text-royal-light underline">
              Create Account
            </Link>
          </p>
        </div>
      </main>

      {/* Desktop — same crop-to-fill wrapper technique proven on
          /signup: `width: max(100%, calc(100dvh * ratio))` (not a plain
          `w-full`) plus `shrink-0` (this box is a flex child; without
          shrink-0 the default flex-shrink:1 silently re-compresses it
          back down to fit the container, undoing the max() overflow —
          confirmed the hard way on /signup before this exact fix). The
          composition always fills the viewport edge-to-edge on
          whichever axis is the binding one and crops the other
          symmetrically — never a gap, never distorted, exact 1672:941
          shape preserved on every screen. */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative aspect-[1672/941] shrink-0" style={{ width: `max(100%, calc(100dvh * ${CANVAS_ASPECT}))` }}>
            <Image
              src="/login/login-scene-v2.webp"
              alt="POLAR — the mascot presenting a tablet. Log in to continue."
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />

            {/* Real login UI, strictly clipped to the verified-safe
                screen box: overflow-hidden here is a hard guarantee
                nothing can ever paint over the tablet bezel, the
                mascot, or the background, regardless of content
                length. */}
            <div className="absolute overflow-hidden rounded-[2%]" style={UI_SCREEN_BOX}>
              {/* Restrained atmosphere glow — the artwork's own screen
                  is already near-black here (verified), so this is a
                  light touch for depth, not something the text relies
                  on for contrast. Masked to fade out well before the
                  box edges so it reads as part of the tablet's own
                  display, not a separate panel. */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(58,102,255,0.16), transparent 72%)",
                  WebkitMaskImage: "radial-gradient(ellipse 82% 82% at 50% 50%, black 45%, transparent 92%)",
                  maskImage: "radial-gradient(ellipse 82% 82% at 50% 50%, black 45%, transparent 92%)",
                }}
              />

              <div className="relative flex h-full w-full flex-col items-center justify-center px-[6%]">
                <p className="font-display text-[0.95vw] tracking-[0.04em] text-ice-100 drop-shadow-[0_0_8px_rgba(91,155,255,0.5)]">
                  WELCOME BACK
                </p>

                <form onSubmit={handleSubmit} className="mt-[0.6vw] w-full">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-[4%] flex items-center text-royal-light/70">
                      <EnvelopeIcon className="h-[0.85vw] w-[0.85vw]" />
                    </span>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="Email Address"
                      className="polar-input w-full rounded-md border border-ice-glow/25 bg-navy-light/40 py-[0.48vw] pl-[13%] pr-[4%] text-[0.66vw] text-ice-100 outline-none backdrop-blur-md placeholder:text-royal-light/40 transition focus:border-ice-glow/70 focus:bg-navy-light/55"
                    />
                  </div>

                  <div className="relative mt-[0.42vw]">
                    <span className="pointer-events-none absolute inset-y-0 left-[4%] flex items-center text-royal-light/70">
                      <LockIcon className="h-[0.85vw] w-[0.85vw]" />
                    </span>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Password"
                      className="polar-input w-full rounded-md border border-ice-glow/25 bg-navy-light/40 py-[0.48vw] pl-[13%] pr-[13%] text-[0.66vw] text-ice-100 outline-none backdrop-blur-md placeholder:text-royal-light/40 transition focus:border-magenta/40 focus:bg-navy-light/55"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-[4%] flex items-center text-white/40 hover:text-white"
                    >
                      {showPassword ? <EyeOffIcon className="h-[0.85vw] w-[0.85vw]" /> : <EyeIcon className="h-[0.85vw] w-[0.85vw]" />}
                    </button>
                  </div>

                  {error && <p className="mt-[0.35vw] text-[0.55vw] text-magenta">{error}</p>}

                  <button
                    type="submit"
                    disabled={pending}
                    className="mt-[0.55vw] flex w-full items-center justify-center gap-2 rounded-md bg-royal py-[0.48vw] font-display text-[0.66vw] tracking-[0.12em] text-white shadow-[0_0_0_1px_rgba(91,155,255,0.5),0_0_14px_-2px_rgba(91,155,255,0.85)] transition hover:bg-royal-dark disabled:opacity-60"
                  >
                    {pending ? "LOGGING IN…" : "LOG IN"}
                    {!pending && <ArrowIcon className="h-[0.6vw] w-[0.6vw]" />}
                  </button>
                </form>

                <p className="mt-[0.55vw] text-[0.58vw] text-white/50">
                  New to POLAR?{" "}
                  <Link href="/signup" className="text-royal-light underline">
                    Create Account
                  </Link>
                </p>
              </div>

              {/* Chrome/Edge autofill paints its own opaque background
                  + black text, overriding the classes above — force it
                  back to the same translucent icy-navy glass treatment
                  so autofilled fields never flash white. */}
              <style jsx global>{`
                .polar-input:-webkit-autofill,
                .polar-input:-webkit-autofill:hover,
                .polar-input:-webkit-autofill:focus,
                .polar-input:-webkit-autofill:active {
                  -webkit-text-fill-color: #e4f2ff;
                  caret-color: #e4f2ff;
                  -webkit-box-shadow: 0 0 0 1000px rgba(17, 27, 58, 0.75) inset;
                  box-shadow: 0 0 0 1000px rgba(17, 27, 58, 0.75) inset;
                  transition: background-color 9999s ease-in-out 0s;
                }
              `}</style>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
