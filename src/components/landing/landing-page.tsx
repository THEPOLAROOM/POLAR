import { Anton, Geist } from "next/font/google";
import { CarouselRow } from "./carousel-row";
import type { Slide } from "./carousel";
import { PanelWelcome } from "./panels/panel-01-welcome";
import { Footer } from "./footer";

// Fonts are loaded and scoped here only (via CSS variables on this
// subtree's wrapper), not in the root layout — dashboards keep their
// existing default typography untouched.
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

// Page 1 reinstated as pure artwork (no baked UI) against the locked
// 13:6 / 5200x2400 contract — its own export measures 16250x7500, an
// exact match, 0% deviation. Its top-left brightness (250/255,
// near-white) sets logoVariant to "dark". Page 2 remains removed from
// the live carousel (panels/panel-02-why.tsx and its assets are
// untouched on disk, simply unreferenced) while its own artwork-only
// redesign is pending — re-add its slide entry the same way once
// ready. The permanent shell requires no changes to accept it.
const SLIDES: Slide[] = [
  {
    id: "welcome",
    label: "Welcome to POLAR",
    content: <PanelWelcome />,
    lockAspectRatio: "13 / 6",
    logoVariant: "dark",
  },
];

// Single-screen desktop shell: header/global UI is an overlay inside
// CarouselRow (not its own row), footer is a real, compact, independent
// row directly beneath it. h-dvh + overflow-hidden enforces "no
// homepage scrolling" as a hard constraint rather than a hope; if any
// child ever miscalculates, this reveals it as clipped content during
// testing instead of silently allowing a scrollbar.
//
// flex-col + justify-center (rather than the previous CSS grid) is
// what lets CarouselRow's reactive height work: whenever the active
// slide sets lockAspectRatio (every slide currently in SLIDES), the
// row sizes itself intrinsically to that exact ratio instead of
// filling all available height, and justify-center automatically
// distributes any leftover viewport space evenly above and below the
// whole [row + footer] block, with zero gap between the row and the
// footer themselves (footer is just the next sibling). A slide with no
// lockAspectRatio would instead fall back to the row filling all
// remaining height (today's SLIDES has no such entry) — see
// carousel-row.tsx. No manual margin math needed in either case.
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
