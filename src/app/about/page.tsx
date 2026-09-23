import { FooterPageShell } from "@/components/footer-pages/footer-page-shell";

// Approved final "About POLAR" design (ABOUT-POLAR.png), supplied at
// its native 5769x2663 canvas — rendered byte-for-byte via
// FooterPageShell, same technique as every other mastered page in
// this app. Every piece of copy is baked into the artwork itself;
// nothing is recreated in JSX. Replaces the previous /#about anchor,
// which pointed at a homepage section that no longer exists (see
// landing/footer.tsx).
const ASPECT_RATIO = "5769 / 2663";

export default function AboutPage() {
  return (
    <FooterPageShell
      src="/footer-pages/about.webp"
      alt="About POLAR — Built by barbers. For barbering. Why POLAR was created, built from real barbering experience, clients matter as much as barbers, our mission. More than a booking app."
      aspectRatio={ASPECT_RATIO}
    />
  );
}
