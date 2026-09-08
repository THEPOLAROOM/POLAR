import Link from "next/link";
import Image from "next/image";
import { requireRole } from "@/lib/auth/require-role";
import { CalendarIcon, HistoryIcon, UserIcon, ScissorsIcon, ChevronCircleIcon, CrownIcon } from "./icons";

// UI fallback only — shown when profiles.polar_id is genuinely null
// (not yet assigned; assignment happens on email verification for
// client accounts, per the polar_client_id_seq migration).
const POLAR_ID_PLACEHOLDER = "P-000000";

export default async function ClientDashboardPage() {
  const { supabase, user } = await requireRole("client");

  const { data: profile } = await supabase
    .from("profiles")
    .select("polar_id")
    .eq("id", user.id)
    .maybeSingle();

  const polarId = profile?.polar_id ?? POLAR_ID_PLACEHOLDER;

  return (
    <>
      {/* Mobile/tablet — simple functional placeholder. The approved
          mobile dashboard design is separate, upcoming work. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">Client Dashboard</h1>
        <p className="mt-2 text-sm text-polar-muted">Signed in as {user.email}.</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          <li>
            <Link href="/dashboard/client/book" className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text">
              Book Appointment
            </Link>
          </li>
          <li>
            <Link href="/dashboard/client/bookings" className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text">
              My Bookings
            </Link>
          </li>
        </ul>
      </main>

      {/* Desktop — matches the approved mastered reference
          (polar-client-dashboard-mastered.png). No top nav on this
          page: the dashboard begins directly with the full-screen
          POLAR Room. The panel composition lives INSIDE the same
          aspect-ratio box as the background image (not the raw
          viewport) so its position/size stays locked to the artwork
          — sized and inset to match the reference's proportions
          (~76% wide, ~57% tall, centred, more room revealed above/
          below/around it than the previous full-height layout). */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full aspect-[1672/941]">
            <Image
              src="/dashboard/polar-client-dashboard-desktop-background.png"
              alt=""
              fill
              priority
              className="object-cover"
              aria-hidden="true"
            />

            <div
              className="absolute flex flex-col gap-[1.5%]"
              style={{ left: "12%", right: "12%", top: "27%", bottom: "15.5%" }}
            >
              <div className="grid flex-[64] grid-cols-[1fr_2fr_1fr] grid-rows-[1fr] gap-[1.2%]">
                <Tile
                  href="/dashboard/client/book"
                  icon={<CalendarIcon className="h-12 w-12 drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]" />}
                  label="BOOK APPOINTMENT"
                />

                <div className="h-full">
                  <PolarIdCard polarId={polarId} />
                </div>

                <Tile
                  href="/dashboard/client/bookings"
                  icon={<HistoryIcon className="h-12 w-12 drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]" />}
                  label="APPOINTMENT HISTORY"
                />
              </div>

              {/* Destination pages not built yet — inert (no href) so
                  the panel is visually complete but never navigates to
                  a broken/non-existent route. */}
              <div className="grid flex-[33] grid-cols-2 grid-rows-[1fr] gap-[1.2%]">
                <WideTile icon={<UserIcon className="h-11 w-11 drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]" />} label="YOUR BARBER" />
                <WideTile icon={<ScissorsIcon className="h-11 w-11 drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]" />} label="SERVICES" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// Shared corner-paint-splash accent for the dark navy panels — CSS
// only (radial gradients using the existing royal/magenta tokens),
// approximating the mastered reference's abstract blue/pink mural
// detailing, which sits along the BOTTOM edge/corners of each panel
// while the top stays clean dark navy — without baking any new
// artwork.
function PanelAccent() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-2xl"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 0% 100%, rgba(11,95,255,0.5), transparent 60%), radial-gradient(ellipse 65% 50% at 100% 100%, rgba(255,61,154,0.32), transparent 60%), linear-gradient(0deg, rgba(91,155,255,0.22), transparent 45%)",
      }}
    />
  );
}

