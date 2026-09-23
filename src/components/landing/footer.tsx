import Link from "next/link";

// "Contact" has no real destination yet (no approved email/page
// exists) — a placeholder "#" link pending a real destination, left
// as-is (out of scope for this pass). "About POLAR" now routes to the
// real /about page (src/app/about/page.tsx), replacing the old
// /#about anchor, which pointed at a homepage section that no longer
// exists. Privacy Policy / Terms & Conditions reuse the existing
// /legal routes (their content was reset to a shared background-only
// shell in this same pass — see those page files).
const FOOTER_LINKS = [
  { href: "/about", label: "About POLAR" },
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
