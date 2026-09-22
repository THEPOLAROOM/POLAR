import { CarouselImageSlide } from "../carousel-image-slide";

// Approved Page 3 artwork ("YOUR-POLAR-ID.png"), 16250x7500 — ratio
// 2.16667, an exact match for the locked 13:6 master contract (0%
// deviation). Installed unmodified. No baked header/footer controls —
// same permanent-shell mode as Pages 1-2 (see header.tsx). Unlike
// those two, this artwork's top-left is dark (48.3/255 measured
// brightness, the barbershop scene rather than a light background),
// so its slide entry in landing-page.tsx uses logoVariant: "light"
// instead of "dark" — position/size/behavior of the shell stay
// identical either way, only the logo image swaps. Superseded the
// original 03-card.png (old 7-slide era asset, kept on disk, no
// longer referenced) — this replaces that slot entirely rather than
// adding a new one, matching how Pages 1-2 update their existing
// panel file in place across artwork revisions.
export function PanelPolarId() {
  return (
    <CarouselImageSlide
      src="/landing/carousel/page-03-polar-id.webp"
      alt="Your POLAR ID — keeping your details connected with your barber."
    />
  );
}
