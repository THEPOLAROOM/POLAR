import { FooterPageShell } from "@/components/footer-pages/footer-page-shell";

// Content intentionally removed (previous V1-draft copy + disclaimer
// banner are preserved in git history, not deleted — see the commit
// that introduced this file). Shared FOOTER-BACKGROUND.png shell only
// for now; a real scrollable Terms & Conditions UI will be layered
// into this same box (via FooterPageShell's `children`) in a
// follow-up pass. Route/page structure is unchanged, so /legal/terms
// keeps working exactly as before from every existing link (footer,
// signup/barber's acceptance checkbox).
//
// LEGAL_VERSIONS (src/lib/legal/versions.ts) is NOT touched here —
// this page never used it for anything but display copy, and the
// signup acceptance flow (signup/barber/page.tsx, lib/actions/auth.ts)
// still depends on it unchanged.
const ASPECT_RATIO = "5769 / 2663";

export default function TermsPage() {
  return (
    <FooterPageShell
      src="/footer-pages/background.webp"
      alt=""
      aspectRatio={ASPECT_RATIO}
    />
  );
}
