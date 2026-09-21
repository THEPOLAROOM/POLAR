import Link from "next/link";

// Persistent global header — POLAR logo/Home, Login, Sign Up. Rendered
// as an overlay on top of the carousel's own aspect-locked box (see
// landing-page.tsx, which sizes that shared box once and renders this
// component as a plain absolute-fill sibling of <Carousel> inside it
// — no aspect-ratio/centering math is duplicated here) rather than as
// a separate document-flow row, so it never consumes its own share of
// the 100dvh shell's height. Because it lives outside the carousel's
// horizontally-scrolling track, it is already immune to slide
// transitions with no extra work — only the carousel's own content
// moves.
//
// Page 1 (THEPOLAROOM-CAROUSELS.png) still has the logo/Login/Sign Up
// baked into its own artwork underneath this overlay, temporarily —
// the boxes below are measured directly against that artwork's own
// 4800x2878 canvas (pixel-level colour-boundary scan of the baked
// logo/button edges) so the real controls land exactly on top of it.
// Each hit-area is fully transparent — the baked artwork supplies
// 100% of what's visible, so there is no risk of a doubled/duplicate
// visual. Pages 2 onward are being exported WITHOUT these baked
// controls at all (a reserved safe area instead), so this same
// unchanged overlay — same position, same component — will sit
// correctly over them too without any per-page re-measurement.
const LOGO_BOX = { left: "2.92%", top: "2.43%", width: "10.83%", height: "11.99%" };
const LOGIN_BOX = { left: "74.46%", top: "2.02%", width: "10.33%", height: "5.35%" };
const SIGNUP_BOX = { left: "86.25%", top: "2.02%", width: "11.46%", height: "5.21%" };

const HIT_AREA_CLASS =
  "pointer-events-auto absolute rounded-full bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal";

export function Header() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <Link href="/" aria-label="POLAR Home" className={HIT_AREA_CLASS} style={LOGO_BOX} />
      <Link href="/login" aria-label="Log In" className={HIT_AREA_CLASS} style={LOGIN_BOX} />
      <Link href="/signup" aria-label="Sign Up" className={HIT_AREA_CLASS} style={SIGNUP_BOX} />
    </div>
  );
}
