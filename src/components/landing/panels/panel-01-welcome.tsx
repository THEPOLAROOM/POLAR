import { CarouselImageSlide } from "../carousel-image-slide";

export function PanelWelcome() {
  return (
    <CarouselImageSlide
      src="/landing/carousel/01-welcome.png"
      alt="Welcome to POLAR — the portal to your coldest cuts"
      priority
    />
  );
}
