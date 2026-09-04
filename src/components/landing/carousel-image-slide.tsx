import Image from "next/image";

// Shared renderer for an approved carousel PNG. Each slide is just a
// src/alt pair — swap the `src` here (or per call site) to replace
// artwork later without touching layout, navigation, or any other
// panel. The approved image is rendered byte-for-byte via next/image
// with object-fit: contain, so the full design (text, mascot, borders,
// crystalline effects already baked into the PNG) is always shown in
// full, never cropped or distorted.
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
    <section className="relative h-[420px] w-full bg-ice-50 sm:h-[560px] md:h-[720px]">
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
