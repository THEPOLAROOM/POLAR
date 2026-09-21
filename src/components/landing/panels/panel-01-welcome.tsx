import { CarouselImageSlide } from "../carousel-image-slide";

// Approved Page 1 artwork v2 ("More than JUST A BOOKING APP....png",
// exported at 16250x7500 / 13:6), footer band cropped off (see
// artwork.ts and Footer — that band is now the real, independent
// footer component instead, not baked art). Superseded the original
// page-01-hero.png (4800x2878, kept on disk, no longer referenced) —
// this version uses the carousel's available width more effectively.
// The logo/Login/Sign Up baked into the remaining image are
// temporarily still visible underneath the real Header overlay (see
// landing-page.tsx) — Page 2 onward is exported without them, per the
// approved direction.
export function PanelWelcome() {
  return (
    <CarouselImageSlide
      src="/landing/carousel/page-01-hero-v2.png"
      alt="More than just a booking app. Meet POLAR, your personal booking assistant."
      priority
    />
  );
}
