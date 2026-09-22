// Page 1's own artwork ratio specifically (page-01-hero-v2.png).
// Source was approved/exported at 13:6 (16250x7500); the live baked
// footer band (750px) is cropped off before use here for the same
// reason as the original Page 1 asset — a real, independent Footer
// component renders below the carousel, so the baked band would
// otherwise duplicate it. That crop leaves 16250x6750 (65:27,
// approximately 2.4074), which is this constant's value — it is the
// footer-cropped artwork's ratio, not the originally-exported 13:6
// canvas ratio.
//
// Used only by the persistent Header overlay (header.tsx) to compute
// the same centered, aspect-locked box that Page 1's own <Image
// object-contain> independently arrives at within the carousel row —
// that's what keeps Header's percentage-based hit-areas landing
// exactly on Page 1's still-baked logo/Login/Sign Up buttons.
//
// NOT a shared contract for every carousel page: Page 2 (WHY
// POLAR.png, 5225x2941) confirmed pages are NOT all being supplied at
// the same master dimensions after all, despite that original plan —
// each slide now sizes itself independently by its own native aspect
// ratio (see carousel-image-slide.tsx's plain object-contain), and
// only Header's Page-1-specific alignment still depends on this
// constant.
export const CAROUSEL_ARTWORK_ASPECT_RATIO = "16250 / 6750";

// The locked artwork contract every current and future carousel page
// is exported at (5200x2400 Canva master / 16250x7500 actual exports —
// both reduce to this same ratio). Used by header.tsx's permanent-
// shell mode to compute an aspect-locked sub-box that matches
// wherever the active slide's own <Image object-contain> actually
// renders, WITHOUT assuming which axis (width or height) is the
// binding constraint — unlike CAROUSEL_ARTWORK_ASPECT_RATIO above,
// this ratio is genuinely shared across every page under the locked
// contract, so it doesn't need to be recomputed per slide.
export const LOCKED_ARTWORK_RATIO = 13 / 6;
