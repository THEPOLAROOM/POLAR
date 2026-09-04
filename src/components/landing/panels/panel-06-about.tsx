import { PanelShell } from "../panel-shell";
import { Mascot } from "../mascot";
import { FeatureItem } from "../feature-item";
import { SparkleIcon, ShieldIcon, UserIcon, ClockIcon } from "../icons";

export function PanelAbout() {
  return (
    <PanelShell>
      <div className="grid items-center gap-12 md:grid-cols-[1fr_1.1fr]">
        <Mascot pose="guardian" className="mx-auto h-64 w-56 sm:h-80 sm:w-72" />
        <div>
          <h2 className="font-display text-3xl tracking-wide text-navy sm:text-5xl">
            ABOUT POLAR
          </h2>
          <p className="mt-3 font-display text-sm tracking-[0.25em] text-royal sm:text-base">
            PRECISION • SAFETY • PERSONALISATION • TIME
          </p>

          <div className="mt-8 space-y-6">
            <FeatureItem icon={<SparkleIcon />} title="PRECISION">
              Every detail matters. POLAR helps barbers stay precise and
              consistent in every cut.
            </FeatureItem>
            <FeatureItem icon={<ShieldIcon />} title="SAFETY">
              Important information, allergies and preferences are always
              stored securely and accessed safely.
            </FeatureItem>
            <FeatureItem icon={<UserIcon />} title="PERSONALISATION">
              Every client is unique. POLAR keeps preferences and history
              so every visit feels personal.
            </FeatureItem>
            <FeatureItem icon={<ClockIcon />} title="TIME">
              Less searching, more cutting. POLAR saves time so
              appointments run smoother.
            </FeatureItem>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}
