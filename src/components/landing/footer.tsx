"use client";

import Link from "next/link";

// All four now route to real pages (src/app/about, src/app/contact,
// src/app/legal/privacy, src/app/legal/terms), each rendering its own
// supplied mastered artwork via the shared FooterPageShell. "Contact"
// previously had no destination ("#") — now routes to /contact.
const FOOTER_LINKS = [
  { href: "/about", label: "About POLAR" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms & Conditions" },
  { href: "/contact", label: "Contact" },
];

// "use client" + this onClick exist for exactly one reason: each of
// the four footer pages has its own "← BACK" control (see
// components/footer-pages/back-button.tsx) that needs to know whether
// it's safe to go back in browser history or should fall back to "/".
// Neither document.referrer nor window.history.length turned out to
// be reliable signals for that (both confirmed broken by testing —
// see back-button.tsx's comment for why), so this sets a plain
// sessionStorage flag at the one and only place these pages are ever
// reached from in-app, the instant a footer link is actually clicked.
function markFooterNavigation() {
  try {
    sessionStorage.setItem("polar-footer-nav", "1");
  } catch {
    // sessionStorage can throw in some privacy modes — BackButton's
    // own fallback to "/" still keeps the control fully usable.
  }
}

// Compact treatment per the approved Page 1 direction: just the four
// links, centred, on a shallow solid navy bar — no brand column, no
// social icons, no copyright line (all part of the old, larger
// footer this replaces).
export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 bg-navy px-6 py-4 text-sm font-bold tracking-wide text-magenta sm:text-base">
      {FOOTER_LINKS.map((link) => (
        <Link key={link.label} href={link.href} onClick={markFooterNavigation} className="transition hover:text-white">
          {link.label.toUpperCase()}
        </Link>
      ))}
    </footer>
  );
}
