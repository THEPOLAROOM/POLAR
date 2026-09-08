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
          POLAR Room. */}
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
          </div>
        </div>

        <div className="relative mx-auto flex h-full max-w-5xl flex-col gap-4 px-8 py-8">
          <div className="grid flex-[2] grid-cols-[1fr_1.6fr_1fr] grid-rows-[1fr] gap-4">
            <Tile
              href="/dashboard/client/book"
              icon={<CalendarIcon />}
              label="BOOK APPOINTMENT"
            />

            <div className="h-full">
              <PolarIdCard polarId={polarId} />
            </div>

            <Tile
              href="/dashboard/client/bookings"
              icon={<HistoryIcon />}
              label="APPOINTMENT HISTORY"
            />
          </div>

          {/* Destination pages not built yet — inert (no href) so the
              panel is visually complete but never navigates to a
              broken/non-existent route. */}
          <div className="grid flex-1 grid-cols-2 grid-rows-[1fr] gap-4">
            <WideTile icon={<UserIcon />} label="YOUR BARBER" />
            <WideTile icon={<ScissorsIcon />} label="SERVICES" />
          </div>
        </div>
      </main>
    </>
  );
}

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
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-royal/30 bg-navy/70 text-white shadow-ice-lg backdrop-blur-md transition hover:border-royal-light hover:bg-navy/80">
      <div className="text-white">{icon}</div>
      <p className="font-display text-sm tracking-wide">{label}</p>
      <ChevronCircleIcon className="h-7 w-7 text-royal-light" />
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
    <div className="flex h-full items-center gap-4 rounded-2xl border border-royal/30 bg-navy/70 px-6 text-white shadow-ice-lg backdrop-blur-md transition hover:border-royal-light hover:bg-navy/80">
      <div className="text-white">{icon}</div>
      <p className="font-display text-sm tracking-wide">{label}</p>
      <ChevronCircleIcon className="ml-auto h-7 w-7 shrink-0 text-royal-light" />
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
    <div className="flex h-full w-full items-stretch gap-5 rounded-2xl border-2 border-royal-light bg-gradient-to-br from-ice-50 via-white to-ice-100 p-5 text-navy shadow-ice-lg">
      <div
        className="my-auto aspect-square h-[70%] shrink-0 rounded-xl border-2 border-royal/40 bg-white/70"
        aria-hidden="true"
      />

      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        <div className="self-end text-right">
          <p className="flex items-center justify-end gap-1 font-display text-xl leading-none tracking-wide text-navy">
            <CrownIcon className="h-4 w-4 text-royal" />
            POLAR
          </p>
          <p className="mt-1 text-[9px] tracking-[0.3em] text-navy/70">LONDON</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-navy/60">POLAR ID</p>
            <p className="font-display text-2xl tracking-wide text-navy">{polarId}</p>
          </div>
          <div className="h-7 w-11 shrink-0 rounded bg-navy/20" aria-hidden="true" />
        </div>

        <p className="text-[10px] uppercase tracking-widest text-navy/60">Client</p>
      </div>
    </div>
  );
}
