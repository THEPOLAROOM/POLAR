import { requireRole } from "@/lib/auth/require-role";
import { getShopToday } from "@/lib/dates";
import { getBarberAnalytics, type Period } from "@/lib/queries/barber-analytics";
import { AnalyticsView } from "./analytics-view";

const VALID_PERIODS: Period[] = ["day", "week", "month", "year"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function SmartAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>;
}) {
  const { supabase, user } = await requireRole("barber");
  const { period: rawPeriod, date: rawDate } = await searchParams;

  const today = getShopToday();
  const period: Period = VALID_PERIODS.includes(rawPeriod as Period) ? (rawPeriod as Period) : "day";
  const date = rawDate && DATE_RE.test(rawDate) ? rawDate : today;

  const data = await getBarberAnalytics(supabase, user.id, period, date);

  return <AnalyticsView period={period} date={date} today={today} data={data} />;
}
