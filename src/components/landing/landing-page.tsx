import { Anton, Geist } from "next/font/google";
import { CarouselRow } from "./carousel-row";
import type { Slide } from "./carousel";
import { PanelWelcome } from "./panels/panel-01-welcome";
import { PanelWhy } from "./panels/panel-02-why";
import { Footer } from "./footer";

// Fonts are loaded and scoped here only (via CSS variables on this
// subtree's wrapper), not in the root layout — dashboards keep their
// existing default typography untouched.
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

// Both pages are pure artwork (no baked UI) against the locked 13:6 /
// 5200x2400 contract — each export measures 16250x7500, an exact
// match, 0% deviation. Both use the identical permanent-shell sizing
// method (CarouselRow/Header — see carousel-row.tsx and header.tsx),
// unmodified between them; only `content` (the artwork) and
// `logoVariant` differ per slide. Page 1's top-left brightness
// (250/255) and Page 2's (249/255) are both near-white, so both take
// the dark logo variant.
const SLIDES: Slide[] = [
  {
    id: "welcome",
    label: "Welcome to POLAR",
    content: <PanelWelcome />,
    logoVariant: "dark",
  },
  {
    id: "why",
    label: "Why POLAR?",
    content: <PanelWhy />,
    logoVariant: "dark",
  },
];

// Single-screen desktop shell: header/global UI is an overlay inside
// CarouselRow (not its own row), footer is a real, compact, independent
// row directly beneath it.
//
// min-h-dvh + flex-col + justify-center (not a fixed h-dvh, and no
// overflow-hidden on the vertical axis): the carousel row is always
// sized to width:100% with its height purely derived from the locked
// 13:6 ratio (see carousel-row.tsx) — never shrunk to fit, never
// letterboxed — so the artwork always fills the full width with zero
// left/right gaps, at every viewport size. When that intrinsic height
// plus the footer's own height fits within the viewport (true at
// every one of the 5 required desktop resolutions, and at ordinary
// maximized real browser windows), min-h-dvh's floor is exactly met
// and justify-center distributes the small leftover as a symmetric
// margin above/below the whole [row + footer] block, same as before.
// When it doesn't fit — an unusually short real browser window, where
// real chrome eats enough vertical space that full-width + intrinsic
// height would otherwise force cropping or squeezed proportions — the
// container is allowed to grow taller than the viewport instead, and
// the page scrolls vertically to reveal the rest. That trade (scroll,
// only in that specific case, instead of side gaps or clipping) was
// an explicit choice: full-width/no-gaps was prioritised over the
// earlier "never scroll" rule for that one edge case.
//
// Scoped entirely to this component — root layout/globals.css are
// untouched (verified neither imposes a height/overflow constraint
// that would block this scroll), so dashboards and every other route
// are unaffected.
export function LandingPage() {
  return (
    <div
      className={`${anton.variable} ${geist.variable} flex min-h-dvh flex-col justify-center overflow-x-hidden bg-ice-50 font-body text-navy`}
    >
      <CarouselRow slides={SLIDES} />
      <Footer />
    </div>
  );
}
