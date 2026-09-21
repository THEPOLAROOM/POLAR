import { Anton, Geist } from "next/font/google";
import { Header } from "./header";
import { Carousel } from "./carousel";
import { PanelWelcome } from "./panels/panel-01-welcome";
import { Footer } from "./footer";
import { CAROUSEL_ARTWORK_ASPECT_RATIO } from "./artwork";

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
      <div className="relative flex min-h-0 items-center justify-center overflow-hidden">
        {/* The one shared box every carousel page sizes itself against:
            locked to the master artwork's own aspect ratio, capped by
            the available height first (so wide/ultrawide viewports
            don't stretch it unnecessarily) with max-w-full as a safety
            net for any untested extreme window shape. Carousel and
            Header are both plain siblings that simply fill this
            already-sized box — neither duplicates this aspect-ratio
            calculation itself. */}
        <div
          className="relative h-full max-w-full"
          style={{ aspectRatio: CAROUSEL_ARTWORK_ASPECT_RATIO }}
        >
          <Carousel slides={SLIDES} />
          <Header />
        </div>
      </div>

      <Footer />
    </div>
  );
}
