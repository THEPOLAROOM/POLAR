// Page 1's own artwork ratio specifically (THEPOLAROOM-CAROUSELS.png,
// footer band removed — see Footer), 4800x2878. Used only by the
// persistent Header overlay (header.tsx) to compute the same
// centered, aspect-locked box that Page 1's own <Image object-contain>
// independently arrives at within the carousel row — that's what
// keeps Header's percentage-based hit-areas landing exactly on Page
// 1's still-baked logo/Login/Sign Up buttons.
//
// NOT a shared contract for every carousel page: Page 2 (WHY
// POLAR.png, 5225x2941) confirmed pages are NOT all being supplied at
// the same master dimensions after all, despite that original plan —
// each slide now sizes itself independently by its own native aspect
// ratio (see carousel-image-slide.tsx's plain object-contain), and
// only Header's Page-1-specific alignment still depends on this
// constant.
export const CAROUSEL_ARTWORK_ASPECT_RATIO = "4800 / 2878";
