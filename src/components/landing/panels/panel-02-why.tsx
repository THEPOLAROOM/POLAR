import { CarouselImageSlide } from "../carousel-image-slide";

// Approved Page 2 artwork (WHY POLAR.png), supplied at its own native
// 5225x2941 canvas — deliberately NOT the same dimensions as Page 1
// (4800x2878). Exported with no baked header/footer controls at all,
// so nothing here needs to align with the persistent Header overlay.
// No `fit` prop: the default "contain" behavior on
// CarouselImageSlide already letterboxes this against its own natural
// ratio with zero extra sizing math, exactly as requested (native
// proportions preserved, no stretch/crop).
export function PanelWhy() {
  return (
    <CarouselImageSlide
      src="/landing/carousel/page-02-why.png"
      alt="Why POLAR? Barbering evolved. Your experience should too."
    />
  );
}
