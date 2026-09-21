import { Anton, Geist } from "next/font/google";
import { Header } from "./header";
import { Carousel } from "./carousel";
import { PanelWelcome } from "./panels/panel-01-welcome";
import { Footer } from "./footer";

// Fonts are loaded and scoped here only (via CSS variables on this
// subtree's wrapper), not in the root layout — dashboards keep their
// existing default typography untouched.
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

// Old slides 2-6 (Why/Card/Workflow/How/Ready) are deliberately removed
// from this live configuration — Pages 2-5 are being redesigned and
// will be supplied individually, one at a time, into this same shell.
// Their component files and image assets are untouched on disk (see
// src/components/landing/panels/) and can be re-added here later; the
// carousel engine itself (src/components/landing/carousel.tsx)
// requires no changes to accept them when that happens.
const SLIDES = [
  { id: "welcome", label: "Welcome to POLAR", content: <PanelWelcome /> },
];

// Single-screen desktop shell: header/global UI is an overlay (not its
// own row — see below), carousel gets exactly the remaining height,
// footer is a real, compact, independent row. h-dvh + overflow-hidden
// enforces "no homepage scrolling" as a hard constraint rather than a
// hope; if any child ever miscalculates, this reveals it as clipped
// content during testing instead of silently allowing a scrollbar.
// Scoped entirely to this component — root layout/globals.css are
// untouched, so dashboards and every other route are unaffected.
export function LandingPage() {
  return (
    <div
      className={`${anton.variable} ${geist.variable} grid h-dvh grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-ice-50 font-body text-navy`}
    >
      {/* Carousel row — gets whatever height remains once the footer's
          own (auto) height is subtracted. min-h-0 is required here: a
          grid row's default min-height is `auto` (its content's
          intrinsic size), which would otherwise prevent this row from
          ever shrinking below the artwork's natural size and defeat
          the whole "fit inside 100dvh" goal. */}
      <div className="relative min-h-0 overflow-hidden">
        {/* WIDTH-FILL TEST (temporary, not yet the approved default):
            the artwork's own aspect ratio is no longer locked here —
            this box is simply the full carousel row (100% width, 100%
            of the unchanged row height). CarouselImageSlide now uses
            object-fill instead of object-contain, so the image
            stretches horizontally to fill this full-width box while
            its height stays exactly what the row already gives it —
            no letterboxing, no proportional height increase, no crop.
            Header's hit-area percentages still land correctly on the
            baked artwork: percentage-based positions are preserved
            under independent per-axis scaling, so stretching the image
            horizontally moves its baked buttons by the same factor as
            the percentage boxes measured against them. */}
        <div className="relative h-full w-full">
          <Carousel slides={SLIDES} />
          <Header />
        </div>
      </div>

      <Footer />
    </div>
  );
}
