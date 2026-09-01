import { DashboardNav } from "@/components/dashboard-nav";

// Consolidated primary barber navigation — four distinct areas, no
// duplicate-purpose main pages. Schedule/Availability/Active Shift/
// Custom Fields still exist as routes (reused internally, e.g. linked
// from within Calendar or the Client Profile Card) — they're just no
// longer separate primary tabs.
const LINKS = [
  { href: "/dashboard/barber", label: "Home" },
  { href: "/dashboard/barber/services", label: "My Services" },
  { href: "/dashboard/barber/calendar", label: "Calendar" },
  { href: "/dashboard/barber/clients", label: "Client Phone Book" },
];

// Secondary — reachable but not a primary workflow tab.
const SECONDARY_LINKS = [
  { href: "/dashboard/barber/account", label: "My Profile" },
];

// Applies to every route under /dashboard/barber. Each page still
// independently calls requireRole("barber") as the actual
// authorization check — this layout is navigation only.
export default function BarberDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <DashboardNav links={LINKS} secondaryLinks={SECONDARY_LINKS} />
      {children}
    </div>
  );
}
