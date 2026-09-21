"use client";

import { useState } from "react";
import { Carousel, type Slide } from "./carousel";
import { Header } from "./header";

// Wraps Carousel + Header in the one box they both need to share, and
// makes that box's own height reactive to which slide is currently
// active — this is what lets a single slide (e.g. Page 2) get a tight,
// gap-free fit without changing how any other slide (e.g. Page 1)
// renders, since they're normally forced to share one fixed-height row.
//
// Default (no lockAspectRatio on the active slide): row behaves exactly
// as before — flex-1 fills all remaining height in the parent's h-dvh
// flex column, letting each slide's own <CarouselImageSlide
// object-contain> do the letterboxing, same as today.
//
// When the active slide sets lockAspectRatio: the row instead sizes
// itself intrinsically to that exact ratio (width:100% with height
// derived — the same width-first pattern proven correct for Header's
// own box, not h-full, which over-constrains and silently ignores the
// ratio once max-width clamps it). The parent's `justify-center` then
// centers this now-shorter row (with the footer directly beneath it,
// since footer is just the next sibling) within the leftover space —
// so slides that exactly match their locked ratio render with zero
// internal gap, and any leftover viewport space becomes a symmetric
// margin above/below the whole composition instead of an internal
// band hugging the artwork.
//
// Trade-off, by design: switching between a locked-ratio slide and a
// fill-behavior slide changes the row's (and therefore the footer's)
// on-screen height and vertical position — this is the only way to
// give one slide a tight fit while leaving another slide's rendering
// completely unchanged, since they share one physical row element.
export function CarouselRow({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const lockRatio = slides[active]?.lockAspectRatio;
  const logoVariant = slides[active]?.logoVariant;

  return (
    <div
      className={
        lockRatio
          ? "relative w-full max-h-full shrink-0 overflow-hidden"
          : "relative min-h-0 flex-1 overflow-hidden"
      }
      style={lockRatio ? { aspectRatio: lockRatio } : undefined}
    >
      <Carousel slides={slides} onActiveChange={setActive} />
      <Header logoVariant={logoVariant} />
    </div>
  );
}
