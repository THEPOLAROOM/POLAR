import { CarouselImageSlide } from "../carousel-image-slide";

// Approved Page 2 artwork v2 ("Copy of WHY POLAR (5200x2400px).png"),
// re-exported at the new 13:6 master canvas (16250x7500, matching Page
// 1's own export scale — see artwork.ts) that the carousel is now
// standardising on. Superseded the original page-02-why.png (5225x2941,
// kept on disk, no longer referenced), which fought the carousel's
// available width more than this ratio does. No baked header/footer
// controls, so nothing here needs to align with the persistent Header
// overlay. No `fit` prop: the default "contain" behavior on
// CarouselImageSlide already letterboxes this against its own natural
// ratio with zero extra sizing math (native proportions preserved, no
// stretch/crop).
//
// Re-encoded losslessly-visually as WebP (quality 95) rather than kept
// as the supplied PNG: the source PNG's fine photographic/gradient
// detail resists PNG's lossless compression (~100MB, uncomfortably
// close to GitHub's 100MB push limit and impractical to serve) while
// re-encoding changes no pixel positions, composition, or content —
// same approach applies equally if Page 1's asset ever needs it.
export function PanelWhy() {
  return (
    <CarouselImageSlide
      src="/landing/carousel/page-02-why-v2.webp"
      alt="Why POLAR? Barbering evolved. Your experience should too."
    />
  );
}
