import Link from "next/link";
import { logout } from "@/lib/actions/auth";

// Deliberately minimal — functional navigation only, no visual design
// pass yet. Shared by the barber and client dashboard layouts so
// logout (and every route within each section) is reachable from
// every page in that section, not just the two former dead-end
// placeholder dashboards.
export function DashboardNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <nav className="flex flex-wrap items-center gap-4 border-b border-polar-border px-6 py-3 text-sm">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-polar-text underline">
          {link.label}
        </Link>
      ))}
      <form action={logout} className="ml-auto">
        <button type="submit" className="text-polar-text underline">
          Log out
        </button>
      </form>
    </nav>
  );
}
