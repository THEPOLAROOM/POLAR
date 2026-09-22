import { CarouselImageSlide } from "../carousel-image-slide";

// Approved Page 1 artwork v3 ("WWW.THEPOLAROOM.COM-CAROUSEL-01.png"),
// 16250x7500 — an exact match for the locked 13:6 master contract
// (0% deviation), installed unmodified (byte-identical copy, no crop/
// stretch/recompress). Unlike the earlier v2 asset, this export has no
// baked logo/Login/Sign Up/footer at all — it's pure artwork, fully
// decoupled from the permanent shell (see header.tsx's permanent-shell
// mode, selected via this slide's logoVariant in landing-page.tsx).
// Superseded page-01-hero.png and page-01-hero-v2.png, both kept on
// disk, no longer referenced.
export function PanelWelcome() {
  return (
    <CarouselImageSlide
      src="/landing/carousel/page-01-hero-v3.png"
      alt="More than just a booking app. Meet POLAR, your personal booking assistant."
      priority
    />
  );
}
