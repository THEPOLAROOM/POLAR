import { PhoneMockup } from "./phone-mockup";
import { StoreBadges } from "./store-badges";

export function LowerSection() {
  return (
    <section className="bg-white px-6 py-24 sm:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-display text-2xl tracking-wide text-navy sm:text-3xl">
          BUILT IN LONDON. BUILT FOR BETTER BARBERING.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm text-navy/70 sm:text-base">
          POLAR brings barbering experience and modern technology together
          to create a more connected experience before during and after
          every appointment.
        </p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-royal">
          London, UK
        </p>
      </div>

      <div className="mx-auto mt-24 grid max-w-5xl items-center gap-12 md:grid-cols-2">
        <div className="order-2 text-center md:order-1 md:text-left">
          <h2 className="font-display text-3xl tracking-wide text-navy sm:text-4xl">
            POLAR IN YOUR POCKET
          </h2>
          <p className="mt-3 font-display text-lg tracking-wide text-royal">
            TAKE POLAR WITH YOU.
          </p>
          <div className="mt-8 flex justify-center md:justify-start">
            <StoreBadges />
          </div>
        </div>
        <div className="order-1 mx-auto md:order-2">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
