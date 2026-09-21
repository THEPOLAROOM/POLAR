import { Anton, Geist } from "next/font/google";
import { CarouselRow } from "./carousel-row";
import { PanelWelcome } from "./panels/panel-01-welcome";
import { PanelWhy } from "./panels/panel-02-why";
import { Footer } from "./footer";

// Fonts are loaded and scoped here only (via CSS variables on this
// subtree's wrapper), not in the root layout — dashboards keep their
// existing default typography untouched.
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

// Old slides 3-6 (Card/Workflow/How/Ready) are deliberately removed
// from this live configuration — they are being redesigned and will be
// supplied individually, one at a time, into this same shell. Their
// component files and image assets are untouched on disk (see
// src/components/landing/panels/) and can be re-added here later; the
// carousel engine itself (src/components/landing/carousel.tsx)
// requires no changes to accept them when that happens.
//
// Page 1 has no lockAspectRatio: it keeps the original fill behavior
// exactly as before (row fills all remaining height, artwork
// letterboxes within it via object-contain) — deliberately left
// unchanged. Page 2's artwork is exactly 13:6 (5200x2400, supplied
// as-is, not modified) and matches the carousel's master format, so
// locking the row itself to that ratio when Page 2 is active gives it
// a zero-gap fit — see carousel-row.tsx for how this reactive sizing
// works and why it's scoped to Page 2 only.
const SLIDES = [
  { id: "welcome", label: "Welcome to POLAR", content: <PanelWelcome /> },
  { id: "why", label: "Why POLAR?", content: <PanelWhy />, lockAspectRatio: "13 / 6" },
];

// Single-screen desktop shell: header/global UI is an overlay inside
// CarouselRow (not its own row), footer is a real, compact, independent
// row directly beneath it. h-dvh + overflow-hidden enforces "no
// homepage scrolling" as a hard constraint rather than a hope; if any
// child ever miscalculates, this reveals it as clipped content during
// testing instead of silently allowing a scrollbar.
//
// flex-col + justify-center (rather than the previous CSS grid) is
// what lets CarouselRow's reactive height work: when the active slide
// fills all available height (Page 1, default), the column's content
// already equals 100% of the viewport and centering has no visible
// effect — identical to the old grid's minmax(0,1fr) behavior. When
// the active slide is intrinsically sized instead (Page 2's locked
// 13:6 row), the column's content is shorter than 100dvh, and
// justify-center automatically distributes the leftover space evenly
// above and below the whole [row + footer] block, with zero gap
// between the row and the footer themselves (footer is just the next
// sibling). No manual margin math needed in either case.
//
// Scoped entirely to this component — root layout/globals.css are
// untouched, so dashboards and every other route are unaffected.
export function LandingPage() {
  return (
    <div
      className={`${anton.variable} ${geist.variable} flex h-dvh flex-col justify-center overflow-hidden bg-ice-50 font-body text-navy`}
    >
      <CarouselRow slides={SLIDES} />
      <Footer />
    </div>
  );
}
