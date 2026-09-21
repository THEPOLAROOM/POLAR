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
// Page 1 (page-01-hero-v2.png) still has the logo/Login/Sign Up baked
// into its own artwork underneath this overlay, temporarily — the
// hit-area boxes below are measured directly against that artwork's
// own 16250x6750 canvas, footer band already cropped off (see
// artwork.ts) (pixel-level colour-boundary scan of the baked
// logo/button edges — the Sign Up box specifically used a connected-
// component flood fill from a seed inside the button ring, since a
// simple threshold scan also caught a disconnected pink neon light
// fixture in the artwork's background near that button). Because Page
// 2 onward can now have a
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
//
// IMPORTANT — two confirmed-live bugs were fixed here, both from
// trying to make a plain <div> self-letterbox like object-fit:contain
// does for a real <img>:
//
// 1) `h-full` (explicit height:100%) + aspectRatio + max-w-full: when
//    the aspect-ratio-derived width exceeds the row's width, max-w-full
//    clamps it back down, but the browser does NOT recompute height to
//    match — the box silently becomes the row's full, un-letterboxed
//    size instead of the smaller centered rectangle the image actually
//    renders into, throwing every hit-area's percentage off by the
//    letterbox margin. (This was dormant while Page 1's artwork ratio
//    was narrower than the carousel row at every tested resolution —
//    i.e. always height-constrained — and only surfaced once Page 1's
//    artwork became wider than the row, i.e. width-constrained.)
// 2) Leaving BOTH width and height as `auto` (constraining only via
//    max-w-full/max-h-full) collapses the box to 0x0: a flex item under
//    `items-center` sizes to its own content, aspect-ratio alone can't
//    conjure a size from nothing, and this div has no in-flow content
//    (its children are all position:absolute).
//
// The fix below sets width explicitly to 100% (definite, matches the
// row's width — correct because Page 1's artwork is wider than every
// tested carousel row, i.e. always width-constrained, so it always
// fills the row's full width with letterboxing only top/bottom) and
// leaves height auto-derived from aspectRatio, with max-h-full kept
// only as a defensive cap. This exactly matches where Page 1's own
// <Image object-contain> independently renders at every resolution in
// POLAR's required desktop test matrix (1366x768 through 2560x1440).
// If a future Page 1 redesign ever makes the artwork narrower than the
// row (height-constrained instead), this specific approach would need
// revisiting — width:100% doesn't self-correct for that case the way
// object-contain does.
const LOGO_BOX = { left: "3.07%", top: "5.08%", width: "8.44%", height: "12.76%" };
const LOGIN_BOX = { left: "79.72%", top: "4.67%", width: "7.72%", height: "5.85%" };
const SIGNUP_BOX = { left: "89.35%", top: "4.76%", width: "8.20%", height: "5.76%" };

const HIT_AREA_CLASS =
  "pointer-events-auto absolute rounded-full bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal";

export function Header() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div
        className="relative w-full max-h-full"
        style={{ aspectRatio: CAROUSEL_ARTWORK_ASPECT_RATIO }}
      >
        <Link href="/" aria-label="POLAR Home" className={HIT_AREA_CLASS} style={LOGO_BOX} />
        <Link href="/login" aria-label="Log In" className={HIT_AREA_CLASS} style={LOGIN_BOX} />
        <Link href="/signup" aria-label="Sign Up" className={HIT_AREA_CLASS} style={SIGNUP_BOX} />
      </div>
    </div>
  );
}
