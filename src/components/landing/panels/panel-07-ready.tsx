import Link from "next/link";
import { Mascot } from "../mascot";

// Bookend panel — stronger, distinct "ice-shatter" closing treatment.
export function PanelReady() {
  return (
    <section className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#0A1128_0%,#0B1A3D_55%,#0B5FFF_140%)] px-6 py-24 text-center text-white sm:px-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 [background:repeating-conic-gradient(from_0deg,rgba(255,255,255,0.06)_0deg_9deg,transparent_9deg_18deg)]"
      />
      <div className="relative mx-auto max-w-2xl">
        <Mascot pose="assertive" className="mx-auto mb-8 h-56 w-48 sm:h-72 sm:w-64" />
        <h2 className="font-display text-4xl tracking-wide sm:text-6xl">
          YOU&rsquo;RE READY
        </h2>
        <p className="mt-4 text-sm text-white/80 sm:text-base">
          Your profile. Your appointments. Your experience. All connected
          with POLAR.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-full bg-white px-8 py-3 font-display text-sm tracking-wide text-navy shadow-ice-lg transition hover:bg-ice-100 sm:text-base"
        >
          CREATE YOUR POLAR PROFILE
        </Link>
        <p className="mt-6 font-display text-lg tracking-wide text-ice-glow sm:text-xl">
          LET&rsquo;S BREAK THE ICE.
        </p>
      </div>
    </section>
  );
}
