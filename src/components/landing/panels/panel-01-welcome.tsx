import { CarouselImageSlide } from "../carousel-image-slide";

// Approved Page 1 artwork (THEPOLAROOM-CAROUSELS.png), footer band
// cropped off (see Footer — that band is now the real, independent
// footer component instead). The logo/Login/Sign Up baked into the
// remaining image are temporarily still visible underneath the real
// Header overlay (see landing-page.tsx) — Page 2 onward will be
// exported without them, per the approved direction.
export function PanelWelcome() {
  return (
    <CarouselImageSlide
      src="/landing/carousel/page-01-hero.png"
      alt="More than just a booking app. Meet POLAR, your personal booking assistant."
      priority
    />
  );
}
