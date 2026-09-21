import { Anton, Geist } from "next/font/google";
import { CarouselRow } from "./carousel-row";
import type { Slide } from "./carousel";
import { Footer } from "./footer";

// Fonts are loaded and scoped here only (via CSS variables on this
// subtree's wrapper), not in the root layout — dashboards keep their
// existing default typography untouched.
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

// Carousel intentionally emptied — both Page 1 and Page 2 were removed
// from the live carousel while the owner redesigns them as pure
// artwork (no baked UI) against the locked 13:6 / 5200x2400 contract.
// Their component files (panels/panel-01-welcome.tsx,
// panels/panel-02-why.tsx) and every image asset are untouched on
// disk, simply unreferenced here — re-add a slide entry (with its
// `lockAspectRatio`/`logoVariant`) to bring a page back once its new
// artwork is ready. The permanent shell (CarouselRow/Header/Carousel)
// requires no changes to accept them when that happens — see
// carousel-row.tsx for how it stays fully visible and functional with
// this array empty.
const SLIDES: Slide[] = [];

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
