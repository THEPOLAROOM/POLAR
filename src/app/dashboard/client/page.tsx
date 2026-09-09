import Link from "next/link";
import Image from "next/image";
import { requireRole } from "@/lib/auth/require-role";

// UI fallback only — shown when profiles.polar_id is genuinely null
// (not yet assigned; assignment happens on email verification for
// client accounts, per the polar_client_id_seq migration).
const POLAR_ID_PLACEHOLDER = "P-000000";

// The overlay renders at this fraction of the background's width
// (height follows automatically since both share the exact same
// 1672:941 aspect ratio), centred via equal insets on every side —
// shrunk from 84% to 76% to expose the full POLAR LONDON wall logo
// and give the panels more breathing room.
const OVERLAY_SCALE = 0.76;
const OVERLAY_INSET_PCT = `${((1 - OVERLAY_SCALE) / 2) * 100}%`;
const OVERLAY_INSET = {
  left: OVERLAY_INSET_PCT,
  right: OVERLAY_INSET_PCT,
  top: OVERLAY_INSET_PCT,
  bottom: OVERLAY_INSET_PCT,
};

// Percentage boxes below are measured directly against the mastered
// UI asset's native 1672x941 canvas (same canvas as the background),
// so they stay locked to the artwork — now within the scaled-down
// OVERLAY_INSET wrapper above rather than the full background box.
// Re-measured against each panel's own visible neon border line
// (pixel-level brightness-peak scan, not a rough eyeball crop) so
// the hover glow sits exactly on the border instead of spilling
// outside it. Do not adjust without re-measuring the asset.
const CLICK_TARGETS = [
  { href: "/dashboard/client/book", label: "Book appointment", box: { left: "3.47%", top: "17.75%", width: "22.73%", height: "46.65%" } },
  { href: "/dashboard/client/bookings", label: "Appointment history", box: { left: "73.80%", top: "17.75%", width: "22.73%", height: "46.65%" } },
] as const;

// Your Barber / Services stay inert (no route yet) but still get the
// same hover brighten/glow as the two clickable panels — a plain,
// non-navigating box positioned over their baked artwork.
const INERT_HOVER_PANELS = [
  { label: "Your barber", box: { left: "3.59%", top: "67.16%", width: "45.69%", height: "21.89%" } },
  { label: "Services", box: { left: "50.72%", top: "67.16%", width: "45.69%", height: "21.89%" } },
] as const;

// Subtle premium brighten + electric-blue glow on hover — no
// movement/resizing, artwork itself is never touched, just a
// translucent highlight layered on top of it.
const PANEL_HOVER_CLASS =
  "absolute rounded-2xl bg-transparent transition duration-200 ease-out hover:bg-white/[0.06] hover:shadow-[0_0_0_2px_rgba(91,155,255,0.55),0_0_28px_6px_rgba(91,155,255,0.5)]";

// Covers the baked placeholder ID text ("P-000002") on the mastered
// UI asset with a patch matching the card's sampled background
// colour, then renders the real, dynamic profiles.polar_id in its
// place — the asset supplies 100% of the visual design, this is the
// one exception since the ID must never be baked into production.
const POLAR_ID_PATCH_BOX = { left: "43.66%", top: "43.04%", width: "16.15%", height: "7.97%" };

export default async function ClientDashboardPage() {
  const { supabase, user } = await requireRole("client");

  const { data: profile } = await supabase
    .from("profiles")
    .select("polar_id")
    .eq("id", user.id)
    .maybeSingle();

  const polarId = profile?.polar_id ?? POLAR_ID_PLACEHOLDER;

  return (
    <>
      {/* Mobile/tablet — simple functional placeholder. The approved
          mobile dashboard design is separate, upcoming work. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">Client Dashboard</h1>
        <p className="mt-2 text-sm text-polar-muted">Signed in as {user.email}.</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          <li>
            <Link href="/dashboard/client/book" className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text">
              Book Appointment
            </Link>
          </li>
          <li>
            <Link href="/dashboard/client/bookings" className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text">
              My Bookings
            </Link>
          </li>
        </ul>
      </main>

      {/* Desktop — two-asset architecture: the room background plus
          the mastered, fully-designed transparent UI overlay
          (polar-client-dashboard-ui-asset-mastered.png). No CSS is
          used to draw the panels/card — that visual design lives
          entirely in the overlay PNG. The only real HTML on top is
          (a) invisible click targets positioned over the baked Book
          Appointment / Appointment History panels, and (b) a small
          patch over the overlay's baked placeholder ID so the real,
          live profiles.polar_id can render there instead.

          The overlay (plus its click targets/patch) is scaled down
          to OVERLAY_SCALE of the background's width and centred
          within it via equal insets on all four sides — since the
          background box already holds the artwork's exact 1672:941
          aspect ratio, shrinking every side by the same percentage
          preserves that ratio automatically without stretching. */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full aspect-[1672/941]">
            <Image
              src="/dashboard/polar-client-dashboard-desktop-background.png"
              alt=""
              fill
              priority
              className="object-cover"
              aria-hidden="true"
            />

            <div className="absolute" style={OVERLAY_INSET}>
              <Image
                src="/dashboard/polar-client-dashboard-ui-asset-mastered.png"
                alt=""
                fill
                priority
                className="object-contain"
                aria-hidden="true"
              />

              {/* Real, dynamic POLAR ID patched over the baked
                  placeholder — never baked into production. */}
              <div className="absolute" style={POLAR_ID_PATCH_BOX}>
                <div className="absolute inset-0" style={{ backgroundColor: "#E2F1FB" }} aria-hidden="true" />
                <p
                  className="relative flex h-full w-full items-center whitespace-nowrap font-body font-extrabold text-black"
                  style={{ fontSize: `${3.4 * OVERLAY_SCALE}vw`, lineHeight: 1 }}
                >
                  {polarId}
                </p>
              </div>

              {CLICK_TARGETS.map(({ href, label, box }) => (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  className={`${PANEL_HOVER_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light`}
                  style={box}
                />
              ))}

              {INERT_HOVER_PANELS.map(({ label, box }) => (
                <div key={label} aria-hidden="true" className={PANEL_HOVER_CLASS} style={box} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
