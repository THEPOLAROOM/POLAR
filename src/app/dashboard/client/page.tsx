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
                  icon={<CalendarIcon className="h-10 w-10" />}
                  label="BOOK APPOINTMENT"
                />

                <div className="h-full">
                  <PolarIdCard polarId={polarId} />
                </div>

                <Tile
                  href="/dashboard/client/bookings"
                  icon={<HistoryIcon className="h-10 w-10" />}
                  label="APPOINTMENT HISTORY"
                />
              </div>

              {/* Destination pages not built yet — inert (no href) so
                  the panel is visually complete but never navigates to
                  a broken/non-existent route. */}
              <div className="grid flex-[33] grid-cols-2 grid-rows-[1fr] gap-[1.2%]">
                <WideTile icon={<UserIcon className="h-9 w-9" />} label="YOUR BARBER" />
                <WideTile icon={<ScissorsIcon className="h-9 w-9" />} label="SERVICES" />
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
// approximating the mastered reference's abstract blue/pink corner
// detailing without baking any new artwork.
function PanelAccent() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-2xl opacity-60"
      style={{
        background:
          "radial-gradient(circle at 100% 100%, rgba(255,61,154,0.25), transparent 55%), radial-gradient(circle at 0% 0%, rgba(11,95,255,0.35), transparent 60%)",
      }}
    />
  );
}

const PANEL_CLASS =
  "relative overflow-hidden rounded-2xl border-2 border-royal-light/80 bg-navy text-white shadow-[0_0_0_1px_rgba(91,155,255,0.25),0_0_30px_-6px_rgba(91,155,255,0.7),0_20px_45px_-20px_rgba(0,0,0,0.85)] backdrop-blur-md transition hover:border-royal-light hover:shadow-[0_0_0_1px_rgba(91,155,255,0.45),0_0_40px_-4px_rgba(91,155,255,0.9),0_20px_45px_-20px_rgba(0,0,0,0.85)]";

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
    <div className="relative flex h-full w-full items-stretch gap-4 overflow-hidden rounded-2xl border-2 border-royal-light bg-gradient-to-br from-ice-50 via-white to-ice-100 p-4 text-navy shadow-[0_0_0_1px_rgba(91,155,255,0.3),0_0_35px_-6px_rgba(91,155,255,0.8),0_20px_45px_-20px_rgba(0,0,0,0.6)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 100% 100%, rgba(255,61,154,0.18), transparent 45%), radial-gradient(circle at 0% 0%, rgba(11,95,255,0.22), transparent 45%)",
        }}
      />

      <div
        className="relative z-10 my-auto aspect-square h-[65%] shrink-0 rounded-xl border-2 border-royal/40 bg-white/70"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="self-end text-right">
          <p className="flex items-center justify-end gap-1 font-display text-2xl leading-none tracking-wide text-navy">
            <CrownIcon className="h-5 w-5 text-royal" />
            POLAR
          </p>
          <p className="mt-1 text-[10px] tracking-[0.3em] text-navy/70">LONDON</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-navy/60">POLAR ID</p>
            <p className="whitespace-nowrap font-display text-3xl tracking-wide text-navy">{polarId}</p>
          </div>
          <div
            aria-hidden="true"
            className="h-8 w-11 shrink-0 rounded-sm border border-navy/30 bg-gradient-to-br from-navy/30 via-navy/10 to-navy/30"
          />
        </div>

        <div className="flex items-end justify-between gap-3">
          <p className="text-[10px] uppercase tracking-widest text-navy/60">Client</p>
          <div
            aria-hidden="true"
            className="h-3 w-28 shrink-0 bg-[repeating-linear-gradient(90deg,#0A1128_0_2px,transparent_2px_5px)] opacity-70"
          />
        </div>
      </div>
    </div>
  );
}
