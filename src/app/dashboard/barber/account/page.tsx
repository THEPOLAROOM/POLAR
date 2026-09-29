import { requireRole } from "@/lib/auth/require-role";
import { ProfileView } from "./profile-view";

// My Profile hub. Server-side ROLE check happens FIRST, same as every
// other protected barber page. The hub is navigation only: DETAILS,
// CAREER, ePORTFOLIO, ANALYTICS and SETTINGS each hold their own data
// (name editing now lives in DETAILS; the signed-in email in SETTINGS).
export default async function BarberAccountPage() {
  await requireRole("barber");
  return <ProfileView />;
}
