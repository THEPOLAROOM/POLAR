import Link from "next/link";

// "Contact" and "Support" have no real destination yet (no approved
// email/page exists) — placeholder "#" links pending real destinations
// being provided. Privacy Policy / Terms & Conditions reuse the
// existing, already-built /legal routes.
const FOOTER_LINKS = [
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms & Conditions" },
  { href: "#", label: "Contact" },
  { href: "#", label: "Support" },
];

const SOCIALS = ["Instagram", "TikTok", "Facebook"];

export function Footer() {
  return (
    <footer className="bg-navy px-6 py-14 text-white sm:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-lg tracking-wide">
            THE<span className="text-royal-light">POLAR</span>ROOM
          </p>
          <p className="mt-2 text-xs text-white/50">London, UK</p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex gap-3">
          {SOCIALS.map((label) => (
            <span
              key={label}
              aria-label={label}
              title={label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-xs text-white/70"
            >
              {label.charAt(0)}
            </span>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-5xl text-xs text-white/40">
        © 2026 POLAR. London, UK.
      </p>
    </footer>
  );
}
