"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { login } from "@/lib/actions/auth";

// Login scene v3 — same mascot+tablet composition as v2, with clothing
// recoloured to POLAR navy and unbranded footwear. Rendered as-is,
// never redesigned/cropped/altered. Same native 1672x941 canvas the
// prior asset used, so no downstream ratio math changes.
const CANVAS_ASPECT = "1672 / 941";

// The tablet screen's actual four corners, pixel-picked directly off
// the source photo (native 1672x941), expressed as fractions of the
// frame. The screen is a skewed quadrilateral (camera perspective),
// not an axis-aligned rectangle — TL/TR are partly gripped by the
// mascot's paw/sleeve, the other two corners are clean.
const SCREEN_CORNERS = {
  tl: [462 / 1672, 223 / 941],
  tr: [1210 / 1672, 363 / 941],
  br: [1255 / 1672, 850 / 941],
  bl: [313 / 1672, 707 / 941],
} as const;

const pct = ([x, y]: readonly [number, number]) => `${(x * 100).toFixed(3)}% ${(y * 100).toFixed(3)}%`;
// Hard guarantee nothing (glow, border-radius, blur) can ever paint
// outside the glass, independent of the transform math below.
const CLIP_PATH = `polygon(${pct(SCREEN_CORNERS.tl)}, ${pct(SCREEN_CORNERS.tr)}, ${pct(SCREEN_CORNERS.br)}, ${pct(SCREEN_CORNERS.bl)})`;

// A reference panel size the visual design below was tuned at; the
// live pixel width (from ResizeObserver) divided by this gives a
// single `scale` factor used to size type/icons/gaps so the form
// reads correctly at any viewport width, not just one fixed size.
const DESIGN_WIDTH = 615;

/**
 * Heckbert "square-to-quad" projective mapping, generalized to an
 * arbitrary source rect (0,0)-(W,0)-(W,H)-(0,H), expressed directly as
 * a CSS matrix3d. CSS's matrix3d does a real per-vertex perspective
 * divide (x/w, y/w), which is exactly what a 2D homography needs — so
 * this reproduces the four target corners exactly, not an
 * approximation of the tablet's rotation/skew.
 */
function quadMatrix3d(width: number, height: number, quad: [number, number][]): string {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const denom = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / denom;
  const h = (dx1 * dy3 - dx3 * dy1) / denom;

  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const c = x0;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  const f = y0;

  const a2 = a / width, b2 = b / height;
  const d2 = d / width, e2 = e / height;
  const g2 = g / width, h2 = h / height;

  return `matrix3d(${a2}, ${d2}, 0, ${g2}, ${b2}, ${e2}, 0, ${h2}, 0, 0, 1, 0, ${c}, ${f}, 0, 1)`;
}

