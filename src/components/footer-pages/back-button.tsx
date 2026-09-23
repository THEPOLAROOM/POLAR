"use client";

import { useRouter } from "next/navigation";

// Same corner position/size/style on every footer page (About,
// Privacy, Terms, Contact) — mirrors the exact placement convention
// the landing carousel's Header already uses for its logo (left-2
// top-2 sm:left-4 sm:top-4), reused here so it sits consistently
// regardless of each page's own artwork, rather than a new
// pixel-measured position per page. Deliberately small/understated
// (a thin outline pill, not a solid button) so it doesn't compete
// with the mastered design underneath.
//
// The arrow is aria-hidden and the accessible name comes from the
// visible "BACK" text alone — a standard icon+label pattern — so
// screen readers announce a clean "Back" rather than "leftwards arrow
// Back".
export function BackButton() {
  const router = useRouter();

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    // Two approaches were tried and rejected before this one, both
    // confirmed broken by direct testing:
    // 1) document.referrer — only reflects a real full page load;
    //    Next.js <Link> navigation is client-side (pushState), so it
    //    stays stale/empty even immediately after genuinely arriving
    //    via an in-site footer link.
    // 2) window.history.length > 1 — headless/real browsers alike can
    //    start a fresh tab with an existing blank entry already in the
    //    stack, so a tab opened straight to a footer link (no real
    //    history) still measured length 2, and router.back() landed on
    //    that blank entry instead of falling back to "/".
    //
    // This checks a sessionStorage flag instead, set by the footer's
    // own links the instant one is clicked (see landing/footer.tsx) —
    // the only place these pages are ever reached from in-app. It's
    // only ever true when this tab genuinely came from a footer link,
    // immune to both of the above ambiguities, and naturally clears
    // itself when the tab closes.
    let cameFromFooterNav = false;
    try {
      cameFromFooterNav = sessionStorage.getItem("polar-footer-nav") === "1";
    } catch {
      cameFromFooterNav = false;
    }
    if (cameFromFooterNav) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="pointer-events-auto absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full border border-magenta/40 bg-white/85 px-2.5 py-1 font-display text-[10px] uppercase tracking-wide text-navy shadow-sm backdrop-blur-sm transition hover:border-magenta hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs"
    >
      <span aria-hidden="true">←</span> BACK
    </button>
  );
}
