import { PanelShell } from "../panel-shell";
import { Mascot } from "../mascot";

export function PanelWhy() {
  return (
    <PanelShell>
      <div className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="font-display text-3xl tracking-wide text-navy sm:text-5xl">
            WHY POLAR?
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-navy/70 sm:text-base">
            Over the last 20 years barbering has evolved at a remarkable
            pace. New styles and advancing technology have raised client
            expectations. At POLAR our job is to make sure barbers and
            clients alike evolve with it.
          </p>
          <p className="mt-8 font-display text-2xl tracking-wide text-royal sm:text-3xl">
            THE INDUSTRY EVOLVED.
          </p>
          <p className="font-display text-2xl tracking-wide text-navy sm:text-3xl">
            YOUR EXPERIENCE SHOULD TOO.
          </p>
        </div>
        <Mascot pose="assertive" className="mx-auto h-64 w-56 sm:h-80 sm:w-72" />
      </div>
    </PanelShell>
  );
}
