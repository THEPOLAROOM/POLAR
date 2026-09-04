import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-royal/10 bg-ice-50/80 px-6 py-4 backdrop-blur sm:px-10">
      <span className="font-display text-lg tracking-wide text-navy sm:text-xl">
        THE<span className="text-royal">POLAR</span>ROOM
      </span>
      <nav className="flex items-center gap-3 text-sm font-semibold">
        <Link
          href="/signup"
          className="rounded-full bg-royal px-5 py-2 text-white shadow-ice transition hover:bg-royal-dark"
        >
          Sign Up
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-navy/15 px-5 py-2 text-navy transition hover:border-royal hover:text-royal"
        >
          Log In
        </Link>
      </nav>
    </header>
  );
}
