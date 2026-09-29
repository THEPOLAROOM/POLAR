import Link from "next/link";
import { Barlow, Russo_One } from "next/font/google";

// Shared shell for the smaller My Profile areas (SETTINGS, ePORTFOLIO):
// the same visual family as Personal Details — CV splatter, Russo One
// heading, cyan/pink gradient panels — with ✕ back to the My Profile hub.
// Server component; pages pass their own panels as children.

const ui = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const display = Russo_One({ subsets: ["latin"], weight: "400" });

export function AccountSubpage({
  id,
  t1,
  t2,
  sub,
  children,
}: {
  id: string;
  t1: string;
  t2?: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className={`as-root ${ui.className}`}>
      {/* Route-scoped: hides only the shared barber <nav> on this page. */}
      <style>{`div:has(> #${id}) > nav { display: none; }`}</style>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="asg-cp" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#19d2ff" />
            <stop offset="1" stopColor="#ff2bd1" />
          </linearGradient>
        </defs>
      </svg>

      <div className="as-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/dashboard/focus/cv-splat-left.webp" alt="" className="as-splat as-splat-l" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/dashboard/focus/cv-splat-right.webp" alt="" className="as-splat as-splat-r" />

        <header className="as-head">
          <h1 className={`as-title ${display.className}`}>
            <span className="as-t1">{t1}</span>
            {t2 && (
              <>
                {" "}
                <span className="as-t2">{t2}</span>
              </>
            )}
          </h1>
          <p className="as-sub">{sub}</p>
          <Link href="/dashboard/barber/account" className="as-x" aria-label="Close and return to My Profile" title="Back to My Profile">
            <AsIcon name="x" />
          </Link>
        </header>

        <main className="as-sections">{children}</main>
      </div>
    </div>
  );
}

