import Image from "next/image";
import { BackButton } from "./back-button";

// Shared shell for every footer destination (About, Privacy, Terms,
// Contact) — same proven sizing technique as the landing carousel
// (see landing-page.tsx/carousel-row.tsx): the image is always
// rendered at width:100% with height purely derived from its own
// native ratio, never cropped or stretched. min-h-dvh (not a fixed
// h-dvh) + flex + justify-center means the page simply grows and
// scrolls on the rare short viewport where the full-width image
// wouldn't otherwise fit, instead of introducing side gaps or
// clipping — identical trade-off, same reasoning, as the landing page.
//
// BackButton renders unconditionally here (not per-page) so every
// page in this family gets the exact same "← BACK" control at the
// exact same position/size/style by construction — no risk of the
// four pages drifting apart. It's a plain overlay, not baked into
// any artwork file.
//
// `children`, when supplied, render as a plain absolutely-positioned
// overlay inside the same locked-ratio box, so a scrollable text UI
// (Privacy/Terms) can be positioned against the artwork's own content
// area using the same box every other page in this family uses —
// kept optional since About/Contact have everything baked into their
// own image and need no overlay content at all.
export function FooterPageShell({
  src,
  alt,
  aspectRatio,
  children,
}: {
  src: string;
  alt: string;
  aspectRatio: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col justify-center overflow-x-hidden bg-ice-50">
      <div className="relative w-full shrink-0" style={{ aspectRatio }}>
        <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" priority />
        <BackButton />
        {children}
      </div>
    </div>
  );
}
