"use client";

import { useState } from "react";
import { Carousel, type Slide } from "./carousel";
import { Header } from "./header";

// Wraps Carousel + Header in the one box they both need to share.
//
// This row always simply fills its entire allotted grid track — both
// width and height (see landing-page.tsx's grid-rows-[minmax(0,1fr)_
// auto], which reserves the footer's real height first and gives this
// row exactly whatever's left, never more). That's what guarantees the
// complete artwork and the complete footer both always fit inside the
// real browser viewport: this row can never grow larger than the
// space actually available, at any viewport size.
//
// An earlier version tried to size this row intrinsically to the
// active slide's own aspect ratio (via `aspectRatio` + `shrink-0`) to
// get a tight, zero-internal-gap fit. That broke at short browser
// viewports: `max-h-full` there resolved against the *entire* h-dvh
// container, not the space actually left after the footer, so the row
// could claim the full viewport height with nothing reserved for the
// footer — and because `width` stayed pinned at 100% while `max-h-full`
// silently clamped only the height, the row's box stopped matching the
// artwork's real ratio too, throwing Header's controls out of position
// along with it. Letting the row simply fill its (correctly bounded)
// track, and letting each slide's own <CarouselImageSlide
// object-contain> do the actual letterboxing within it, avoids all of
// that — object-contain is bounded by both axes by construction, so it
// can never overflow the row, and centred side margins are now an
// expected, allowed outcome when the row is relatively taller/narrower
// than the artwork's own ratio (previously treated as a bug to
// eliminate; that constraint has been superseded).
//
// `container-type: size` here is what lets Header's own aspect-locked
// sub-box (see header.tsx's ARTWORK_BOX_STYLE) use cqw/cqh units to
// replicate object-contain's sizing formula in pure CSS, so its
// controls stay anchored to wherever the artwork actually renders
// rather than the row's raw (possibly letterboxed) corners.
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
    <div className="relative h-full min-h-0 w-full overflow-hidden" style={{ containerType: "size" }}>
      <Carousel slides={slides} onActiveChange={setActive} />
      <Header logoVariant={logoVariant} />
    </div>
  );
}