const PANEL_CLASS =
  "relative overflow-hidden rounded-2xl border-2 border-royal-light bg-gradient-to-b from-navy-light to-navy text-white shadow-[0_0_0_1px_rgba(91,155,255,0.35),0_0_18px_2px_rgba(91,155,255,0.55),0_0_45px_-4px_rgba(91,155,255,0.85),0_20px_45px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md transition hover:shadow-[0_0_0_1px_rgba(91,155,255,0.55),0_0_22px_2px_rgba(91,155,255,0.7),0_0_55px_-2px_rgba(91,155,255,1),0_20px_45px_-20px_rgba(0,0,0,0.9)]";

function Tile({
  href,
  icon,
  label,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
}) {
  const inner = (
    <div className={`flex h-full flex-col items-center justify-center gap-3 ${PANEL_CLASS}`}>
      <PanelAccent />
      <div className="relative z-10 text-white">{icon}</div>
      <p className="relative z-10 font-display text-sm tracking-wide">{label}</p>
      <ChevronCircleIcon className="relative z-10 h-8 w-8 text-royal-light" />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light"
      >
        {inner}
      </Link>
    );
  }

  return <div className="h-full">{inner}</div>;
}

function WideTile({
  href,
  icon,
  label,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
}) {
  const inner = (
    <div className={`flex h-full items-center gap-4 px-6 ${PANEL_CLASS}`}>
      <PanelAccent />
      <div className="relative z-10 text-white">{icon}</div>
      <p className="relative z-10 font-display text-sm tracking-wide">{label}</p>
      <ChevronCircleIcon className="relative z-10 ml-auto h-8 w-8 shrink-0 text-royal-light" />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light"
      >
        {inner}
      </Link>
    );
  }

  return <div className="h-full">{inner}</div>;
}

function PolarIdCard({ polarId }: { polarId: string }) {
  return (
    <div className="relative flex h-full w-full items-stretch gap-3.5 overflow-hidden rounded-2xl border-[3px] border-royal-light bg-gradient-to-br from-ice-50 via-white to-ice-100 p-3.5 text-navy shadow-[0_0_0_1px_rgba(91,155,255,0.4),0_0_18px_2px_rgba(91,155,255,0.5),0_0_45px_-4px_rgba(91,155,255,0.9),0_20px_45px_-20px_rgba(0,0,0,0.6)]">
      {/* Icy/crystalline texture + POLAR mural corner detailing — CSS
          only, layered background (no baked artwork). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 0% 0%, rgba(11,95,255,0.28), transparent 55%), radial-gradient(ellipse 50% 55% at 100% 0%, rgba(11,95,255,0.16), transparent 50%), radial-gradient(ellipse 60% 60% at 0% 100%, rgba(255,61,154,0.28), transparent 55%), radial-gradient(ellipse 55% 55% at 100% 100%, rgba(255,61,154,0.2), transparent 55%), repeating-linear-gradient(115deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 34px)",
          opacity: 0.8,
        }}
      />

      <div
        className="relative z-10 my-auto aspect-square h-[62%] shrink-0 rounded-xl border-2 border-royal/40 bg-white/70"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between">
        <div className="self-end text-right">
          <p className="flex items-center justify-end gap-1.5 font-display text-3xl leading-none tracking-wide text-navy">
            <CrownIcon className="h-6 w-6 text-royal" />
            POLAR
          </p>
          <p className="mt-1 text-[10px] tracking-[0.35em] text-navy/70">LONDON</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-navy/60">POLAR ID</p>
            <p className="whitespace-nowrap font-display text-4xl tracking-wide text-navy">{polarId}</p>
          </div>
          <div
            aria-hidden="true"
            className="h-9 w-12 shrink-0 rounded-sm border border-navy/30 bg-gradient-to-br from-navy/30 via-navy/10 to-navy/30"
          />
        </div>

        <div className="flex items-end justify-between gap-3">
          <p className="text-[10px] uppercase tracking-widest text-navy/60">Client</p>
          <div
            aria-hidden="true"
            className="h-3.5 w-32 shrink-0 bg-[repeating-linear-gradient(90deg,#0A1128_0_2px,transparent_2px_5px)] opacity-70"
          />
        </div>
      </div>
    </div>
  );
}
