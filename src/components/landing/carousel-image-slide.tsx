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
// the actual box this ends up inside is sized by carousel-row.tsx
// (either filled to all remaining height, or intrinsically locked to a
// specific slide's aspectRatio — see that file), not by this
// component. object-contain does the real letterboxing work whenever
// this box's shape doesn't exactly match the image's own ratio.
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