export function AccountPanel({ icon, title, children }: { icon: AsIconName; title: string; children: React.ReactNode }) {
  return (
    <section className="as-panel">
      <div className="as-panel-head">
        <span className="as-iconbox">
          <AsIcon name={icon} grad />
        </span>
        <h2 className={`as-h2 ${display.className}`}>{title}</h2>
      </div>
      <div className="as-inset">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export type AsIconName = "user" | "envelope" | "logout" | "image" | "x";

const PATHS: Record<AsIconName, React.ReactNode> = {
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>),
  envelope: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 6.5l9 6.5 9-6.5" /></>),
  logout: (<><path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" /><path d="M10 16l-4-4 4-4" /><path d="M6 12h10" /></>),
  image: (<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 8" /></>),
  x: <path d="M5 5l14 14M19 5L5 19" />,
};

export function AsIcon({ name, grad }: { name: AsIconName; grad?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="as-icon" fill="none" stroke={grad ? "url(#asg-cp)" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Same --u scaling + palette as Personal Details / CV / Smart Analytics. */

const CSS = `
.as-root {
  --u: max(min(calc(100vw / 1672), calc(100vh / 941)), 0.62px);
  --cy: #19d2ff; --pk: #ff2bd1; --line: #123b5c;
  min-height: 100vh; min-height: 100dvh; color: #fff; overflow-x: hidden;
  background: radial-gradient(ellipse 70% 60% at 50% 0%, #02152c 0%, rgba(2,21,44,0) 70%), linear-gradient(90deg, #000f2b 0%, #010e1e 50%, #00091c 100%);
}
.as-root *, .as-root *::before, .as-root *::after { box-sizing: border-box; }
.as-stage { position: relative; width: 100%; min-height: calc(var(--u) * 941); margin: 0 auto; padding: 0 calc(var(--u) * 45) calc(var(--u) * 14); }
.as-splat { position: absolute; top: 0; height: calc(var(--u) * 941); pointer-events: none; user-select: none; }
.as-splat-l { left: 0; width: calc(var(--u) * 405); }
.as-splat-r { right: 0; width: calc(var(--u) * 397); }

.as-head { position: relative; height: calc(var(--u) * 124); text-align: center; }
.as-title { margin: 0; padding-top: calc(var(--u) * 26); font-size: calc(var(--u) * 42); line-height: 1; letter-spacing: calc(var(--u) * 0.5); white-space: nowrap; font-weight: 400; }
.as-t1 { color: #fdfcfb; }
.as-t2 { background: linear-gradient(180deg, #ffffff 30%, #cfe0ff 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.as-sub { margin: calc(var(--u) * 16) 0 0; font-size: calc(var(--u) * 16); font-weight: 500; letter-spacing: calc(var(--u) * 6); color: #e6e7ee; line-height: 1; }
.as-x { position: absolute; top: calc(var(--u) * 18); right: calc(var(--u) * -25); display: grid; place-items: center; width: calc(var(--u) * 52); height: calc(var(--u) * 52); border: calc(var(--u) * 2) solid #bfeaff; border-radius: calc(var(--u) * 7); color: #fff; background: rgba(1,9,22,.7); box-shadow: 0 0 calc(var(--u) * 12) rgba(25,210,255,.55), inset 0 0 calc(var(--u) * 8) rgba(25,210,255,.25); transition: filter .15s; }
.as-x:hover { filter: brightness(1.25); }
.as-x .as-icon { width: calc(var(--u) * 28); height: calc(var(--u) * 28); stroke-width: 3.2; }

.as-sections { position: relative; display: flex; flex-direction: column; gap: calc(var(--u) * 16); max-width: calc(var(--u) * 1000); margin: 0 auto; }
.as-panel {
  position: relative; border-radius: calc(var(--u) * 14); border: calc(var(--u) * 2.5) solid transparent;
  background: linear-gradient(180deg, rgba(3,14,30,.96), rgba(1,9,22,.97)) padding-box,
    linear-gradient(90deg, #00e8ff 0%, #01b4d8 25%, #0470a8 70%, #5a2fb8 86%, #f50ae8 100%) border-box;
  box-shadow: calc(var(--u) * -3) 0 calc(var(--u) * 14) calc(var(--u) * -3) rgba(0,220,255,.6), calc(var(--u) * 3) 0 calc(var(--u) * 14) calc(var(--u) * -3) rgba(245,10,232,.6);
}
.as-panel-head { display: flex; align-items: center; gap: calc(var(--u) * 16); height: calc(var(--u) * 76); padding: 0 calc(var(--u) * 22) 0 calc(var(--u) * 16); }
.as-iconbox { display: grid; place-items: center; width: calc(var(--u) * 79); height: calc(var(--u) * 64); flex: none; border-radius: calc(var(--u) * 10); border: calc(var(--u) * 2) solid transparent; background: linear-gradient(#051428, #041022) padding-box, linear-gradient(135deg, #7a5cff, #19d2ff 45%, #ff2bd1) border-box; box-shadow: 0 0 calc(var(--u) * 10) rgba(122,92,255,.35); }
.as-iconbox .as-icon { width: calc(var(--u) * 44); height: calc(var(--u) * 44); stroke-width: 1.7; }
.as-h2 { margin: 0; flex: 1; font-size: calc(var(--u) * 27); line-height: 1; font-weight: 400; letter-spacing: calc(var(--u) * 0.6); color: #fff; }

.as-inset { margin: 0 calc(var(--u) * 17) calc(var(--u) * 20); border: 1px solid rgba(18,59,92,.9); border-radius: calc(var(--u) * 8); background: rgba(1,8,20,.55); padding: calc(var(--u) * 18) calc(var(--u) * 20); }
.as-desc { margin: 0; font-size: calc(var(--u) * 17); line-height: 1.45; color: #9fb3cc; }
.as-desc + .as-desc { margin-top: calc(var(--u) * 8); }
.as-row { display: flex; align-items: center; gap: calc(var(--u) * 16); flex-wrap: wrap; }
.as-label { font-size: calc(var(--u) * 15); font-weight: 600; letter-spacing: calc(var(--u) * 2); color: #9fb3cc; text-transform: uppercase; }
.as-value { display: inline-flex; align-items: center; gap: calc(var(--u) * 10); min-width: 0; font-size: calc(var(--u) * 20); font-weight: 600; color: #fff; overflow-wrap: anywhere; }
.as-value .as-icon { flex: none; width: calc(var(--u) * 24); height: calc(var(--u) * 24); color: var(--cy); }

.as-btn { display: inline-flex; align-items: center; justify-content: center; gap: calc(var(--u) * 14); height: calc(var(--u) * 56); padding: 0 calc(var(--u) * 34); border: calc(var(--u) * 2) solid var(--cy); border-radius: calc(var(--u) * 7); background: rgba(1,9,22,.7); color: #fff; font: inherit; font-size: calc(var(--u) * 20); font-weight: 700; letter-spacing: calc(var(--u) * 1); box-shadow: 0 0 calc(var(--u) * 12) rgba(25,210,255,.4), inset 0 0 calc(var(--u) * 8) rgba(25,210,255,.2); cursor: pointer; transition: filter .15s; }
.as-btn:hover { filter: brightness(1.25); }
.as-btn .as-icon { width: calc(var(--u) * 26); height: calc(var(--u) * 26); color: var(--cy); stroke-width: 2.2; }

.as-empty { display: flex; flex-direction: column; align-items: center; gap: calc(var(--u) * 14); padding: calc(var(--u) * 40) calc(var(--u) * 20); text-align: center; }
.as-empty > .as-icon { width: calc(var(--u) * 72); height: calc(var(--u) * 72); color: rgba(25,210,255,.55); stroke-width: 1.3; }
.as-empty-title { margin: 0; font-size: calc(var(--u) * 24); font-weight: 700; color: #fff; }
.as-empty .as-desc { max-width: calc(var(--u) * 620); }

.as-root button:focus-visible, .as-root a:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) { .as-root * { transition: none !important; } }

@media (max-width: 900px) {
  .as-root { --u: 0.62px; }
  .as-stage { width: 100%; padding: 0 16px 24px; }
  .as-splat { display: none; }
  .as-title { white-space: normal; padding: 18px 56px 0; font-size: 30px; }
  .as-sub { font-size: 11px; letter-spacing: 4px; }
  .as-x { right: 0; width: 44px; height: 44px; }
  .as-x .as-icon { width: 22px; height: 22px; }
  .as-head { height: auto; padding-bottom: 18px; }
  .as-h2 { font-size: 18px; }
  .as-panel-head { height: auto; min-height: 56px; padding: 12px 14px; }
  .as-iconbox { width: 52px; height: 44px; }
  .as-iconbox .as-icon { width: 28px; height: 28px; }
  .as-inset { margin: 0 10px 14px; padding: 14px; }
  .as-desc { font-size: 15px; }
  .as-label { font-size: 12px; }
  .as-value { font-size: 17px; }
  .as-btn { width: 100%; height: 48px; font-size: 17px; }
  .as-empty { padding: 24px 8px; }
  .as-empty > .as-icon { width: 52px; height: 52px; }
  .as-empty-title { font-size: 19px; }
}
`;
