import Link from "next/link";
import Image from "next/image";

// Slide 07 only: the CTA ("CREATE YOUR POLAR PROFILE") is baked into
// the approved artwork itself, so a transparent overlay link sits
// exactly over its visible button area and routes to the same /signup
// destination as the header's Sign Up link.
//
// This slide intentionally does NOT use the shared CarouselImageSlide
// (which sizes a fixed-height section around a `fill` image and can
// letterbox depending on viewport). Instead the wrapper is sized by
// the image's own intrinsic aspect ratio (1448x1086, matching the
// source PNG exactly), so the rendered image is never letterboxed and
// the overlay's percentage-based position always lines up with the
// real button pixels regardless of viewport width. The image itself
// is never cropped, altered, or regenerated.
const IMAGE_WIDTH = 1448;
const IMAGE_HEIGHT = 1086;

// Percentages of the image's own rendered box, measured directly
// against the approved artwork's button position — not arbitrary.
const CTA_AREA = {
  left: "53%",
  top: "63%",
  width: "40%",
  height: "11%",
};

export function PanelReady() {
  return (
    <section className="relative w-full bg-ice-50">
      <div className="relative mx-auto w-full">
        <Image
          src="/landing/carousel/07-ready.png"
          alt="You're ready — create your POLAR profile"
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          sizes="100vw"
          className="h-auto w-full"
        />
        <Link
          href="/signup"
          aria-label="Create your POLAR profile"
          className="absolute rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal"
          style={{
            left: CTA_AREA.left,
            top: CTA_AREA.top,
            width: CTA_AREA.width,
            height: CTA_AREA.height,
          }}
        />
      </div>
    </section>
  );
}
