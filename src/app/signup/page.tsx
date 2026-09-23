import Image from "next/image";
import Link from "next/link";

// POLAR 2-way signup portal. The artwork (public/signup/portal-*) is
// approved, final creative — rendered as-is, never recreated in CSS.
// Only two things are added on top: transparent, fully clickable
// <Link> regions positioned over the Client/Barber doors, plus a
// hover/press-only glow on each door region. Routes to the existing,
// unchanged /signup/client and /signup/barber flows.
//
// Desktop artwork was replaced with a new 3840x2160 (exact 16:9)
// master (portal-desktop-v2.webp); the old 1672x941 portal-desktop.png
// is superseded and kept on disk, no longer referenced. Neither
// version has a baked-in "Back to Home" element, so no overlay is
// added for it here (same as mobile, which never had one either).
// Mobile artwork/layout is untouched by that change.
const GLOW =
  "transition rounded-2xl hover:shadow-[0_0_45px_12px_rgba(11,95,255,0.35),0_0_80px_24px_rgba(255,61,154,0.15)] active:shadow-[0_0_35px_10px_rgba(11,95,255,0.45),0_0_60px_18px_rgba(255,61,154,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default function SignupPortalPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-navy sm:h-screen">
      {/* Desktop / tablet artwork — new mastered artwork
          (WWW.THEPOLAROOM.COM-SIGNUP-PAGE.png, converted to WebP), an
          exact 3840x2160 (16:9). `width: max(100%, calc(100dvh * 16/9))`
          — the crop-to-fill counterpart of the mobile section's own
          `max(100%, calc(100dvh * 1024/1536))` formula below, generalised
          to whichever axis actually needs to grow. On the common real
          desktop case (measured live: an ordinary, non-fullscreen
          browser window's actual content viewport — after tabs/address
          bar — is wider-than-16:9, e.g. 1920x1080 → ~1890x985,
          ratio ~1.92), `calc(100dvh*16/9)` resolves smaller than 100%,
          so max() picks 100% width, height is then derived from that
          same 100% via aspect-ratio and comes out taller than 100dvh —
          it's allowed to overflow and gets cropped symmetrically
          top/bottom by this row's own `overflow-hidden` + centering
          (the exact technique /login's tablet composition already
          uses). On the rarer narrower-than-16:9 case (e.g. 1440x900 at
          ~1410x805, ratio ~1.75 — previously a real top/bottom GAP
          under the old `min(...)` formula), `calc(100dvh*16/9)` now
          resolves LARGER than 100%, so max() switches strategy: width
          overflows instead, cropped symmetrically left/right, height
          exactly fills 100dvh. Either way the box's rendered shape
          stays true, undistorted 16:9 — never gaps, never stretches —
          and the door hit-boxes below (positioned as % of this same
          box, which always represents the FULL uncropped artwork, just
          partially off-screen on whichever axis overflows) stay
          correctly aligned with zero recalibration needed, for the
          same reason the mobile hit-boxes already didn't need it. */}
      <div className="hidden h-full w-full items-center justify-center overflow-hidden sm:flex">
        {/* shrink-0 is load-bearing: this box is a flex child, and a
            flex item's default flex-shrink:1 uses its own `width` as a
            flex-basis it's then allowed to compress back down to fit
            the container — silently undoing the max() overflow above
            and reproducing the exact same gap this fix exists to
            remove (confirmed live: without shrink-0, the 1440x900 case
            still showed an 11.9px top/bottom gap despite the correct
            max() value, because flex-shrink was quietly re-shrinking
            the box to 100% width behind the scenes). Mobile's
            equivalent box never needed this because it's positioned
            `absolute`, not a flex child. */}
        <div className="relative aspect-[16/9] shrink-0" style={{ width: "max(100%, calc(100dvh * 16 / 9))" }}>
          <Image
            src="/signup/portal-desktop-v2.webp"
            alt="POLAR — Join the Room. Two doors: I'm a Client, I'm a Barber."
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />

          {/* Door hit-boxes re-measured directly against this new
              artwork's own 3840x2160 canvas (column/row scan for the
              blue/magenta neon door-frame edges — the frame's outer
              glow, not just the panel interior, so the whole lit
              border is clickable too), replacing the old asset's
              coordinates. */}
          <Link
            href="/signup/client"
            aria-label="I'm a Client — book, be seen, feel sharper"
            className={GLOW}
            style={{ position: "absolute", left: "30.42%", top: "30.74%", width: "18.80%", height: "48.15%" }}
          />
          <Link
            href="/signup/barber"
            aria-label="I'm a Barber — build, grow, be recognised"
            className={GLOW}
            style={{ position: "absolute", left: "51.07%", top: "30.69%", width: "17.99%", height: "48.98%" }}
          />
        </div>
      </div>

      {/* Mobile artwork — the artwork (1024:1536, ~0.667 w/h) is
          proportionally wider-relative-to-height than a real phone
          viewport (~0.46-0.56 w/h), so fitting it by WIDTH always
          left it short of the full viewport height (the earlier
          navy-gap bug). Sized by HEIGHT instead (fills 100dvh),
          letting the resulting width exceed the viewport — cropped
          symmetrically by the parent's overflow-hidden. Centring
          uses an explicit left:50% + translate(-50%) (rather than
          margin:auto on an overflowing box) since that's the
          unambiguous way to guarantee a perfectly symmetric crop
          regardless of mobile browser quirks with auto-margins on
          elements wider than their container. */}
      <div
        className="absolute left-1/2 top-0 block -translate-x-1/2 sm:hidden"
        style={{ width: "max(100%, calc(100dvh * 1024 / 1536))" }}
      >
        <div className="relative aspect-[1024/1536] w-full">
          <Image
            src="/signup/portal-mobile.png"
            alt="POLAR — Join the Room. Two doors: I'm a Client, I'm a Barber."
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />

          <Link
            href="/signup/client"
            aria-label="I'm a Client — book, be seen, feel sharper"
            className={GLOW}
            style={{ position: "absolute", left: "20.51%", top: "19.53%", width: "59.57%", height: "27.99%" }}
          />
          <Link
            href="/signup/barber"
            aria-label="I'm a Barber — build, grow, be recognised"
            className={GLOW}
            style={{ position: "absolute", left: "20.51%", top: "51.43%", width: "59.57%", height: "27.99%" }}
          />
        </div>
      </div>
    </main>
  );
}
