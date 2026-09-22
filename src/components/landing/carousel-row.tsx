"use client";

import { useState } from "react";
import { Carousel, type Slide } from "./carousel";
import { Header } from "./header";

// Wraps Carousel + Header in the one box they both need to share.
//
// This row is always sized to width:100% (of the page, always full —
// this is what guarantees zero left/right gaps) with its height purely
// derived from the locked 13:6 ratio, uncapped by any max-height. That
// means the row IS the artwork's exact displayed box by construction
// — CarouselImageSlide's object-contain inside it has nothing to
// letterbox (container ratio == image ratio exactly), and Header can
// simply fill this same box with plain `inset-0` (see header.tsx) with
// no separate box computation of its own needed.
//
// Two earlier approaches were tried and replaced:
// 1) Locking the row intrinsically via `aspectRatio` + `shrink-0` +
//    `max-h-full`: `max-h-full` resolved against the *entire* h-dvh
//    container rather than the space left after the footer, so the
//    row could claim the full viewport with nothing reserved for the
//    footer — while `width` stayed pinned at 100% and never
//    recomputed when `max-h-full` clamped the height, breaking the
//    box's actual ratio too. That clipped the footer and threw
//    Header's controls out of position.
// 2) Filling the row to its exact grid-track box (both axes) and
//    letting object-contain do the letterboxing: this correctly fit
//    everything inside the real viewport, but introduced visible
//    left/right gaps whenever the track was proportionally wider than
//    13:6 (a short real browser window) — ruled out now in favour of
//    always-full-width.
//
// This version accepts the one remaining trade-off explicitly: on an
// unusually short real browser window, the row's intrinsic height can
// exceed the viewport, and rather than reintroducing clipping (1) or
// gaps (2), landing-page.tsx now allows the page to grow taller than
// the viewport and scroll in that specific case.
export function CarouselRow({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  // Zero-slide fallback only: with no slides at all, slides[active] is
  // undefined, which would otherwise fall through to Header's legacy
  // baked-artwork mode (invisible hit-areas, no visible controls) —
  // exactly the wrong thing to show over an empty carousel. Forcing
  // "dark" here keeps the permanent shell visible and fully functional
  // against the plain page background while no artwork is loaded. Any
  // slide that does specify its own logoVariant is unaffected — this
  // only fires when the array itself is empty.
  const logoVariant = slides.length === 0 ? "dark" : slides[active]?.logoVariant;

  return (
    <div className="relative w-full shrink-0" style={{ aspectRatio: "13 / 6" }}>
      <Carousel slides={slides} onActiveChange={setActive} />
      <Header logoVariant={logoVariant} />
    </div>
  );
}
