"use client";

import { useRef, useState } from "react";

type Slide = {
  id: string;
  label: string;
  content: React.ReactNode;
};

// Lightweight, dependency-free carousel: native horizontal scroll-snap
// (works with touch swipe on mobile for free) plus explicit prev/next
// arrows and dot navigation for manual control on desktop.
export function Carousel({ slides }: { slides: Slide[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

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

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide) => (
          <div key={slide.id} className="w-full shrink-0 snap-start">
            {slide.content}
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous panel"
        onClick={() => goTo(active - 1)}
        disabled={active === 0}
        className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-royal/30 bg-white/85 text-lg text-royal shadow-ice backdrop-blur transition disabled:opacity-30 sm:flex"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next panel"
        onClick={() => goTo(active + 1)}
        disabled={active === slides.length - 1}
        className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-royal/30 bg-white/85 text-lg text-royal shadow-ice backdrop-blur transition disabled:opacity-30 sm:flex"
      >
        ›
      </button>

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Go to ${slide.label}`}
            onClick={() => goTo(index)}
            className={`h-2.5 rounded-full transition-all ${
              index === active ? "w-6 bg-royal" : "w-2.5 bg-royal/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
