import Link from "next/link";

// "Contact" has no real destination yet (no approved email/page
// exists) — a placeholder "#" link pending a real destination.
// "About POLAR" points at an in-page anchor that no longer exists
// (the section it used to jump to was removed from the homepage in an
// earlier pass, and there is no standalone About POLAR route yet
// either) — both are known, pre-existing gaps, preserved exactly as
// they were rather than addressed here. Privacy Policy / Terms &
// Conditions reuse the existing, already-built /legal routes.
const FOOTER_LINKS = [
  { href: "/#about", label: "About POLAR" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms & Conditions" },
  { href: "#", label: "Contact" },
];

// Compact treatment per the approved Page 1 direction: just the four
// links, centred, on a shallow solid navy bar — no brand column, no
// social icons, no copyright line (all part of the old, larger
// footer this replaces).
export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 bg-navy px-6 py-4 text-sm font-bold tracking-wide text-magenta sm:text-base">
      {FOOTER_LINKS.map((link) => (
        <Link key={link.label} href={link.href} className="transition hover:text-white">
          {link.label.toUpperCase()}
        </Link>
      ))}
    </footer>
  );
}
