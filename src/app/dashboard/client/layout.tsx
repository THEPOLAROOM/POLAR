import { DashboardNav } from "@/components/dashboard-nav";

const LINKS = [
  { href: "/dashboard/client", label: "Dashboard" },
  { href: "/dashboard/client/book", label: "Book Appointment" },
  { href: "/dashboard/client/bookings", label: "My Bookings" },
];

// Applies to every route under /dashboard/client. Each page still
// independently calls requireRole("client") as the actual
// authorization check — this layout is navigation only.
export default function ClientDashboardLayout({
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
