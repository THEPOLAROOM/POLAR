import Link from "next/link";
import Image from "next/image";

// Slide 07 only: the CTA ("CREATE YOUR POLAR PROFILE") is baked into
// the approved artwork itself, so a transparent overlay link sits
// exactly over its visible button area and routes to the same /signup
// destination as the header's Sign Up link.
//
// Desktop/tablet (sm and up, unchanged): the wrapper is sized by the
// image's own intrinsic aspect ratio (1448x1086, matching the source
// PNG exactly), so the rendered image is never letterboxed there and
// the overlay's percentage-based position lines up with the real
// button pixels. The image itself is never cropped, altered, or
// regenerated.
//
// Mobile (below sm): that intrinsic-ratio approach made this slide's
// frame a different height than every other slide's fixed h-[420px]
// mobile frame from CarouselImageSlide, so it visibly sat
// taller/shorter than its neighbours and shifted the pagination dots.
// Mobile now uses the exact same h-[420px] fixed frame as every other
// slide, with an inner box locked to the image's real aspect ratio and
// centered inside that frame (mirroring how object-contain centers a
// letterboxed image) — so the CTA_AREA percentages below still line up
// exactly against the real image, just measured relative to that
// inner box instead of the outer frame.
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
    <>
      {/* Mobile only — matches every other slide's fixed h-[420px] frame */}
      <section className="relative flex h-[420px] w-full items-center justify-center bg-ice-50 sm:hidden">
        <div className="relative w-full aspect-[1448/1086]">
          <Image
            src="/landing/carousel/07-ready.png"
            alt="You're ready — create your POLAR profile"
            fill
            sizes="100vw"
            className="object-contain"
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

      {/* Tablet/desktop — unchanged */}
      <section className="relative hidden w-full bg-ice-50 sm:block">
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
    </>
  );
}
