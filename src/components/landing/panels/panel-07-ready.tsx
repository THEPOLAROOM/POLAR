import Image from "next/image";
import Link from "next/link";
import { CarouselImageSlide } from "../carousel-image-slide";

// Approved final artwork ("POLAR Final Carousel (1).png"), a minor-edit
// replacement for the original Page 5 art, supplied at its true native
// Canva master size 5200x2400 — ratio 2.16667, an exact match for the
// locked 13:6 master contract (0% deviation). Installed unmodified. No
// baked header/footer controls — same permanent-shell mode as Pages
// 1-4 (see header.tsx).
//
// Its own top-left is a soft blue gradient rather than a clean
// extreme — sampled at the exact spot the shell logo renders
// (140.5/255, matching the superseded version's equivalent corner
// almost exactly, confirmed visually), so its slide entry in
// landing-page.tsx keeps logoVariant: "dark", matching Pages 1-2.
// Supersedes page-05-ready.webp (kept on disk, no longer referenced),
// which itself superseded the original 7-slide-era 07-ready.png.
//
// CREATE YOUR ACCOUNT — the artwork's own baked pill was previously
// decorative only (no hit-area; see git history). It is now backed by
// a real clickable control routing to /signup, layered on top via
// CarouselImageSlide's `overlay` slot. CTA_BOX was measured directly
// against the baked pill's own pixels on this artwork's native
// 5200x2400 canvas (magenta border-glow band scan: solid border top
// edge at y=1584, bottom edge at y=1824, left/right glow extent
// ~230-1820px), then given a small uniform margin on every side so
// the new asset's own soft glow (see page-05-cta-button.png, cropped
// from the supplied "CREATE-YOUR-ACCOUNT-UI.png") isn't hard-clipped.
// The new image is fully opaque across the pill's solid fill/border,
// so it completely occludes the old baked pill beneath it at this
// size/position — nothing from the original artwork shows through.
const CTA_BOX = { left: "4.5%", top: "63.3%", width: "30.4%", height: "14.4%" };

export function PanelReady() {
  return (
    <CarouselImageSlide
      src="/landing/carousel/page-05-ready-v2.webp"
      alt="You're ready. Let's break the ice. Create your account."
      overlay={
        <Link
          href="/signup"
          aria-label="Create your account"
          className="absolute focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-magenta"
          style={CTA_BOX}
        >
          {/* drop-shadow (not box-shadow) follows the image's own
              alpha silhouette, so the glow hugs the pill's rounded
              shape instead of drawing a rectangle around its
              transparent padding. */}
          <span
            className="relative block h-full w-full transition duration-200 ease-out [filter:drop-shadow(0_0_0_rgba(255,61,154,0))] hover:scale-[1.03] hover:[filter:drop-shadow(0_0_14px_rgba(255,61,154,0.85))_drop-shadow(0_0_28px_rgba(91,155,255,0.5))]"
          >
            <Image
              src="/landing/carousel/page-05-cta-button.png"
              alt=""
              fill
              sizes="30vw"
              className="object-contain"
            />
          </span>
        </Link>
      }
    />
  );
}
