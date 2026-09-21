// Shared sizing contract for the carousel's master artwork. Page 1
// (THEPOLAROOM-CAROUSELS.png, footer band removed — see Footer) is
// 4800x2878; Pages 2-5 are being designed at the same Canva
// dimensions specifically so they can slot into this same shell. Both
// the carousel's own aspect-locked wrapper (landing-page.tsx) and the
// persistent Header overlay's percentage-based positions (header.tsx)
// depend on this exact ratio to stay pixel-aligned with whichever
// slide is showing — defined once here so the two can't silently
// drift out of sync if the master dimensions ever change.
export const CAROUSEL_ARTWORK_ASPECT_RATIO = "4800 / 2878";
