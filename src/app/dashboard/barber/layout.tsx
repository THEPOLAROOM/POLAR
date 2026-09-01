import { DashboardNav } from "@/components/dashboard-nav";

const LINKS = [
  { href: "/dashboard/barber", label: "Dashboard" },
  { href: "/dashboard/barber/schedule", label: "Schedule" },
  { href: "/dashboard/barber/availability", label: "Availability" },
  { href: "/dashboard/barber/clients", label: "Clients" },
  { href: "/dashboard/barber/shift", label: "Active Shift" },
  { href: "/dashboard/barber/custom-fields", label: "Custom Fields" },
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
      <DashboardNav links={LINKS} />
      {children}
    </div>
  );
}
