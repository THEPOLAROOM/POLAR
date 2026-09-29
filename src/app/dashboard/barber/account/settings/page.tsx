import { requireRole } from "@/lib/auth/require-role";
import { SettingsView } from "./settings-view";

export default async function BarberSettingsPage() {
  const { user } = await requireRole("barber");
  return <SettingsView email={user.email ?? ""} />;
}
