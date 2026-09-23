import { FooterPageShell } from "@/components/footer-pages/footer-page-shell";

// Approved final "Terms & Conditions" mastered design
// (TERMS-&-CONDITIONS.png, native 5769x2663 — same canvas the rest of
// this footer-page family uses), rendered byte-for-byte via the
// shared FooterPageShell, no crop/stretch/redesign. Replaces the
// earlier shared FOOTER-BACKGROUND.png placeholder now that a
// page-specific title has been supplied. Route/page structure is
// unchanged, so /legal/terms keeps working from every existing link
// (footer, signup/barber's acceptance checkbox).
//
// LEGAL_VERSIONS (src/lib/legal/versions.ts) is NOT touched here —
// this page never used it for anything but display copy, and the
// signup acceptance flow (signup/barber/page.tsx, lib/actions/auth.ts)
// still depends on it unchanged.
const ASPECT_RATIO = "5769 / 2663";

// The invisible scroll region for the future Terms & Conditions text.
// Measured directly against the artwork's own white space (per-row/
// per-column scan for the first non-white pixel, both from the paint
// splatter curtain on the right and the paint-drip/crown clutter on
// the left, plus the title's own lowest extent and the slogan pill's
// topmost extent), then given a uniform safety margin on every side
// so text can never reach the paint edges, the title, the slogan
// pill, or the barber-room photo — verified empty by cropping exactly
// this box out of the source artwork. Identical box to Privacy
// Policy, since both pages share the same background artwork and
// layout; kept as its own local constant (not imported from a shared
// file) to match this codebase's existing convention of measuring and
// documenting each mastered page's boxes where they're used.
const CONTENT_BOX = { left: "18.5%", top: "20%", width: "34.5%", height: "60.5%" };

export default function TermsPage() {
  return (
    <FooterPageShell
      src="/footer-pages/terms.webp"
      alt="Terms & Conditions"
      aspectRatio={ASPECT_RATIO}
    >
      {/* No visible box, border, shadow or fill — purely a scroll
          container. Legal copy will be added here in a follow-up
          pass; left empty for now, exactly as instructed. */}
      <div
        className="absolute overflow-y-auto overflow-x-hidden overscroll-contain"
        style={CONTENT_BOX}
      />
    </FooterPageShell>
  );
}
