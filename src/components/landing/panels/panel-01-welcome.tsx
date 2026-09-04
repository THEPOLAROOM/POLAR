import { Mascot } from "../mascot";

// Bookend panel — deliberately stronger/distinct treatment, not the
// PanelShell system used by panels 02–06.
export function PanelWelcome() {
  return (
    <section className="relative flex min-h-[640px] w-full flex-col justify-center overflow-hidden bg-[radial-gradient(circle_at_15%_15%,rgba(11,95,255,0.22),transparent_45%),radial-gradient(circle_at_85%_0%,rgba(255,61,154,0.10),transparent_40%),linear-gradient(180deg,#EAF4FF_0%,#F7FBFF_100%)] px-6 py-20 sm:px-12 md:px-20">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 md:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl leading-[0.95] tracking-wide text-navy sm:text-6xl">
            WELCOME TO POLAR
          </h1>
          <div className="mt-3 h-1 w-24 rounded-full bg-[linear-gradient(90deg,#0B5FFF,transparent)]" />
          <p className="mt-5 font-display text-xl tracking-wide text-royal sm:text-2xl">
            THE PORTAL TO YOUR COLDEST CUTS.
          </p>

          <div className="mt-10 space-y-6">
            <Line title="20+ YEARS INDUSTRY EXPERIENCE">
              Professional. Proven. And built on real experience.
            </Line>
            <Line title="CLIENT CONFIDENTIALITY BUILT IN">
              Your information stays private, secure and protected.
            </Line>
            <Line title="POWERED BY INTELLIGENT ANALYTICS">
              Smarter insights. Better service. Every time.
            </Line>
          </div>
        </div>

        <div className="mx-auto h-[340px] w-[280px] sm:h-[440px] sm:w-[360px]">
          <Mascot pose="assertive" className="h-full w-full" />
        </div>
      </div>
    </section>
  );
}

function Line({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-sm tracking-wide text-navy sm:text-base">
        {title}
      </h3>
      <p className="mt-1 text-sm text-navy/70">{children}</p>
    </div>
  );
}
