// PLACEHOLDER — no real POLAR app splash/login screen exists yet.
// Simple CSS-drawn phone frame with a stand-in splash screen. Swap
// the inner content (or the whole component) for a real screenshot
// once one is approved.
export function PhoneMockup() {
  return (
    <div className="relative h-[420px] w-[210px] rounded-[2.5rem] border-[6px] border-navy bg-navy shadow-ice-lg sm:h-[480px] sm:w-[240px]">
      <div className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-black/60" />
      <div className="absolute inset-[6px] overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#0B5FFF_0%,#0A1128_100%)]">
        <div className="flex h-full flex-col items-center justify-center gap-3 text-white">
          <span className="font-display text-2xl tracking-wide">POLAR</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/70">
            Sign in
          </span>
          <div className="mt-6 h-9 w-32 rounded-full bg-white/15" />
          <div className="h-9 w-32 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}