const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Tracks an element's live rendered size, so the perspective math
 * below stays correct as the viewport (and therefore the tablet
 * photo's rendered size) changes — this is what makes the overlay
 * responsive instead of pinned to one fixed stage width. */
function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

type IconProps = { className?: string; style?: React.CSSProperties };

function EnvelopeIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function LockIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 118 0v4" />
    </svg>
  );
}
function EyeIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.6 10.6 0 0112 5c6.4 0 10 7 10 7a17.6 17.6 0 01-3.6 4.6M6.5 6.6C4 8.3 2 12 2 12s3.6 7 10 7a10.4 10.4 0 004-.8" />
      <path d="M9.5 9.6a3 3 0 004 4" />
    </svg>
  );
}
function ArrowIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stageRef, stageSize] = useElementSize<HTMLDivElement>();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await login(formData);
    setPending(false);
    if (result && "error" in result) setError(result.error);
  }

  let panelStyle: React.CSSProperties | null = null;
  let scale = 1;
  if (stageSize) {
    const cornerPx = (Object.keys(SCREEN_CORNERS) as (keyof typeof SCREEN_CORNERS)[]).reduce(
      (acc, k) => ({ ...acc, [k]: [SCREEN_CORNERS[k][0] * stageSize.width, SCREEN_CORNERS[k][1] * stageSize.height] }),
      {} as Record<keyof typeof SCREEN_CORNERS, [number, number]>
    );
    const panelW = (dist(cornerPx.tl, cornerPx.tr) + dist(cornerPx.bl, cornerPx.br)) / 2;
    const panelH = (dist(cornerPx.tl, cornerPx.bl) + dist(cornerPx.tr, cornerPx.br)) / 2;
    scale = panelW / DESIGN_WIDTH;
    panelStyle = {
      width: panelW,
      height: panelH,
      transformOrigin: "0 0",
      transform: quadMatrix3d(panelW, panelH, [cornerPx.tl, cornerPx.tr, cornerPx.br, cornerPx.bl]),
    };
  }
  const px = (n: number) => n * scale;

  return (
    <>
      {/* Mobile — the artwork is scoped for desktop only (a wide
          landscape mascot+tablet composition; cropping it down to a
          phone-portrait frame would either hide the tablet screen
          entirely or crop the mascot oddly), so mobile keeps its
          existing no-artwork approach. Restyled to the same
          navy/cyan/pink palette for visual consistency, but every
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
                autoComplete="email"
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
                autoComplete="current-password"
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

            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-royal-light underline">
                Forgot password?
              </Link>
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
          /signup: `width: max(100%, calc(100dvh * ratio))` (not a
          plain `w-full`) plus `shrink-0`, so the composition always
          fills the viewport edge-to-edge on whichever axis is the
          binding one and crops the other symmetrically. `stageRef`
          measures this box's own rendered size every time it changes
          (resize, zoom, DPR) so the perspective math below tracks the
          photo at any viewport width instead of one fixed size. */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div ref={stageRef} className="relative aspect-[1672/941] shrink-0" style={{ width: `max(100%, calc(100dvh * ${CANVAS_ASPECT}))` }}>
            <Image
              src="/login/login-scene-v3.webp"
              alt="POLAR — the mascot presenting a tablet. Log in to continue."
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />

            {/* Clipped to the screen's real quadrilateral — nothing
                can ever paint over the tablet bezel, the mascot, or
                the background, regardless of content length or the
                transform math below. */}
            <div className="absolute inset-0" style={{ clipPath: CLIP_PATH }}>
              {panelStyle && (
                <div className="absolute left-0 top-0 overflow-hidden" style={panelStyle}>
                  {/* No panel background — the tablet's own near-black
                      screen is the form's real backdrop. Fields are
                      transparent glass defined by glow/border only, so
                      the artwork stays visible underneath. */}
                  <div className="flex h-full w-full flex-col items-center justify-center" style={{ padding: `0 ${px(9)}%` }}>
                    <p
                      className="font-display font-bold uppercase text-white"
                      style={{ fontSize: px(24), letterSpacing: "0.12em", textShadow: "0 0 10px rgba(56,189,248,0.85)" }}
                    >
                      Welcome Back
                    </p>

                    <form onSubmit={handleSubmit} className="mt-[3%] w-full" style={{ marginTop: px(12) }}>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-[4%] flex items-center text-cyan-300/80">
                          <EnvelopeIcon style={{ height: px(15), width: px(15) }} />
                        </span>
                        <input
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          placeholder="Email Address"
                          className="polar-input w-full border bg-transparent text-white outline-none placeholder:text-white/40 transition focus:bg-white/[0.04]"
                          style={{
                            borderRadius: px(4),
                            borderColor: "rgba(34,228,255,0.55)",
                            paddingTop: px(10),
                            paddingBottom: px(10),
                            paddingLeft: "13%",
                            paddingRight: "4%",
                            fontSize: px(14),
                            boxShadow: "0 0 10px -3px rgba(34,228,255,0.7)",
                          }}
                        />
                      </div>

                      <div className="relative" style={{ marginTop: px(9) }}>
                        <span className="pointer-events-none absolute inset-y-0 left-[4%] flex items-center text-pink-300/80">
                          <LockIcon style={{ height: px(15), width: px(15) }} />
                        </span>
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          placeholder="Password"
                          className="polar-input w-full border bg-transparent text-white outline-none placeholder:text-white/40 transition focus:bg-white/[0.04]"
                          style={{
                            borderRadius: px(4),
                            borderColor: "rgba(255,47,192,0.55)",
                            paddingTop: px(10),
                            paddingBottom: px(10),
                            paddingLeft: "13%",
                            paddingRight: "13%",
                            fontSize: px(14),
                            boxShadow: "0 0 10px -3px rgba(255,47,192,0.7)",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute inset-y-0 right-[4%] flex items-center text-white/50 hover:text-white"
                        >
                          {showPassword ? (
                            <EyeOffIcon style={{ height: px(15), width: px(15) }} />
                          ) : (
                            <EyeIcon style={{ height: px(15), width: px(15) }} />
                          )}
                        </button>
                      </div>

                      <div className="text-right" style={{ marginTop: px(6) }}>
                        <Link
                          href="/forgot-password"
                          className="text-cyan-200/80 underline decoration-cyan-200/40 hover:text-cyan-100"
                          style={{ fontSize: px(11) }}
                        >
                          Forgot password?
                        </Link>
                      </div>

                      {error && (
                        <p className="text-magenta" style={{ fontSize: px(11), marginTop: px(6) }}>
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={pending}
                        className="flex w-full items-center justify-center border font-display font-bold uppercase text-white transition hover:bg-white/[0.06] disabled:opacity-60"
                        style={{
                          marginTop: px(12),
                          gap: px(8),
                          borderRadius: px(4),
                          borderColor: "rgba(120,210,255,0.6)",
                          paddingTop: px(11),
                          paddingBottom: px(11),
                          fontSize: px(14),
                          letterSpacing: "0.14em",
                          background: "linear-gradient(90deg, rgba(0,163,255,0.16), rgba(255,47,192,0.16))",
                          boxShadow: "0 0 9px -3px rgba(0,180,255,0.7), 0 0 9px -3px rgba(255,47,192,0.5)",
                        }}
                      >
                        {pending ? "LOGGING IN…" : "LOG IN"}
                        {!pending && <ArrowIcon style={{ height: px(13), width: px(13) }} />}
                      </button>
                    </form>

                    <p className="text-white/60" style={{ fontSize: px(11), marginTop: px(22) }}>
                      New to POLAR?{" "}
                      <Link href="/signup" className="text-cyan-200 underline">
                        Create Account
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              {/* Chrome/Edge autofill paints its own opaque background
                  + black text, overriding the classes above — force it
                  back to a translucent icy glass treatment so
                  autofilled fields never flash solid white. */}
              <style jsx global>{`
                .polar-input:-webkit-autofill,
                .polar-input:-webkit-autofill:hover,
                .polar-input:-webkit-autofill:focus,
                .polar-input:-webkit-autofill:active {
                  -webkit-text-fill-color: #e4f2ff;
                  caret-color: #e4f2ff;
                  -webkit-box-shadow: 0 0 0 1000px rgba(10, 14, 30, 0.55) inset;
                  box-shadow: 0 0 0 1000px rgba(10, 14, 30, 0.55) inset;
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
