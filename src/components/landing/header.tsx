import Link from "next/link";
import { CAROUSEL_ARTWORK_ASPECT_RATIO } from "./artwork";

// Persistent global header — POLAR logo/Home, Login, Sign Up. Rendered
// as an absolute-fill overlay sibling of <Carousel> (see
// landing-page.tsx) rather than as a separate document-flow row, so it
// never consumes its own share of the 100dvh shell's height. Because
// it lives outside the carousel's horizontally-scrolling track, it is
// already immune to slide transitions with no extra work — only the
// carousel's own content moves.
//
// Page 1 (THEPOLAROOM-CAROUSELS.png) still has the logo/Login/Sign Up
// baked into its own artwork underneath this overlay, temporarily —
// the hit-area boxes below are measured directly against that
// artwork's own 4800x2878 canvas (pixel-level colour-boundary scan of
// the baked logo/button edges). Because Page 2 onward can now have a
// different native aspect ratio than Page 1 (the carousel no longer
// forces every slide into one shared box — each <CarouselImageSlide>
// letterboxes itself via object-contain independently), this
// component builds its own internal box locked to Page 1's specific
// ratio so the percentage math below still lands correctly, instead of
// relying on an outer wrapper that used to do this for it. This inner
// box resolves to the exact same rectangle Page 1's own image
// independently centers itself into (same ratio, same outer
// container), so the two stay pixel-aligned without coordinating
// directly. Pages 2 onward are exported WITHOUT baked controls at all
// (a reserved safe area instead), so they render underneath this same
// overlay with nothing to align against — no per-page re-measurement
// needed there.
const LOGO_BOX = { left: "2.92%", top: "2.43%", width: "10.83%", height: "11.99%" };
const LOGIN_BOX = { left: "74.46%", top: "2.02%", width: "10.33%", height: "5.35%" };
const SIGNUP_BOX = { left: "86.25%", top: "2.02%", width: "11.46%", height: "5.21%" };

const HIT_AREA_CLASS =
  "pointer-events-auto absolute rounded-full bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal";

export function Header() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div
        className="relative h-full max-w-full"
        style={{ aspectRatio: CAROUSEL_ARTWORK_ASPECT_RATIO }}
      >
        <Link href="/" aria-label="POLAR Home" className={HIT_AREA_CLASS} style={LOGO_BOX} />
        <Link href="/login" aria-label="Log In" className={HIT_AREA_CLASS} style={LOGIN_BOX} />
        <Link href="/signup" aria-label="Sign Up" className={HIT_AREA_CLASS} style={SIGNUP_BOX} />
      </div>
    </div>
  );
}
