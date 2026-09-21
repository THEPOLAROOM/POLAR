import Image from "next/image";

// Shared renderer for an approved carousel PNG. Each slide is just a
// src/alt pair — swap the `src` here (or per call site) to replace
// artwork later without touching layout, navigation, or any other
// panel.
//
// `fit` defaults to "contain" (aspect-preserving, letterboxed —
// nothing cropped or distorted), which is what every future page
// should keep using unless deliberately opted out. "fill" is the
// WIDTH-FILL TEST mode: stretches horizontally (and vertically, but
// the box's height is unchanged by this component either way) to
// exactly match the box, allowed to distort proportions per that
// explicit request — currently opted into by panel-01-welcome.tsx
// only, not the shared default.
//
// Fills the height it's given (h-full) rather than a fixed px ladder —
// the actual box this ends up inside is sized by landing-page.tsx.
export function CarouselImageSlide({
  src,
  alt,
  priority = false,
  fit = "contain",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  fit?: "contain" | "fill";
}) {
  return (
    <section className="relative h-full w-full bg-ice-50">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        className={fit === "fill" ? "object-fill" : "object-contain"}
        priority={priority}
      />
    </section>
  );
}
