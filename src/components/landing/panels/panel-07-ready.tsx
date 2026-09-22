import { CarouselImageSlide } from "../carousel-image-slide";

// Approved final artwork ("POLAR Final Carousel (1).png"), a minor-edit
// replacement for the original Page 5 art, supplied at its true native
// Canva master size 5200x2400 — ratio 2.16667, an exact match for the
// locked 13:6 master contract (0% deviation). Installed unmodified. No
// baked header/footer controls — same permanent-shell mode as Pages
// 1-4 (see header.tsx).
//
// This artwork has its own baked "CREATE YOUR ACCOUNT" pill as part
// of the design, but it's decorative only — not a separate clickable
// overlay. The real Sign Up (and Login) controls in the permanent
// shell already cover that action; no CTA-specific hit-area is wired
// up here.
//
// Its own top-left is a soft blue gradient rather than a clean
// extreme — sampled at the exact spot the shell logo renders
// (140.5/255, matching the superseded version's equivalent corner
// almost exactly, confirmed visually), so its slide entry in
// landing-page.tsx keeps logoVariant: "dark", matching Pages 1-2.
// Supersedes page-05-ready.webp (kept on disk, no longer referenced),
// which itself superseded the original 7-slide-era 07-ready.png.
export function PanelReady() {
  return (
    <CarouselImageSlide
      src="/landing/carousel/page-05-ready-v2.webp"
      alt="You're ready. Let's break the ice. Create your account."
    />
  );
}
