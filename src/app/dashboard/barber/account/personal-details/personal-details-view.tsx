"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Barlow, Russo_One } from "next/font/google";
import { updateBarberProfile, updateBarberAddresses } from "@/lib/actions/barber-account";

const ui = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const display = Russo_One({ subsets: ["latin"], weight: "400" });

type Addresses = {
  home_address_line_1: string;
  home_address_line_2: string | null;
  home_town_city: string;
  home_county_region: string | null;
  home_postcode: string;
  home_country: string;
  work_same_as_home: boolean;
  work_address_line_1: string | null;
  work_address_line_2: string | null;
  work_town_city: string | null;
  work_county_region: string | null;
  work_postcode: string | null;
  work_country: string | null;
};

// Same field set/validation/server actions as the old plain page
// (PersonalDetailsForm + AddressesForm) — this view only unifies the
// UI into the mastered visual system and a single Save Changes
// control. Both existing actions are called from the same FormData,
// unchanged, on submit.
export function PersonalDetailsView({
  phone,
  addresses,
}: {
  phone: string;
  addresses: Addresses | null;
}) {
  const [workSameAsHome, setWorkSameAsHome] = useState(addresses?.work_same_as_home ?? false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setStatus(null);
    startTransition(async () => {
      const [profileResult, addressResult] = await Promise.all([
        updateBarberProfile(formData),
        updateBarberAddresses(formData),
      ]);
      const error =
        (profileResult && "error" in profileResult && profileResult.error) ||
        (addressResult && "error" in addressResult && addressResult.error);
      if (error) {
        setStatus({ kind: "error", text: error });
        return;
      }
      setStatus({ kind: "ok", text: "Saved" });
    });
  }

  return (
    <div id="barber-personal-details-page" className={`pd-root ${ui.className}`}>
      {/* Route-scoped: hides only the shared barber <nav> on this page. */}
      <style>{`div:has(> #barber-personal-details-page) > nav { display: none; }`}</style>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="pdg-cp" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#19d2ff" />
            <stop offset="1" stopColor="#ff2bd1" />
          </linearGradient>
        </defs>
      </svg>

      <form className="pd-stage" onSubmit={handleSubmit}>
        {/* Splatter, reused from the mastered Professional Profile / CV
            page — no dedicated Personal Details artwork exists yet, so
            this reuses that asset rather than inventing a new one. */}
        <img src="/dashboard/focus/cv-splat-left.webp" alt="" className="pd-splat pd-splat-l" />
        <img src="/dashboard/focus/cv-splat-right.webp" alt="" className="pd-splat pd-splat-r" />

        <header className="pd-head">
          <h1 className={`pd-title ${display.className}`}>
            <span className="pd-t1">PERSONAL</span> <span className="pd-t2">DETAILS</span>
          </h1>
          <p className="pd-sub">MANAGE YOUR PRIVATE ACCOUNT INFORMATION</p>
          <Link href="/dashboard/barber/account" className="pd-x" aria-label="Close">
            <Icon name="x" />
          </Link>
        </header>

        <main className="pd-sections">
          <section className="pd-panel">
            <PanelHead icon="phone" title="CONTACT DETAILS" />
            <div className="pd-inset">
              <p className="pd-desc">Your personal contact information (private, not shown to clients).</p>
              <div className="pd-grid pd-grid-1">
                <Field label="Phone Number" icon="phone">
                  <input name="phone" type="text" required defaultValue={phone} />
                </Field>
              </div>
            </div>
          </section>

          <section className="pd-panel">
            <PanelHead icon="home" title="PERSONAL / HOME ADDRESS" />
            <div className="pd-inset">
              <p className="pd-desc">Your personal/home address (always private, never shown to clients).</p>
              <AddressFields prefix="home" values={addresses} />
            </div>
          </section>

          <section className="pd-panel pd-panel-pink">
            <PanelHead icon="briefcase" title="WORK / COMMERCIAL ADDRESS" pink />
            <div className="pd-inset">
              <p className="pd-desc">Used for your business location. This may be shown to clients depending on your profile settings.</p>
              <label className="pd-check">
                <input
                  name="work_same_as_home"
                  type="checkbox"
                  checked={workSameAsHome}
                  onChange={(e) => setWorkSameAsHome(e.target.checked)}
                />
                Same as my home address
              </label>

              {!workSameAsHome && <AddressFields prefix="work" values={addresses} required={false} />}
            </div>
          </section>
        </main>

        <footer className="pd-foot">
          {status && (
            <p className={`pd-status ${status.kind === "error" ? "is-error" : ""}`} role="status">
              {status.text}
            </p>
          )}
          <button type="submit" className="pd-save-btn" disabled={pending}>
            <Icon name="save" />
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function PanelHead({ icon, title, pink }: { icon: IconName; title: string; pink?: boolean }) {
  return (
    <div className="pd-panel-head">
      <span className="pd-iconbox">
        <Icon name={icon} grad={!pink} pink={pink} />
      </span>
      <h2 className={`pd-h2 ${display.className}`}>{title}</h2>
      <Icon name="info" />
    </div>
  );
}

function AddressFields({
  prefix,
  values,
  required = true,
}: {
  prefix: "home" | "work";
  values: Addresses | null;
  required?: boolean;
}) {
  const v = (key: string) => (values?.[`${prefix}_${key}` as keyof Addresses] as string | null) ?? "";
  return (
    <div className="pd-grid pd-grid-1">
      <Field label="Address line 1" icon="pin">
        <input name={`${prefix}_address_line_1`} type="text" required={required} defaultValue={v("address_line_1")} />
      </Field>
      <Field label="Address line 2 (optional)" icon="page">
        <input name={`${prefix}_address_line_2`} type="text" defaultValue={v("address_line_2")} />
      </Field>
      <Field label="Town / City" icon="building">
        <input name={`${prefix}_town_city`} type="text" required={required} defaultValue={v("town_city")} />
      </Field>
      <Field label="County" icon="map">
        <input name={`${prefix}_county_region`} type="text" defaultValue={v("county_region")} />
      </Field>
      <div className="pd-grid pd-grid-2">
        <Field label="Postcode" icon="envelope">
          <input name={`${prefix}_postcode`} type="text" required={required} defaultValue={v("postcode")} />
        </Field>
        <Field label="Country" icon="globe" chevron>
          <input name={`${prefix}_country`} type="text" required={required} defaultValue={v("country")} />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, icon, chevron, children }: { label: string; icon: IconName; chevron?: boolean; children: React.ReactElement }) {
  return (
    <label className="pd-field">
      <span className="pd-label">{label}</span>
      <span className="pd-control">
        <span className="pd-prefix">
          <Icon name={icon} />
        </span>
        {children}
        {chevron && (
          <span className="pd-caret" aria-hidden="true">
            <Icon name="down" />
          </span>
        )}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */

type IconName = "phone" | "home" | "briefcase" | "pin" | "page" | "building" | "map" | "envelope" | "globe" | "down" | "info" | "save" | "x";

const PATHS: Record<IconName, React.ReactNode> = {
  phone: <path d="M4.5 3.5h3L9 8l-2 1.3a12 12 0 006.2 6.2L14.5 13.5l4.5 1.5v3a2 2 0 01-2.2 2A16.5 16.5 0 013.5 5.7a2 2 0 012-2.2z" />,
  home: (<><path d="M4 11.5L12 4l8 7.5" /><path d="M6 10v10h12V10" /><path d="M10 20v-6h4v6" /></>),
  briefcase: (<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M3 12.5h18" /></>),
  pin: (<><path d="M12 22s7-7.2 7-12.5A7 7 0 005 9.5C5 14.8 12 22 12 22z" /><circle cx="12" cy="9.5" r="2.6" /></>),
  page: (<><path d="M6 2.5h8l5 5V21a.5.5 0 01-.5.5h-12A.5.5 0 016 21z" /><path d="M14 2.5V8h5" /></>),
  building: (<><path d="M4 21V4h10v17" /><path d="M14 9h6v12" /><path d="M2 21h20" /><path d="M7 7.5h1M10 7.5h1M7 11h1M10 11h1M7 14.5h1M10 14.5h1" /></>),
  map: (<><path d="M9 4L3 6.5v13.5L9 17l6 3 6-2.5V4L15 6.5 9 4z" /><path d="M9 4v13M15 6.5V20" /></>),
  envelope: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 6.5l9 6.5 9-6.5" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" /></>),
  down: <path d="M6 9l6 6 6-6" />,
  info: (<><circle cx="12" cy="12" r="9.5" /><path d="M12 10.5v6M12 7.5v.01" /></>),
  save: (<><path d="M4 3h13l4 4v14H4z" fill="currentColor" stroke="none" /><rect x="7.5" y="3" width="8" height="5.5" rx=".5" fill="#fff" stroke="none" /><rect x="12.2" y="4" width="2" height="3.5" fill="currentColor" stroke="none" /><rect x="7" y="12.5" width="10" height="6.5" rx=".6" fill="#fff" stroke="none" /></>),
  x: <path d="M5 5l14 14M19 5L5 19" />,
};

function Icon({ name, grad, pink }: { name: IconName; grad?: boolean; pink?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="pd-icon" fill="none" stroke={grad ? "url(#pdg-cp)" : pink ? "#ff2bd1" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Same --u scaling + palette as the mastered CV / Smart Analytics pages. */

const CSS = `
.pd-root {
  --u: max(min(calc(100vw / 1672), calc(100vh / 941)), 0.62px);
  --cy: #19d2ff; --pk: #ff2bd1; --line: #123b5c;
  min-height: 100vh; min-height: 100dvh; color: #fff; overflow-x: hidden;
  background: radial-gradient(ellipse 70% 60% at 50% 0%, #02152c 0%, rgba(2,21,44,0) 70%), linear-gradient(90deg, #000f2b 0%, #010e1e 50%, #00091c 100%);
}
.pd-root *, .pd-root *::before, .pd-root *::after { box-sizing: border-box; }
.pd-stage { position: relative; width: 100%; min-height: calc(var(--u) * 941); margin: 0 auto; padding: 0 calc(var(--u) * 45) calc(var(--u) * 14); }
.pd-splat { position: absolute; top: 0; height: calc(var(--u) * 941); pointer-events: none; user-select: none; }
.pd-splat-l { left: 0; width: calc(var(--u) * 405); }
.pd-splat-r { right: 0; width: calc(var(--u) * 397); }

.pd-head { position: relative; height: calc(var(--u) * 124); text-align: center; }
.pd-title { margin: 0; padding-top: calc(var(--u) * 26); font-size: calc(var(--u) * 42); line-height: 1; letter-spacing: calc(var(--u) * 0.5); white-space: nowrap; font-weight: 400; }
.pd-t1 { color: #fdfcfb; }
.pd-t2 { background: linear-gradient(180deg, #ffffff 30%, #cfe0ff 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.pd-sub { margin: calc(var(--u) * 16) 0 0; font-size: calc(var(--u) * 16); font-weight: 500; letter-spacing: calc(var(--u) * 6); color: #e6e7ee; line-height: 1; }
.pd-x { position: absolute; top: calc(var(--u) * 18); right: calc(var(--u) * -25); display: grid; place-items: center; width: calc(var(--u) * 52); height: calc(var(--u) * 52); border: calc(var(--u) * 2) solid #bfeaff; border-radius: calc(var(--u) * 7); color: #fff; background: rgba(1,9,22,.7); box-shadow: 0 0 calc(var(--u) * 12) rgba(25,210,255,.55), inset 0 0 calc(var(--u) * 8) rgba(25,210,255,.25); transition: filter .15s; cursor: pointer; }
.pd-x:hover { filter: brightness(1.25); }
.pd-x .pd-icon { width: calc(var(--u) * 28); height: calc(var(--u) * 28); stroke-width: 3.2; }

.pd-sections { position: relative; display: flex; flex-direction: column; gap: calc(var(--u) * 16); }
.pd-panel {
  position: relative; border-radius: calc(var(--u) * 14); border: calc(var(--u) * 2.5) solid transparent;
  background: linear-gradient(180deg, rgba(3,14,30,.96), rgba(1,9,22,.97)) padding-box,
    linear-gradient(90deg, #00e8ff 0%, #01b4d8 25%, #0470a8 70%, #5a2fb8 86%, #f50ae8 100%) border-box;
  box-shadow: calc(var(--u) * -3) 0 calc(var(--u) * 14) calc(var(--u) * -3) rgba(0,220,255,.6), calc(var(--u) * 3) 0 calc(var(--u) * 14) calc(var(--u) * -3) rgba(245,10,232,.6);
}
.pd-panel-pink { background: linear-gradient(180deg, rgba(3,14,30,.96), rgba(1,9,22,.97)) padding-box, linear-gradient(90deg, #fa0af3 0%, #a0189c 12%, #044b7d 30%, #054e80 70%, #7a1c9e 88%, #f90dec 100%) border-box; box-shadow: calc(var(--u) * -3) 0 calc(var(--u) * 14) calc(var(--u) * -3) rgba(250,10,243,.6), calc(var(--u) * 3) 0 calc(var(--u) * 14) calc(var(--u) * -3) rgba(245,10,232,.6); }
.pd-panel-head { display: flex; align-items: center; gap: calc(var(--u) * 16); height: calc(var(--u) * 76); padding: 0 calc(var(--u) * 22) 0 calc(var(--u) * 16); }
.pd-iconbox { display: grid; place-items: center; width: calc(var(--u) * 79); height: calc(var(--u) * 64); flex: none; border-radius: calc(var(--u) * 10); border: calc(var(--u) * 2) solid transparent; background: linear-gradient(#051428, #041022) padding-box, linear-gradient(135deg, #7a5cff, #19d2ff 45%, #ff2bd1) border-box; box-shadow: 0 0 calc(var(--u) * 10) rgba(122,92,255,.35); }
.pd-panel-pink .pd-iconbox { background: linear-gradient(#051428, #041022) padding-box, linear-gradient(135deg, #ff2bd1, #a0189c 60%, #7a1c9e) border-box; }
.pd-iconbox .pd-icon { width: calc(var(--u) * 44); height: calc(var(--u) * 44); stroke-width: 1.7; }
.pd-h2 { margin: 0; flex: 1; font-size: calc(var(--u) * 27); line-height: 1; font-weight: 400; letter-spacing: calc(var(--u) * 0.6); color: #fff; }
.pd-panel-head > .pd-icon { width: calc(var(--u) * 22); height: calc(var(--u) * 22); color: var(--cy); stroke-width: 1.8; flex: none; }
.pd-panel-pink .pd-panel-head > .pd-icon { color: var(--pk); }

.pd-inset { margin: 0 calc(var(--u) * 17) calc(var(--u) * 20); border: 1px solid rgba(18,59,92,.9); border-radius: calc(var(--u) * 8); background: rgba(1,8,20,.55); padding: calc(var(--u) * 16) calc(var(--u) * 20); }
.pd-desc { margin: 0 0 calc(var(--u) * 16); font-size: calc(var(--u) * 15); color: #9fb3cc; }
.pd-grid { display: grid; row-gap: calc(var(--u) * 14); }
.pd-grid-1 { grid-template-columns: 1fr; }
.pd-grid-2 { grid-template-columns: 1fr 1fr; column-gap: calc(var(--u) * 34); margin-top: calc(var(--u) * 14); }

.pd-field { display: flex; flex-direction: column; min-width: 0; }
.pd-label { display: block; margin-bottom: calc(var(--u) * 8); font-size: calc(var(--u) * 17); line-height: 1.1; font-weight: 600; letter-spacing: calc(var(--u) * 0.5); color: #fff; }
.pd-control { position: relative; display: flex; height: calc(var(--u) * 54); border: 1px solid var(--line); border-radius: calc(var(--u) * 6); background: #061423; overflow: hidden; transition: border-color .15s, box-shadow .15s; }
.pd-control:focus-within { border-color: var(--cy); box-shadow: 0 0 calc(var(--u) * 10) rgba(25,210,255,.35); }
.pd-prefix { display: grid; place-items: center; width: calc(var(--u) * 65); flex: none; border-right: 1px solid #0c2741; background: #041020; color: var(--cy); }
.pd-prefix .pd-icon { width: calc(var(--u) * 30); height: calc(var(--u) * 30); }
.pd-control input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: #fff; font: inherit; font-size: calc(var(--u) * 17); font-weight: 500; padding: 0 calc(var(--u) * 20); }
.pd-control:has(.pd-caret) input { padding-right: calc(var(--u) * 56); }
.pd-control input::placeholder { color: rgba(255,255,255,.35); }
.pd-caret { position: absolute; right: calc(var(--u) * 14); top: 50%; transform: translateY(-50%); display: grid; place-items: center; color: #fff; pointer-events: none; }
.pd-caret .pd-icon { width: calc(var(--u) * 24); height: calc(var(--u) * 24); stroke-width: 2.8; }

.pd-check { display: flex; align-items: center; gap: calc(var(--u) * 12); margin-bottom: calc(var(--u) * 4); font-size: calc(var(--u) * 17); font-weight: 500; color: #fff; cursor: pointer; }
.pd-check input { width: calc(var(--u) * 20); height: calc(var(--u) * 20); accent-color: var(--pk); cursor: pointer; }

.pd-foot { position: relative; display: flex; align-items: center; justify-content: flex-end; gap: calc(var(--u) * 20); margin-top: calc(var(--u) * 10); }
.pd-status { margin: 0 auto 0 0; font-size: calc(var(--u) * 17); font-weight: 600; color: #3ee6a8; }
.pd-status.is-error { color: #ff6b8b; max-width: calc(var(--u) * 700); }
.pd-save-btn { display: flex; align-items: center; justify-content: center; gap: calc(var(--u) * 22); height: calc(var(--u) * 56); width: calc(var(--u) * 260); border: 0; border-radius: calc(var(--u) * 7); background: linear-gradient(90deg, #00dcfd 0%, #01aafd 25%, #5f67fd 50%, #df28fc 76%, #fe20fd 100%); color: #0a1128; font: inherit; font-size: calc(var(--u) * 20); font-weight: 700; box-shadow: calc(var(--u) * -4) 0 calc(var(--u) * 16) rgba(0,220,253,.45), calc(var(--u) * 4) 0 calc(var(--u) * 16) rgba(254,32,253,.45); cursor: pointer; transition: filter .15s; }
.pd-save-btn:hover { filter: brightness(1.1); }
.pd-save-btn:disabled { opacity: .7; cursor: progress; }
.pd-save-btn .pd-icon { width: calc(var(--u) * 30); height: calc(var(--u) * 30); color: #0a1128; }

.pd-root button:focus-visible, .pd-root a:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) { .pd-root * { transition: none !important; } }

@media (max-width: 900px) {
  .pd-root { --u: 0.62px; }
  .pd-stage { width: 100%; padding: 0 16px 24px; }
  .pd-splat { display: none; }
  .pd-title { white-space: normal; padding: 18px 56px 0; font-size: 30px; }
  .pd-sub { font-size: 11px; letter-spacing: 4px; }
  .pd-x { right: 0; }
  .pd-head { height: auto; padding-bottom: 18px; }
  .pd-grid-2 { grid-template-columns: 1fr; }
  .pd-h2 { font-size: 18px; }
  .pd-label, .pd-control input { font-size: 15px; }
  .pd-control { height: 46px; }
  .pd-panel-head { height: auto !important; min-height: 56px; padding: 12px 14px !important; }
  .pd-iconbox { width: 52px; height: 44px; }
  .pd-iconbox .pd-icon { width: 28px; height: 28px; }
  .pd-inset { margin: 0 10px 14px; }
  .pd-foot { flex-wrap: wrap; justify-content: flex-start; }
  .pd-status { order: 2; width: 100%; margin: 0; font-size: 15px; }
  .pd-save-btn { width: 100%; height: 48px; font-size: 17px; }
}
`;
