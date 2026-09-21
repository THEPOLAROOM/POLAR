"use client";

import { useEffect, useRef, useState } from "react";

export type Slide = {
  id: string;
  label: string;
  content: React.ReactNode;
  // Optional: when this slide is active, CarouselRow shrinks the whole
  // row to this exact ratio instead of filling all available height —
  // see carousel-row.tsx. Slides without this keep today's fill
  // behavior untouched.
  lockAspectRatio?: string;
  // Optional: which POLAR logo to show against this slide's own
  // top-left brightness, AND which Header render mode to use — see
  // header.tsx. Leaving this unset (Page 1 only) keeps Header's
  // original legacy behavior: invisible hit-areas locked to Page 1's
  // own baked-artwork coordinates, unchanged. Setting it (every page
  // from Page 2 onward) switches Header to the permanent-shell mode:
  // real, visible, artwork-independent Logo/Login/Sign Up controls
  // fixed to the row's own corners.
  logoVariant?: "dark" | "light";
};

// Lightweight, dependency-free carousel: native horizontal scroll-snap
// (works with touch swipe on mobile for free) plus explicit prev/next
// arrows and dot navigation for manual control on desktop.
export function Carousel({
  slides,
  onActiveChange,
}: {
  slides: Slide[];
  onActiveChange?: (index: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    const track = trackRef.current;
    const child = track?.children[clamped] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setActive(clamped);
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActive((prev) => (prev === index ? prev : index));
  }

  // Navigation/indicators are only meaningful with more than one slide —
  // hidden (not removed) while the live carousel has exactly one, so
  // adding a second slide later automatically brings them back with no
  // engine changes.
  const hasMultipleSlides = slides.length > 1;

  return (
    <div className="relative h-full w-full">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide) => (
          <div key={slide.id} className="h-full w-full shrink-0 snap-start">
            {slide.content}
          </div>
        ))}
      </div>

      {hasMultipleSlides && (
        <>
          {/* Bare chevron glyphs (no button/circle background) matching
              the owner-approved shell reference (1.png) — a rounded-cap,
              rounded-join stroke rather than a sharp angular character,
              which is why this is an inline SVG rather than the ‹/›
              text glyphs used before. */}
          <button
            type="button"
            aria-label="Previous panel"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 text-magenta transition disabled:opacity-30 sm:block"
          >
            <svg viewBox="0 0 24 24" className="h-9 w-9 sm:h-11 sm:w-11" fill="none">
              <polyline
                points="15 4 7 12 15 20"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next panel"
            onClick={() => goTo(active + 1)}
            disabled={active === slides.length - 1}
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 text-magenta transition disabled:opacity-30 sm:block"
          >
            <svg viewBox="0 0 24 24" className="h-9 w-9 sm:h-11 sm:w-11" fill="none">
              <polyline
                points="9 4 17 12 9 20"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Single magenta pill containing all the dots (not
              freestanding dots) — matches the reference. Slide count is
              read from `slides.length`, so this automatically shows 2
              indicators today and however many once more pages are
              added, with no changes needed here. */}
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-magenta px-3 py-2 sm:gap-2.5 sm:px-4 sm:py-2.5">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Go to ${slide.label}`}
                onClick={() => goTo(index)}
                className={`rounded-full transition-all ${
                  index === active ? "h-3 w-3 bg-white sm:h-3.5 sm:w-3.5" : "h-2.5 w-2.5 bg-white/55 sm:h-3 sm:w-3"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
