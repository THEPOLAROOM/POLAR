// The main client dashboard (/dashboard/client) renders full-screen
// with no top nav, per the mastered design — it is not wrapped here.
// Other client routes (book/bookings/reschedule) render their own
// DashboardNav directly since this layout no longer provides one.
export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
