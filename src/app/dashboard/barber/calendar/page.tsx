import { requireRole } from "@/lib/auth/require-role";
import { getShopToday, getShopTimeNow } from "@/lib/dates";
import {
  getAvailabilityForDate,
  getDayBookings,
  getDaySummaries,
  type CalendarBooking,
  type DaySummary,
} from "@/lib/queries/barber-calendar";
import { CalendarView, type MonthCell, type ViewKind } from "./calendar-view";

// Focus Mode tabs are Day / Week / Month / List; "year" is still served
// for existing links but no longer has a tab.
const VALID_VIEWS: ViewKind[] = ["day", "week", "month", "list", "year"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeekMonday(dateStr: string): Date {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const jsDay = d.getUTCDay(); // 0=Sun..6=Sat
  const mondayIndex = (jsDay + 6) % 7; // 0=Mon..6=Sun
  d.setUTCDate(d.getUTCDate() - mondayIndex);
  return d;
}

function buildMonthCells(year: number, month: number, summaries: Map<string, DaySummary>): MonthCell[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mondayIndex = (firstOfMonth.getUTCDay() + 6) % 7;

  const cells: MonthCell[] = [];
  for (let i = 0; i < mondayIndex; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const summary = summaries.get(date) ?? { count: 0, isFullyBooked: false, hasAvailability: false };
    cells.push({ date, day, count: summary.count, isFullyBooked: summary.isFullyBooked });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Server-side ROLE check happens FIRST, same as every other protected
// barber page.
export default async function BarberCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; action?: string }>;
}) {
  const { supabase, user } = await requireRole("barber");
  const { view: rawView, date: rawDate, action: rawAction } = await searchParams;
  const action = rawAction === "book" || rawAction === "walkin" || rawAction === "block" ? rawAction : null;

  const today = getShopToday();
  const view: ViewKind = VALID_VIEWS.includes(rawView as ViewKind) ? (rawView as ViewKind) : "month";
  const date = rawDate && DATE_RE.test(rawDate) ? rawDate : today;

  const [year, month] = date.split("-").map(Number);

  // Today's real summary for the right-hand "At a Glance" panel —
  // shown regardless of which view is active, same as the approved
  // design.
  const now = getShopTimeNow();
  const [todaysBookings, activeServices, clientLinks] = await Promise.all([
    getDayBookings(supabase, user.id, today),
    supabase
      .from("services")
      .select("id, name, duration_minutes, price")
      .eq("barber_profile_id", user.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase.from("barber_client_links").select("client_profile_id").eq("barber_profile_id", user.id),
  ]);

  const clientIds = (clientLinks.data ?? []).map((l) => l.client_profile_id as string);
  const { data: clientProfiles } =
    clientIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", clientIds).order("full_name", { ascending: true })
      : { data: [] as { id: string; full_name: string }[] };

  const services = (activeServices.data ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    durationMinutes: s.duration_minutes as number,
    price: Number(s.price),
  }));
  const clients = ((clientProfiles ?? []) as { id: string; full_name: string }[]).map((c) => ({
    id: c.id,
    fullName: c.full_name,
  }));

  const upcoming = todaysBookings.filter((b) => b.startTime > now);
  const todaySummary = {
    count: todaysBookings.length,
    nextTime: upcoming[0]?.startTime ?? null,
  };

  let monthCells: MonthCell[] | null = null;
  let dayData: { availability: { startTime: string; endTime: string }[]; bookings: Awaited<ReturnType<typeof getDayBookings>> } | null = null;
  let weekDays: { date: string; label: string; count: number; isFullyBooked: boolean; hasAvailability: boolean; bookings: CalendarBooking[] }[] | null = null;
  let listDays: { date: string; bookings: CalendarBooking[] }[] | null = null;
  let yearMonths: { month: number; label: string; cells: MonthCell[] }[] | null = null;

  if (view === "month") {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const summaries = await getDaySummaries(
      supabase,
      user.id,
      `${year}-${String(month).padStart(2, "0")}-01`,
      `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`
    );
    monthCells = buildMonthCells(year, month, summaries);
  } else if (view === "day") {
    const [availability, bookings] = await Promise.all([
      getAvailabilityForDate(supabase, user.id, date),
      getDayBookings(supabase, user.id, date),
    ]);
    dayData = { availability, bookings };
  } else if (view === "week") {
    const weekStart = startOfWeekMonday(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    const summaries = await getDaySummaries(supabase, user.id, toDateStr(weekStart), toDateStr(weekEnd));
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dates = labels.map((_, i) => {
      const d = new Date(weekStart);
      d.setUTCDate(d.getUTCDate() + i);
      return toDateStr(d);
    });
    const perDay = await Promise.all(
      dates.map((d) => ((summaries.get(d)?.count ?? 0) > 0 ? getDayBookings(supabase, user.id, d) : Promise.resolve([] as CalendarBooking[])))
    );
    weekDays = labels.map((label, i) => {
      const dateStr = dates[i];
      const summary = summaries.get(dateStr) ?? { count: 0, isFullyBooked: false, hasAvailability: false };
      return {
        date: dateStr,
        label: `${label} ${Number(dateStr.slice(8))}`,
        count: summary.count,
        isFullyBooked: summary.isFullyBooked,
        hasAvailability: summary.hasAvailability,
        bookings: perDay[i],
      };
    });
  } else if (view === "list") {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const summaries = await getDaySummaries(
      supabase,
      user.id,
      `${year}-${String(month).padStart(2, "0")}-01`,
      `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`
    );
    const busy = [...summaries.entries()].filter(([, v]) => v.count > 0).map(([d]) => d).sort();
    const perDay = await Promise.all(busy.map((d) => getDayBookings(supabase, user.id, d)));
    listDays = busy.map((d, i) => ({ date: d, bookings: perDay[i] })).filter((d) => d.bookings.length > 0);
  } else if (view === "year") {
    const summaries = await getDaySummaries(supabase, user.id, `${year}-01-01`, `${year}-12-31`);
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    yearMonths = monthLabels.map((label, i) => ({
      month: i + 1,
      label,
      cells: buildMonthCells(year, i + 1, summaries),
    }));
  }

  return (
    <CalendarView
      view={view}
      date={date}
      today={today}
      services={services}
      clients={clients}
      todaySummary={todaySummary}
      monthCells={monthCells}
      dayData={dayData}
      weekDays={weekDays}
      listDays={listDays}
      action={action}
      yearMonths={yearMonths}
    />
  );
}
