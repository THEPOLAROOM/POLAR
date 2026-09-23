import { FooterPageShell } from "@/components/footer-pages/footer-page-shell";

// Approved final "Contact Us" mastered design (CONTACT-US.png, native
// 5769x2663 — same canvas the rest of this footer-page family uses),
// rendered byte-for-byte via the shared FooterPageShell, no
// crop/stretch/redesign. The email and social fields are baked into
// the artwork as intentionally blank ("Our email :" / "Follow us :"
// with no value) — not filled in here, since those details aren't
// confirmed yet. Nothing is added on top; this page is the artwork
// plus the shared BackButton only.
const ASPECT_RATIO = "5769 / 2663";

export default function ContactPage() {
  return (
    <FooterPageShell
      src="/footer-pages/contact.webp"
      alt="Contact Us — Get in touch. Questions about POLAR? We're here to help. Our email, Location: London, United Kingdom, Follow us."
      aspectRatio={ASPECT_RATIO}
    />
  );
}
