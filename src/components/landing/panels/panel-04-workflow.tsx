import { CarouselImageSlide } from "../carousel-image-slide";

// Approved Page 4 artwork ("WORKFLOW-MODE.png"), 16250x7500 — ratio
// 2.16667, an exact match for the locked 13:6 master contract (0%
// deviation). Installed unmodified. No baked header/footer controls —
// same permanent-shell mode as Pages 1-3 (see header.tsx). Its
// top-left is dark (black paint-splatter corner, measured brightness
// 1.1/255 at the precise logo hot-zone — a broader full-corner average
// reads a misleading ~133/255 because the region is a mix of that
// black splatter and lighter background further in, so the narrow,
// precise sample is what actually matters here), so its slide entry
// in landing-page.tsx uses logoVariant: "light", same as Page 3.
// Superseded the original 04-workflow.png (old 7-slide era asset, kept
// on disk, no longer referenced) — this replaces that slot entirely,
// matching how Pages 1-3 update their existing panel file in place.
export function PanelWorkflow() {
  return (
    <CarouselImageSlide
      src="/landing/carousel/page-04-workflow.webp"
      alt="Workflow Mode — client details, appointment timing and who's next in one focused view."
    />
  );
}
