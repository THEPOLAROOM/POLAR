import { requireRole } from "@/lib/auth/require-role";
import { EportfolioView } from "./eportfolio-view";

export default async function BarberEportfolioPage() {
  await requireRole("barber");
  return <EportfolioView />;
}
