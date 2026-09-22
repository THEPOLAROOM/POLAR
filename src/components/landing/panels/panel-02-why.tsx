import { CarouselImageSlide } from "../carousel-image-slide";

// Approved Page 2 artwork ("WHY-POLAR (1).png"), 16250x7500 — ratio
// 2.16667, an exact match for the locked 13:6 master contract (0%
// deviation). Installed unmodified. No baked header/footer controls,
// so nothing here needs to align with the persistent Header overlay —
// Header renders real, visible, artwork-independent controls for this
// page via the same permanent-shell mode Page 1 uses (see
// header.tsx). No `fit` prop: the default "contain" behavior on
// CarouselImageSlide already letterboxes this against its own natural
// ratio with zero extra sizing math (native proportions preserved, no
// stretch/crop). Superseded page-02-why-v3.webp and earlier versions,
// all kept on disk, no longer referenced.
//
// Re-encoded losslessly-visually as WebP (quality 95) rather than kept
// as the supplied PNG: the source PNG's fine photographic/gradient
// detail resists PNG's lossless compression (~95MB, uncomfortably
// close to GitHub's 100MB push limit and impractical to serve) while
// re-encoding changes no pixel positions, composition, or content —
// same approach used for Page 1's own v3 asset.
export function PanelWhy() {
  return (
    <CarouselImageSlide
      src="/landing/carousel/page-02-why-v4.webp"
      alt="Why POLAR? Barbering evolved. Your experience should too."
    />
  );
}
