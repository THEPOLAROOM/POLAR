import Link from "next/link";
import Image from "next/image";
import { requireRole } from "@/lib/auth/require-role";

// Same layered approach as the Barber Dashboard
// (src/app/dashboard/barber/page.tsx): Layer 1 = full-bleed
// background (decorative only, independent of UI sizing), Layer 2 =
// the locked, mastered transparent UI PNG (the sole visual source of
// truth — no cards/icons/typography are recreated in CSS), Layer 3 =
// real hit areas/data on top. The dashboard's background is reused
// here (no dedicated My Profile background asset was supplied).
//
// SIZING: unlike the dashboard, this page's own numbers are NOT
// copied from it — the mastered asset
// (public/dashboard/polar-your-profile-dashboard.png) happens to
// genuinely be 1672x941 too (verified via its own file metadata), so
// the same aspect-ratio/viewport-fit formula is correct here because
// it matches this asset, not because it was assumed. There is no
// extra "OVERLAY_SCALE" shrink/inset applied on top: the asset already
// has its own baked-in margin (~2.5% left/right, ~11% top, ~7%
// bottom of its own 1672x941 canvas), so it is rendered via
// object-contain at the full size of the viewport-fit box.
const ASSET_ASPECT = "1672 / 941";

// Every box below is measured directly against the mastered asset's
// own 1672x941 canvas (pixel-level border scan), same technique used
// for the Barber Dashboard overlay.
const ROW1_TOP = "49.20%";
const ROW2_TOP = "71.52%";
const ROW_HEIGHT = "21.4%";
const COL_A = { left: "2.75%", width: "31.46%" };
const COL_B = { left: "34.75%", width: "30.44%" };
const COL_C = { left: "65.79%", width: "31.52%" };

const PHOTO_BOX = { left: "5.53%", top: "16.90%", width: "16.45%", height: "29.23%" };
const EDIT_HEADER_BOX = { left: "74.34%", top: "38.79%", width: "20.57%", height: "6.91%" };

// Only "Years Experience" has a real backing field
// (barber_professional_details.years_experience). Happy Clients and
// Achievements have no schema/tracking anywhere, so the asset's own
// baked "0" for those is left exactly as-is (genuinely accurate, not
// invented). This patch box covers just the baked digit, sampled from
// the card's own background colour, matching the same
// real-data-over-baked-placeholder technique already used for the
// Client Dashboard's POLAR ID.
const YEARS_EXPERIENCE_PATCH_BOX = { left: "68.54%", top: "24.44%", width: "3.3%", height: "3.4%" };
const STAT_PATCH_FILL = "#010d1d";

const HOVER_CLASS =
  "absolute rounded-2xl bg-transparent transition duration-200 ease-out hover:bg-white/[0.06] hover:shadow-[0_0_0_2px_rgba(91,155,255,0.55),0_0_28px_6px_rgba(91,155,255,0.5)]";

// The two sections with real, existing forms/data link to their
// (unchanged, not redesigned) pages. The other four have no backend
// yet, so — same precedent as the Dashboard's backend-less Emergency
// action — they stay hover-only, not navigating anywhere invented.
const CARDS = [
  { key: "personal", href: "/dashboard/barber/account/personal-details", top: ROW1_TOP, box: COL_A },
  { key: "professional", href: "/dashboard/barber/account/professional-profile", top: ROW1_TOP, box: COL_B },
  { key: "qualifications", href: null, top: ROW1_TOP, box: COL_C },
  { key: "eportfolio", href: null, top: ROW2_TOP, box: COL_A },
  { key: "visibility", href: null, top: ROW2_TOP, box: COL_B },
  { key: "emergency", href: null, top: ROW2_TOP, box: COL_C },
] as const;

// Server-side ROLE check happens FIRST, same as every other protected
// barber page.
export default async function BarberAccountPage() {
  const { supabase, user } = await requireRole("barber");

  const { data: professional } = await supabase
    .from("barber_professional_details")
    .select("years_experience")
    .eq("profile_id", user.id)
    .maybeSingle();

  const yearsExperience = professional?.years_experience ?? 0;

  return (
    <div id="barber-profile-page">
      {/* Same technique as the Barber Dashboard: the shared barber nav
          lives in layout.tsx, which every other barber route still
          needs, so it's hidden for this specific page only via this
          scoped rule rather than editing the shared layout. */}
      <style>{`
        div:has(> #barber-profile-page) > nav {
          display: none;
        }
      `}</style>

      {/* Mobile — simple functional placeholder; the immersive layered
          design below is desktop-only, matching the Barber Dashboard. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">My Profile</h1>
        <p className="mt-2 text-sm text-polar-muted">Signed in as {user.email}.</p>
        <ul className="mt-6 space-y-2">
          <li>
            <Link href="/dashboard/barber/account/personal-details" className="block rounded border border-polar-border px-3 py-2 text-sm text-polar-text">
              Personal Details
            </Link>
          </li>
          <li>
            <Link href="/dashboard/barber/account/professional-profile" className="block rounded border border-polar-border px-3 py-2 text-sm text-polar-text">
              Professional Profile &amp; CV
            </Link>
          </li>
        </ul>
      </main>

      {/* Desktop — identical fixed-viewport philosophy as the Barber
          Dashboard (100dvh, overflow-hidden, no scroll), but the box's
          own aspect ratio/size is derived from this asset's actual
          1672x941 dimensions rather than assumed. */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <Image
          src="/dashboard/polar-barber-dashboard-background.png"
          alt=""
          fill
          priority
          className="object-cover"
          aria-hidden="true"
        />

        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div
            className="relative"
            style={{ width: `min(100%, calc(100dvh * ${ASSET_ASPECT}))`, aspectRatio: ASSET_ASPECT }}
          >
            <Image
              src="/dashboard/polar-your-profile-dashboard.png"
              alt="My Profile"
              fill
              priority
              className="object-contain"
            />

            {/* Add Photo — no avatar field exists yet, so this is
                hover-only for V1, same treatment as the sections
                below with no backend. */}
            <div aria-hidden="true" className={HOVER_CLASS} style={PHOTO_BOX} />

            {CARDS.map(({ key, href, top, box }) =>
              href ? (
                <Link
                  key={key}
                  href={href}
                  className={`${HOVER_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light`}
                  style={{ top, height: ROW_HEIGHT, ...box }}
                />
              ) : (
                <div key={key} aria-hidden="true" className={HOVER_CLASS} style={{ top, height: ROW_HEIGHT, ...box }} />
              )
            )}

            {/* Edit Header — no single field/route owns everything the
                header shows, so (matching the Dashboard's Emergency
                precedent) this stays hover-only rather than inventing
                a destination. */}
            <div aria-hidden="true" className={HOVER_CLASS} style={EDIT_HEADER_BOX} />

            {/* Real Years Experience, patched over the baked "0". */}
            <div className="absolute flex items-center justify-center" style={YEARS_EXPERIENCE_PATCH_BOX}>
              <div className="absolute inset-0" style={{ backgroundColor: STAT_PATCH_FILL }} aria-hidden="true" />
              <p className="relative font-body font-black leading-none text-white" style={{ fontSize: "1.1vw" }}>
                {yearsExperience}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
