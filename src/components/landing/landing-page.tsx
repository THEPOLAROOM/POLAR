import { Anton, Geist } from "next/font/google";
import { Header } from "./header";
import { Carousel } from "./carousel";
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
const SLIDES = [
  { id: "welcome", label: "Welcome to POLAR", content: <PanelWelcome /> },
  { id: "why", label: "Why POLAR?", content: <PanelWhy /> },
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
          the whole "fit inside 100dvh" goal.

          Carousel and Header are plain h-full/w-full siblings here —
          neither this row nor either child locks a single shared
          aspect ratio for every slide. Each <CarouselImageSlide> (see
          carousel-image-slide.tsx) already letterboxes itself against
          its own natural/intrinsic dimensions via object-contain, so
          slides with different native ratios (Page 1 vs Page 2) each
          render correctly without one forcing its shape onto the
          other. Header independently locks to Page 1's specific ratio
          internally (see header.tsx) purely so its percentage-based
          hit-areas keep landing on Page 1's still-baked buttons. */}
      <div className="relative flex min-h-0 items-center justify-center overflow-hidden">
        <Carousel slides={SLIDES} />
        <Header />
      </div>

      <Footer />
    </div>
  );
}
