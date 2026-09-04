// PLACEHOLDER — generic badge shapes, not the official Apple/Google
// artwork (no approved badge assets exist yet, and the official marks
// shouldn't be recreated by hand). Swap each <Badge> for the real
// official badge image once POLAR has App Store / Play Store listings.
export function StoreBadges() {
  return (
    <div className="flex flex-wrap gap-3">
      <Badge eyebrow="Download on the" title="App Store" />
      <Badge eyebrow="Get it on" title="Google Play" />
    </div>
  );
}

function Badge({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-navy bg-navy px-4 py-2 text-white shadow-ice">
      <span aria-hidden="true" className="text-lg leading-none text-royal-light">
        ▲
      </span>
      <div className="leading-tight">
        <p className="text-[9px] uppercase tracking-wide text-white/70">{eyebrow}</p>
        <p className="font-display text-sm tracking-wide">{title}</p>
      </div>
    </div>
  );
}
