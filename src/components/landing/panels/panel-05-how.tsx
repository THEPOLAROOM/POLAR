import { PanelShell } from "../panel-shell";
import { Mascot } from "../mascot";
import { FeatureItem } from "../feature-item";
import {
  UserIcon,
  ClockIcon,
  LinkIcon,
  SearchIcon,
  SparkleIcon,
  IdIcon,
} from "../icons";

export function PanelHow() {
  return (
    <PanelShell>
      <div className="grid items-start gap-12 md:grid-cols-[1fr_1.3fr]">
        <div className="md:sticky md:top-24">
          <Mascot pose="assertive" className="mx-auto h-56 w-48 sm:h-72 sm:w-64" />
        </div>

        <div>
          <h2 className="font-display text-3xl tracking-wide text-navy sm:text-5xl">
            HOW POLAR WORKS
          </h2>
          <p className="mt-3 font-display text-lg tracking-wide text-royal sm:text-xl">
            YOU&rsquo;RE MORE THAN JUST A BOOKING.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <FeatureItem icon={<UserIcon />} title="YOUR BARBER ACTUALLY REMEMBERS YOU">
              No explaining the same preferences every visit. POLAR keeps
              what matters ready for your barber.
            </FeatureItem>
            <FeatureItem icon={<ClockIcon />} title="YOUR APPOINTMENT ISN’T JUST A TIME SLOT">
              POLAR is designed around the full service experience, not
              just getting you into the chair.
            </FeatureItem>
            <FeatureItem icon={<LinkIcon />} title="YOUR INFORMATION WORKS TOGETHER">
              Your profile, appointment and service information connect
              throughout your journey.
            </FeatureItem>
            <FeatureItem icon={<SearchIcon />} title="LESS GUESSING. MORE CONSISTENCY.">
              Your service provider has the information they need when they
              need it, not just what they can remember.
            </FeatureItem>
            <FeatureItem icon={<SparkleIcon />} title="BOOKING WITH PERSONALITY">
              Most booking systems feel boring and transactional. POLAR is
              designed to feel personal, recognisable and worth being part
              of.
            </FeatureItem>
            <FeatureItem icon={<IdIcon />} title="YOU HAVE A POLAR IDENTITY">
              You&rsquo;re not just a name on a calendar. You have your own
              POLAR Identity, recognised by your barber every time you
              book.
            </FeatureItem>
          </div>

          <p className="mt-10 font-display text-xl tracking-wide text-navy sm:text-2xl">
            ONE CONNECTED SYSTEM. BUILT AROUND YOU.
          </p>
        </div>
      </div>
    </PanelShell>
  );
}
