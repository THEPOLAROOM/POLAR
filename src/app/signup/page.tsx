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
          exact 3840x2160 (16:9), replacing the earlier 1672x941 asset.
          `width: min(100%, calc(100dvh * 16/9))` (not the old
          `w-full max-h-screen`) — CSS aspect-ratio only derives the
          dimension that ISN'T already explicit, so pairing an explicit
          `width:100%` with a separate `max-height` cap lets the two
          disagree the moment the cap actually bites: height gets
          clamped but width silently stays at 100%, breaking the box's
          own ratio and reintroducing exactly the navy side-gap bug
          this file's mobile section already fixed once before (see
          that comment below) — confirmed live at 1920x1080, where a
          real browser's actual content viewport (chrome/tabs eat
          vertical space) is measurably wider-than-16:9, not narrower.
          `min(...)` picks the true binding constraint up front, so the
          box's rendered shape is always exactly 16:9, on every screen,
          with no separate cap needed. */}
      <div className="hidden h-full w-full items-center justify-center sm:flex">
        <div className="relative aspect-[16/9]" style={{ width: "min(100%, calc(100dvh * 16 / 9))" }}>
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
