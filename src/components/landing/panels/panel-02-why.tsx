import { CarouselImageSlide } from "../carousel-image-slide";

// Approved Page 2 calibration artwork ("WHY-POLAR.png", the owner's
// final Canva export), 16250x7500 — ratio 2.16667, an exact match for
// the locked 13:6 master contract. Superseded the earlier v2 draft
// (page-02-why-v2.webp, kept on disk, no longer referenced). No baked
// header/footer controls, so nothing here needs to align with the
// persistent Header overlay — Header now renders real, visible,
// artwork-independent controls for this page (see header.tsx's
// permanent-shell mode). No `fit` prop: the default "contain" behavior
// on CarouselImageSlide already letterboxes this against its own
// natural ratio with zero extra sizing math (native proportions
// preserved, no stretch/crop).
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
      src="/landing/carousel/page-02-why-v3.webp"
      alt="Why POLAR? Barbering evolved. Your experience should too."
    />
  );
}
