import Link from "next/link";
import { Barlow, Barlow_Condensed, Permanent_Marker } from "next/font/google";
import { BarberRoom } from "@/app/dashboard/barber/dashboard-scene";

// POLAR Barber system for the Barber's plain (form/list) pages:
// Availability, Custom Fields, Barber Insights and the client record.
// Same master frame (9-slice of the CALENDAR-UI master's own frame
// artwork), POLAR navy base, hot-pink neon, crown and ✕ as the Focus
// pages. The page's existing forms and links render unchanged inside;
// their light-theme `polar-*` utility colours are re-mapped to the dark
// system by `.polar-dark` (scoped — nothing outside these pages moves).

const body = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const condensed = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"] });
const brush = Permanent_Marker({ subsets: ["latin"], weight: "400" });

const BODY_W = 1488;
const cq = (px: number) => `${((px / BODY_W) * 100).toFixed(4)}cqw`;

export function PolarPlainPage({
  id,
  title,
  subtitle,
  icon,
  backHref,
  backLabel,
  children,
}: {
  /** Unique id — scopes the page's nav-hiding rule. */
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  /** Where ✕ goes. */
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div id={`barber-${id}-page`} className={`polar-dark polar-plain ${body.className}`}>
      <style>{`div:has(> #barber-${id}-page) > nav { display: none; }`}</style>
      <style>{POLAR_DARK_CSS}</style>

      <div aria-hidden="true" className="pp-room">
        <div className="absolute inset-0" style={{ filter: "saturate(0.15) brightness(0.4) blur(2.5px)" }}>
          <BarberRoom decorative />
        </div>
        <div className="absolute inset-0" style={{ background: "rgba(3,6,18,0.9)" }} />
      </div>

      <div className="pp-wrap">
        <section className="pp-panel" aria-labelledby={`${id}-title`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dashboard/polar-ui/polar-header-drips.webp" alt="" aria-hidden="true" className="pp-drips" />
          <header className="pp-head">
            <span className="pp-icon">{icon}</span>
            <div className="min-w-0">
              <h1 id={`${id}-title`} className={`${brush.className} pp-title`}>
                {title}
              </h1>
              {subtitle && <p className={`${condensed.className} pp-sub`}>{subtitle}</p>}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dashboard/polar-ui/polar-crown.webp" alt="" aria-hidden="true" className="pp-crown" />
            <Link href={backHref} aria-label={backLabel} title={backLabel} className="pp-x">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </Link>
          </header>
          <div className="pp-rule" aria-hidden="true" />
          <div className="pp-body">{children}</div>
        </section>
      </div>
    </div>
  );
}

/** Phone header for the Focus pages' phone views: icon, brush title, crown, ✕. */
export function PolarPhoneHeader({ title, icon, backHref }: { title: string; icon: React.ReactNode; backHref: string }) {
  return (
    <div className="mb-6">
      <header className="pp-head" style={{ padding: 0 }}>
        <span className="pp-icon">{icon}</span>
        <h1 className={`${brush.className} pp-title`}>{title}</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/dashboard/polar-ui/polar-crown.webp" alt="" aria-hidden="true" className="pp-crown" />
        <Link href={backHref} aria-label="Back to dashboard" title="Back to dashboard" className="pp-x">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </Link>
      </header>
      <div className="pp-rule" style={{ margin: "12px 0 0", display: "block" }} aria-hidden="true" />
    </div>
  );
}

/** Scoped dark re-map of the app's light `polar-*` utilities, plus the
 *  POLAR Barber form/list language. Used by plain pages and by the Focus
 *  pages' phone views. */
export const POLAR_DARK_CSS = `
.polar-dark { --pd-navy: #060b1e; --pd-field: #0b1330; --pd-pink: #fd12c8; --pd-pink-rgb: 253,18,200; --pd-cyan: #1fd6ff; color: #fff; }
.polar-dark .text-polar-text, .polar-dark .text-polar-primary { color: #fff; }
.polar-dark .text-polar-muted { color: rgba(223,232,245,0.64); }
.polar-dark .text-polar-danger { color: #ff6b9a; }
.polar-dark .bg-polar-danger { background-color: #d6204a; color: #fff; }
.polar-dark [class*="border-polar-danger"] { border-color: rgba(255,107,154,0.6); }
.polar-dark .text-polar-success { color: #3ee6a8; }
.polar-dark .bg-polar-surface { background-color: var(--pd-field); }
.polar-dark .bg-polar-bg { background-color: var(--pd-navy); }
.polar-dark .border-polar-border { border-color: rgba(var(--pd-pink-rgb),0.42); }
.polar-dark .bg-polar-primary { background-color: var(--pd-pink); color: #16000f; box-shadow: 0 0 14px -4px rgba(var(--pd-pink-rgb),0.85); }
.polar-dark .focus\\:border-polar-text:focus { border-color: var(--pd-pink); box-shadow: 0 0 10px -2px rgba(var(--pd-pink-rgb),0.6); }
.polar-dark input:not([type=checkbox]):not([type=radio]):not([type=file]), .polar-dark select, .polar-dark textarea { color: #fff; color-scheme: dark; }
.polar-dark input::placeholder, .polar-dark textarea::placeholder { color: rgba(255,255,255,0.35); }
.polar-dark option { background: var(--pd-field); color: #fff; }
.polar-dark input[type=checkbox], .polar-dark input[type=radio] { accent-color: var(--pd-pink); }
.polar-dark a.underline, .polar-dark a[class*="underline"] { text-decoration-color: rgba(var(--pd-pink-rgb),0.7); text-underline-offset: 3px; }
.polar-dark ::selection { background: rgba(var(--pd-pink-rgb),0.45); color: #fff; }
.polar-dark :focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.polar-dark button.border-polar-border:hover, .polar-dark a.border-polar-border:hover { background: rgba(var(--pd-pink-rgb),0.1); }

/* Plain-page frame (desktop) */
.polar-plain { min-height: 100dvh; background: var(--pd-navy); }
.pp-room { display: none; }
.pp-wrap { position: relative; }
.pp-panel { position: relative; background: var(--pd-navy); }
.pp-head { display: flex; align-items: center; gap: 12px; padding: 18px 18px 10px; }
.pp-icon { color: var(--pd-pink); flex: none; filter: drop-shadow(0 0 6px rgba(var(--pd-pink-rgb),0.8)); }
.pp-title { margin: 0; min-width: 0; font-size: clamp(24px, 7.5vw, 34px); line-height: 1.05; color: #fff; transform: skewX(-6deg); text-shadow: 0 2px 0 rgba(0,0,0,0.7), 0 0 14px rgba(var(--pd-pink-rgb),0.45); white-space: nowrap; }
.pp-sub { margin: 4px 0 0 4px; font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.8); }
.pp-crown { height: 34px; width: auto; flex: none; align-self: flex-start; transform: translateY(-4px); }
.pp-drips { display: none; }
.pp-x { margin-left: auto; display: grid; place-items: center; width: 46px; height: 46px; flex: none; border-radius: 13px; border: 2.5px solid var(--pd-pink); color: var(--pd-pink); background: var(--pd-navy); box-shadow: 0 0 12px rgba(var(--pd-pink-rgb),0.6), inset 0 0 9px rgba(var(--pd-pink-rgb),0.28); transition: filter .15s; }
.pp-x:hover { filter: brightness(1.25); }
.pp-rule { height: 2px; margin: 0 18px; background: var(--pd-pink); box-shadow: 0 0 8px rgba(var(--pd-pink-rgb),0.7); border-radius: 2px; }
.pp-body { padding: 18px; }
.polar-plain .pp-body h2 { color: var(--pd-pink); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; font-size: 15px; }
.polar-plain .pp-body button[type=submit].border-polar-border { border-color: var(--pd-pink); color: #fff; box-shadow: 0 0 10px -3px rgba(var(--pd-pink-rgb),0.7); }

@media (min-width: 640px) {
  .pp-room { display: block; position: fixed; inset: 0; }
  .pp-wrap { position: fixed; inset: max(6dvh, 28px) max(5vw, 28px); container-type: inline-size; }
  .pp-panel {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    border-style: solid; border-width: 0; border-radius: ${cq(44)};
    border-image-source: url(/dashboard/polar-ui/polar-frame.webp);
    border-image-slice: 130 340 120 340;
    border-image-width: ${cq(130)} ${cq(340)} ${cq(120)} ${cq(340)};
    border-image-outset: ${cq(86)} ${cq(87)} ${cq(71)} ${cq(97)};
  }
  .pp-drips { display: block; position: absolute; right: ${cq(233)}; top: ${cq(20)}; width: ${cq(130)}; pointer-events: none; }
  .pp-head { gap: 16px; padding: 16px 32px; margin: ${cq(20)} ${cq(15)} ${cq(4)} ${cq(21)};
    border-style: solid; border-width: 0; border-image-source: url(/dashboard/polar-ui/polar-header-bar.webp);
    border-image-slice: 0 40 0 40 fill; border-image-width: 0 ${cq(40)} 0 ${cq(40)}; }
  .pp-panel > .pp-rule { display: none; }
  .polar-plain .pp-body .text-xs { font-size: 14px; }
  .polar-plain .pp-body .text-sm { font-size: 16px; }
  .pp-sub { font-size: 14px; letter-spacing: 0.34em; }
  .pp-crown { align-self: center; transform: translateY(-10px); }
  .pp-title { font-size: clamp(36px, 3vw, 54px); }
  .pp-crown { height: 56px; }
  .pp-x { width: 56px; height: 56px; }
  .pp-body { flex: 1; min-height: 0; overflow-y: auto; padding: 22px 32px 32px; scrollbar-width: thin; scrollbar-color: rgba(var(--pd-pink-rgb),0.7) transparent; }
}
`;
