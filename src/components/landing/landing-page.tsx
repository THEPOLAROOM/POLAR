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
// grid-rows-[minmax(0,1fr)_auto] is what guarantees the footer's own
// (auto) height is reserved first, on every render, at every viewport
// size — the carousel row then gets exactly whatever's left via 1fr,
// and can never claim more than that. min-h-0 on the 1fr track is
// required: a grid row's default min-height is `auto` (its content's
// intrinsic size), which would otherwise refuse to shrink the row
// below the artwork's natural size and defeat the whole "always fit
// inside the real viewport" goal. CarouselRow fills that track exactly
// (both axes) and lets each slide's own object-contain do the actual
// letterboxing within it — see carousel-row.tsx for why this replaced
// an earlier per-slide reactive-sizing approach that could let the row
// overshoot the space actually available at short viewports.
//
// Scoped entirely to this component — root layout/globals.css are
// untouched, so dashboards and every other route are unaffected.
export function LandingPage() {
  return (
    <div
      className={`${anton.variable} ${geist.variable} grid h-dvh grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-ice-50 font-body text-navy`}
    >
      <CarouselRow slides={SLIDES} />
      <Footer />
    </div>
  );
}
