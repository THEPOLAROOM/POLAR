import { PanelShell } from "../panel-shell";
import { Mascot } from "../mascot";
import { FeatureItem } from "../feature-item";
import { ShieldIcon, PhotoIcon, UserIcon, LockIcon } from "../icons";

export function PanelCard() {
  return (
    <PanelShell>
      <div className="grid items-center gap-12 md:grid-cols-[1fr_1.2fr]">
        <Mascot pose="guardian" className="mx-auto h-64 w-56 sm:h-80 sm:w-72" />
        <div>
          <h2 className="font-display text-3xl tracking-wide text-navy sm:text-5xl">
            POLAR CARD
          </h2>
          <p className="mt-3 font-display text-lg tracking-wide text-royal sm:text-xl">
            YOUR HAIRCUT. REMEMBERED.
          </p>
          <p className="mt-4 max-w-xl text-sm text-navy/70 sm:text-base">
            Your POLAR Card gives your barber the important details behind
            your haircut without relying on memory.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <FeatureItem icon={<ShieldIcon />} title="SAFER SERVICE">
              Important allergies, sensitivities and safety information stay
              visible.
            </FeatureItem>
            <FeatureItem icon={<PhotoIcon />} title="YOUR CUT ON RECORD">
              Your current haircut photo, lengths, fade, beard and
              preferences are kept together.
            </FeatureItem>
            <FeatureItem icon={<UserIcon />} title="PERSONALISED TO YOU">
              Your hair type, scalp condition and individual requirements
              help shape your service.
            </FeatureItem>
            <FeatureItem icon={<LockIcon />} title="PRIVATE & SECURE">
              Your personal information and private barber Client Insights
              remain protected.
            </FeatureItem>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}
