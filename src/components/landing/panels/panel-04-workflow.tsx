import { PanelShell } from "../panel-shell";
import { Mascot } from "../mascot";
import { FeatureItem } from "../feature-item";
import { UserIcon, LayersIcon, ClockIcon, SparkleIcon } from "../icons";

export function PanelWorkflow() {
  return (
    <PanelShell>
      <div className="grid items-center gap-12 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-display text-3xl tracking-wide text-navy sm:text-5xl">
            WORKFLOW MODE
          </h2>
          <p className="mt-3 font-display text-lg tracking-wide text-royal sm:text-xl">
            INFORMATION, STAGES AND TIMING IN ONE PLACE.
          </p>
          <p className="mt-4 max-w-xl text-sm text-navy/70 sm:text-base">
            Workflow Mode keeps the active client&rsquo;s important
            information available throughout their appointment while
            helping the barber remain precise, prepared and aware of time.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <FeatureItem icon={<UserIcon />} title="ACTIVE CLIENT INFORMATION">
              The current client&rsquo;s haircut history, preferences and
              safety information stay visible throughout the appointment.
            </FeatureItem>
            <FeatureItem icon={<LayersIcon />} title="WORKFLOW & STAGE AWARENESS">
              Shows where this appointment sits within the working day,
              helping the barber stay organised from start to next client.
            </FeatureItem>
            <FeatureItem icon={<ClockIcon />} title="LIVE APPOINTMENT TIMING">
              A live countdown and timed reminders help keep every
              appointment on track.
            </FeatureItem>
            <FeatureItem icon={<SparkleIcon />} title="SMOOTHER WORKFLOW">
              The right client information is available at the right stage
              of the working day.
            </FeatureItem>
          </div>
        </div>
        <Mascot pose="guardian" className="mx-auto h-64 w-56 sm:h-80 sm:w-72" />
      </div>
    </PanelShell>
  );
}
