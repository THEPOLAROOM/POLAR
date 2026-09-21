import Image from "next/image";

// Shared renderer for an approved carousel PNG. Each slide is just a
// src/alt pair — swap the `src` here (or per call site) to replace
// artwork later without touching layout, navigation, or any other
// panel. The approved image is rendered byte-for-byte via next/image
// with object-fit: contain, so the full design (text, mascot, borders,
// crystalline effects already baked into the PNG) is always shown in
// full, never cropped or distorted.
//
// Fills the height it's given (h-full) rather than a fixed px ladder —
// the actual box this ends up inside is sized by landing-page.tsx's
// shared aspect-ratio wrapper (locked to the approved artwork's own
// aspect ratio), not by this component. object-contain stays as a
// safety net for any sub-pixel rounding, not as the primary sizing
// mechanism.
export function CarouselImageSlide({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <section className="relative h-full w-full bg-ice-50">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        className="object-contain"
        priority={priority}
      />
    </section>
  );
}
