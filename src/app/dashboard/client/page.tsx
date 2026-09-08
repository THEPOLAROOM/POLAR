import Link from "next/link";
import Image from "next/image";
import { requireRole } from "@/lib/auth/require-role";
import { CalendarIcon, HistoryIcon, UserIcon, ScissorsIcon, ChevronCircleIcon, CrownIcon } from "./icons";

// V1 placeholder: no polar_id column exists in the schema yet, and
// this pass does not add one (per instruction). Once a real POLAR ID
// assignment system exists, swap this constant for the real value.
const POLAR_ID_PLACEHOLDER = "P-000000";

// DashboardNav (in the shared client layout) is a fixed ~45px-tall
// bar (py-3 + text-sm content + 1px border). Sized to fill exactly
// the remaining viewport height beneath it so desktop never scrolls,
// without touching the shared layout used by every other client page.
const NAV_HEIGHT = "45px";

export default async function ClientDashboardPage() {
  const { user } = await requireRole("client");

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

      {/* Desktop — matches the approved mastered reference. */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: `calc(100dvh - ${NAV_HEIGHT})` }}>
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

        <div className="relative mx-auto grid h-full max-w-5xl grid-cols-3 grid-rows-2 gap-4 px-8 py-8">
          <Tile
            href="/dashboard/client/book"
            icon={<CalendarIcon />}
            label="BOOK APPOINTMENT"
            className="col-start-1 row-start-1"
          />

          <div className="col-start-2 row-span-2 flex items-center justify-center">
            <PolarIdCard polarId={POLAR_ID_PLACEHOLDER} />
          </div>

          <Tile
            href="/dashboard/client/bookings"
            icon={<HistoryIcon />}
            label="APPOINTMENT HISTORY"
            className="col-start-3 row-start-1"
          />

          {/* Destination pages not built yet — inert (no href) so the
              panel is visually complete but never navigates to a
              broken/non-existent route. */}
          <Tile icon={<UserIcon />} label="YOUR BARBER" className="col-start-1 row-start-2" />
          <Tile icon={<ScissorsIcon />} label="SERVICES" className="col-start-3 row-start-2" />
        </div>
      </main>
    </>
  );
}

function Tile({
  href,
  icon,
  label,
  className = "",
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
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
        className={`block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light ${className}`}
      >
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

function PolarIdCard({ polarId }: { polarId: string }) {
  return (
    <div className="relative flex h-[85%] w-full max-w-[280px] flex-col justify-between rounded-2xl border-2 border-royal-light bg-gradient-to-br from-ice-50 via-white to-ice-100 p-5 text-navy shadow-ice-lg">
      <div className="flex items-start justify-between">
        <div
          className="h-16 w-16 shrink-0 rounded-xl border-2 border-royal/40 bg-white/70"
          aria-hidden="true"
        />
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 font-display text-2xl leading-none tracking-wide text-navy">
            <CrownIcon className="h-4 w-4 text-royal" />
            POLAR
          </p>
          <p className="mt-1 text-[10px] tracking-[0.3em] text-navy/70">LONDON</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-widest text-navy/60">POLAR ID</p>
        <p className="font-display text-lg tracking-wide text-navy">{polarId}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-navy/60">Client</p>
        <div className="h-6 w-10 rounded bg-navy/20" aria-hidden="true" />
      </div>
    </div>
  );
}
