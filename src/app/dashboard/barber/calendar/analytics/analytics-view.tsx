import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AnalyticsData, Period } from "@/lib/queries/barber-analytics";

// Asset is 1536x1024 — every box below was pixel-scanned directly off
// the mastered PNG's own baked borders (not assumed uniform, not
// eyeballed) and confirmed by overlaying the measured lines back onto
// the asset and checking pixel-exact alignment. The 3x3 panel grid is
// NOT perfectly uniform in the artwork itself (columns range 477-494px
// of 1536, rows 273-295px of 1024), so each panel's box is its own
// pair of measured edges rather than a 33.3%/33.3% formula.
const ASSET_ASPECT = "1536 / 1024";

const COL_BOUNDS = [1.432, 33.464, 34.440, 65.495, 66.406, 98.568];
const ROW_BOUNDS = [10.547, 39.355, 40.625, 67.285, 68.457, 96.191];

function panelBox(col: number, row: number) {
  return {
    left: `${COL_BOUNDS[col]}%`,
    top: `${ROW_BOUNDS[row]}%`,
    width: `${COL_BOUNDS[col + 1] - COL_BOUNDS[col]}%`,
    height: `${ROW_BOUNDS[row + 1] - ROW_BOUNDS[row]}%`,
  };
}

const TAB_ROW_BOX = { left: "46.224%", top: "0.684%", width: "30.794%", height: "8.398%" };
const NAV_ROW_BOX = { left: "78.125%", top: "0.684%", width: "21.289%", height: "8.398%" };

const HEADER_FILL = "#050f37";

const TAB_ACTIVE_CLASS = "rounded-lg bg-gradient-to-r from-royal to-magenta text-white shadow-[0_0_14px_-2px_rgba(255,61,154,0.75)] hover:brightness-110";
const TAB_INACTIVE_CLASS = "text-white/70 hover:bg-white/5 hover:text-white";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function addMonths(date: string, months: number): string {
  const [y, m] = date.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-01`;
}
function addYears(date: string, years: number): string {
  const [y, m, day] = date.split("-").map(Number);
  return `${y + years}-${pad(m)}-${pad(day)}`;
}
function startOfWeekMonday(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const mondayIndex = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - mondayIndex);
  return d.toISOString().slice(0, 10);
}
function periodLabel(period: Period, date: string): string {
  const [y, m] = date.split("-").map(Number);
  if (period === "day") {
    return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  }
  if (period === "week") {
    const start = startOfWeekMonday(date);
    const end = addDays(start, 6);
    const startFmt = new Date(`${start}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
    const endFmt = new Date(`${end}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    return `${startFmt} – ${endFmt}`;
  }
  if (period === "year") return String(y);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

function money(n: number): string {
  return `£${n.toFixed(2)}`;
}
function hoursLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function AnalyticsView({ period, date, today, data }: { period: Period; date: string; today: string; data: AnalyticsData }) {
  const prevHref =
    period === "day"
      ? `?period=day&date=${addDays(date, -1)}`
      : period === "week"
        ? `?period=week&date=${addDays(date, -7)}`
        : period === "year"
          ? `?period=year&date=${addYears(date, -1)}`
          : `?period=month&date=${addMonths(date, -1)}`;
  const nextHref =
    period === "day"
      ? `?period=day&date=${addDays(date, 1)}`
      : period === "week"
        ? `?period=week&date=${addDays(date, 7)}`
        : period === "year"
          ? `?period=year&date=${addYears(date, 1)}`
          : `?period=month&date=${addMonths(date, 1)}`;
  const todayHref = `?period=${period}&date=${today}`;

  return (
    <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
      <Image src="/dashboard/polar-barber-dashboard-background.png" alt="" fill priority className="object-cover" aria-hidden="true" />

      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="relative" style={{ width: `min(94%, calc(100dvh * ${ASSET_ASPECT}))`, aspectRatio: ASSET_ASPECT }}>
          <Image src="/dashboard/polar-barber-analytics-ui-mastered.png" alt="Smart Analytics" fill priority className="object-contain" />

          {/* Period tabs — same shared-strip + breakout-active-pill
              architecture as Calendar's Day/Week/Month/Year row (the
              corrected version): one shared bordered strip, plain
              dividers between inactive segments, active tab renders
              at the exact same flex-1 footprint, no resize. */}
          <div className="absolute" style={TAB_ROW_BOX}>
            <div className="absolute -inset-[1%] rounded-xl" style={{ backgroundColor: HEADER_FILL }} aria-hidden="true" />
            <div className="relative flex h-full items-stretch overflow-hidden rounded-xl border border-royal-light/30">
              {(["day", "week", "month", "year"] as Period[]).map((p, i) => (
                <Link
                  key={p}
                  href={`?period=${p}&date=${date}`}
                  className={`flex flex-1 items-center justify-center font-body capitalize transition ${
                    period === p ? TAB_ACTIVE_CLASS : `${TAB_INACTIVE_CLASS} ${i > 0 ? "border-l border-royal-light/20" : ""}`
                  }`}
                  style={{ fontSize: "0.85vw" }}
                >
                  {p}
                </Link>
              ))}
            </div>
          </div>

          {/* Prev / period label / Today / Next */}
          <div className="absolute flex items-center" style={{ ...NAV_ROW_BOX, gap: "4%" }}>
            <div className="absolute -inset-[1%] rounded-xl" style={{ backgroundColor: HEADER_FILL }} aria-hidden="true" />
            <Link
              href={prevHref}
              aria-label="Previous"
              className="relative flex flex-none items-center justify-center rounded-lg border border-royal-light/30 text-white/80 transition hover:bg-white/5"
              style={{ width: "13%", height: "100%", fontSize: "0.85vw" }}
            >
              ‹
            </Link>
            <Link
              href={todayHref}
              className="relative flex-1 truncate rounded-lg border border-royal-light/30 text-center text-white transition hover:bg-white/5"
              style={{ fontSize: "0.78vw", padding: "0 2%" }}
            >
              {periodLabel(period, date)}
            </Link>
            <Link
              href={nextHref}
              aria-label="Next"
              className="relative flex flex-none items-center justify-center rounded-lg border border-royal-light/30 text-white/80 transition hover:bg-white/5"
              style={{ width: "13%", height: "100%", fontSize: "0.85vw" }}
            >
              ›
            </Link>
          </div>

          {/* 9 panels */}
          <PanelContent box={panelBox(0, 0)}><CashRevenuePanel data={data} /></PanelContent>
          <PanelContent box={panelBox(1, 0)}><WorkingHoursPanel data={data} /></PanelContent>
          <PanelContent box={panelBox(2, 0)}><PerHourPanel data={data} /></PanelContent>
          <PanelContent box={panelBox(0, 1)}><UtilisationPanel data={data} /></PanelContent>
          <PanelContent box={panelBox(1, 1)}><AppointmentsPanel data={data} /></PanelContent>
          <PanelContent box={panelBox(2, 1)}><TopServicesPanel data={data} /></PanelContent>
          <PanelContent box={panelBox(0, 2)}><ClientActivityPanel data={data} /></PanelContent>
          <PanelContent box={panelBox(1, 2)}><BusiestTimesPanel data={data} /></PanelContent>
          <PanelContent box={panelBox(2, 2)}><QuickStatsPanel data={data} /></PanelContent>
        </div>
      </div>
    </main>
  );
}

// Single explicit box (identical technique to TAB_ROW_BOX/NAV_ROW_BOX,
// which render correctly) with the internal inset applied as padding
// on that same box, rather than a second nested div sized implicitly
// from left+right/top+bottom with no explicit width/height of its
// own. That implicit inner box was the one thing on this page whose
// size the browser had to infer rather than being told outright, and
// it was resolving to a degenerate width live — padding percentages
// resolve unambiguously against this div's own already-definite
// width, so the content area is genuinely derived from the same
// measured panel box, not just visually clipped to hide a wrong
// position. overflow-hidden is a backstop against future long
// content, not a fix for positioning.
function PanelContent({ box, children }: { box: { left: string; top: string; width: string; height: string }; children: ReactNode }) {
  return (
    <div
      className="absolute overflow-hidden"
      style={{ ...box, paddingLeft: "4%", paddingRight: "4%", paddingTop: "21%", paddingBottom: "6%" }}
    >
      {children}
    </div>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-white" style={{ fontSize: "1.5vw", lineHeight: 1 }}>
      {children}
    </p>
  );
}

function EmptyNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="text-white/60" style={{ fontSize: "0.8vw" }}>{title}</p>
      <p className="mt-[2%] text-white/35" style={{ fontSize: "0.65vw" }}>{body}</p>
    </div>
  );
}

/** Small real SVG bar chart. Only rendered when there's real data — a true-empty period shows the static baked grid plus EmptyNote instead. */
function BarChart({ buckets, formatValue }: { buckets: { label: string; value: number }[]; formatValue: (v: number) => string }) {
  const max = Math.max(1, ...buckets.map((b) => b.value));
  // Sparse labels when there are many buckets (e.g. day-of-month) so text doesn't collide.
  const labelEvery = buckets.length > 10 ? Math.ceil(buckets.length / 8) : 1;
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 items-end gap-[2px]">
        {buckets.map((b, i) => (
          <div key={i} className="group relative flex-1" style={{ height: "100%" }} title={`${b.label}: ${formatValue(b.value)}`}>
            <div
              className="absolute bottom-0 w-full rounded-sm bg-gradient-to-t from-royal to-royal-light"
              style={{ height: `${Math.max(2, (b.value / max) * 100)}%`, opacity: b.value > 0 ? 1 : 0.12 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-[2%] flex gap-[2px]">
        {buckets.map((b, i) => (
          <span key={i} className="flex-1 truncate text-center text-white/40" style={{ fontSize: "0.55vw" }}>
            {i % labelEvery === 0 ? b.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function CashRevenuePanel({ data }: { data: AnalyticsData }) {
  const hasData = data.cashRevenue.total > 0;
  return (
    <div className="flex h-full flex-col">
      <Headline>{hasData ? money(data.cashRevenue.total) : "£—"}</Headline>
      <div className="mt-[3%] flex-1">
        {hasData ? (
          <BarChart buckets={data.cashRevenue.buckets} formatValue={money} />
        ) : (
          <EmptyNote title="No revenue data yet" body="Complete appointments to see your earnings." />
        )}
      </div>
    </div>
  );
}

function WorkingHoursPanel({ data }: { data: AnalyticsData }) {
  const hasData = data.workingHours.totalMinutes > 0;
  return (
    <div className="flex h-full flex-col">
      <Headline>{hasData ? hoursLabel(data.workingHours.totalMinutes) : "—"}</Headline>
      <div className="mt-[3%] flex-1">
        <EmptyNote
          title={hasData ? "Effective working time" : "No working hours data yet"}
          body={hasData ? "Scheduled hours minus breaks and blocked time." : "Start taking bookings to see your hours."}
        />
      </div>
    </div>
  );
}

function PerHourPanel({ data }: { data: AnalyticsData }) {
  const hasData = data.perWorkingHour != null;
  return (
    <div className="flex h-full flex-col">
      <Headline>{hasData ? `${money(data.perWorkingHour as number)}/hr` : "£—"}</Headline>
      <div className="mt-[3%] flex-1">
        <EmptyNote title="No data yet" body="Your average earnings per hour will appear here." />
      </div>
    </div>
  );
}

function UtilisationPanel({ data }: { data: AnalyticsData }) {
  const hasData = data.utilisation != null;
  return (
    <div className="flex h-full flex-col">
      <Headline>{hasData ? `${data.utilisation}%` : "—%"}</Headline>
      <div className="mt-[3%] flex-1">
        <EmptyNote title="No data yet" body="Complete appointments to see your utilisation." />
      </div>
    </div>
  );
}

function AppointmentsPanel({ data }: { data: AnalyticsData }) {
  const a = data.appointments;
  const total = a.completed + a.noShow + a.cancelled + a.upcoming;
  const rows: { label: string; value: number; className: string }[] = [
    { label: "Completed", value: a.completed, className: "bg-royal-light" },
    { label: "No Show", value: a.noShow, className: "bg-magenta" },
    { label: "Cancelled", value: a.cancelled, className: "bg-[#8b5cf6]" },
    { label: "Upcoming", value: a.upcoming, className: "bg-white/50" },
  ];
  if (total === 0) {
    return <EmptyNote title="No appointments yet" body="Your appointment data will appear here." />;
  }
  const circumference = 2 * Math.PI * 40;
  let offset = 0;
  return (
    <div className="flex h-full items-center gap-[6%]">
      <svg viewBox="0 0 100 100" className="h-full" style={{ maxHeight: "90%", aspectRatio: "1/1" }}>
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        {rows
          .filter((r) => r.value > 0)
          .map((r, i) => {
            const frac = r.value / total;
            const dash = frac * circumference;
            const circle = (
              <circle
                key={i}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                className={r.className.replace("bg-", "stroke-")}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
              />
            );
            offset += dash;
            return circle;
          })}
        <text x="50" y="47" textAnchor="middle" className="fill-white" style={{ fontSize: "17px", fontWeight: 700 }}>
          {total}
        </text>
        <text x="50" y="62" textAnchor="middle" className="fill-white/50" style={{ fontSize: "8px" }}>
          Total
        </text>
      </svg>
      <div className="flex flex-1 flex-col gap-[4%]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-[6%]">
            <span className={`h-[0.6vw] w-[0.6vw] flex-none rounded-full ${r.className}`} />
            <span className="flex-1 truncate text-white/70" style={{ fontSize: "0.68vw" }}>{r.label}</span>
            <span className="text-white" style={{ fontSize: "0.68vw" }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopServicesPanel({ data }: { data: AnalyticsData }) {
  if (data.topServices.length === 0) {
    return <EmptyNote title="No service data yet" body="Your most popular services will appear here." />;
  }
  const max = Math.max(1, ...data.topServices.map((s) => s.revenue));
  return (
    <div className="flex h-full flex-col justify-center gap-[6%]">
      {data.topServices.map((s) => (
        <div key={s.serviceId} className="flex items-center gap-[3%]">
          <span className="truncate text-white/70" style={{ fontSize: "0.68vw", width: "28%" }}>{s.name}</span>
          <div className="h-[0.9vw] flex-1 overflow-hidden rounded-sm bg-white/5">
            <div className="h-full rounded-sm bg-gradient-to-r from-royal to-magenta" style={{ width: `${Math.max(4, (s.revenue / max) * 100)}%` }} />
          </div>
          <span className="text-white" style={{ fontSize: "0.65vw", width: "16%", textAlign: "right" }}>{money(s.revenue)}</span>
        </div>
      ))}
    </div>
  );
}

function ClientActivityPanel({ data }: { data: AnalyticsData }) {
  const c = data.clientActivity;
  const rows = [
    { label: "Total Clients", value: c.totalClients > 0 ? String(c.totalClients) : "—" },
    { label: "New Clients", value: c.totalClients > 0 ? String(c.newClients) : "—" },
    { label: "Returning Clients", value: c.totalClients > 0 ? String(c.returningClients) : "—" },
    { label: "Average Spend", value: c.averageSpend != null ? money(c.averageSpend) : "£—" },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-[6%]">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between">
          <span className="text-white/70" style={{ fontSize: "0.7vw" }}>{r.label}</span>
          <span className="text-white" style={{ fontSize: "0.7vw" }}>{r.value}</span>
        </div>
      ))}
      {c.totalClients === 0 && (
        <p className="mt-[2%] text-center text-white/35" style={{ fontSize: "0.6vw" }}>No client data yet — start taking appointments to see your client activity.</p>
      )}
    </div>
  );
}

function BusiestTimesPanel({ data }: { data: AnalyticsData }) {
  const hasData = data.busiestTimes.some((b) => b.value > 0);
  return (
    <div className="h-full">
      {hasData ? (
        <BarChart buckets={data.busiestTimes} formatValue={(v) => `${v} appt${v === 1 ? "" : "s"}`} />
      ) : (
        <EmptyNote title="No data yet" body="Your busiest times will appear here." />
      )}
    </div>
  );
}

function QuickStatsPanel({ data }: { data: AnalyticsData }) {
  const q = data.quickStats;
  const rows = [
    { label: "Services Completed", value: String(q.servicesCompleted) },
    { label: "Total Clients", value: String(q.totalClients) },
    { label: "Average Service Time", value: q.averageServiceMinutes != null ? `${Math.round(q.averageServiceMinutes)}m` : "—" },
    { label: "Total Cash Collected", value: money(q.totalCashCollected) },
  ];
  const hasAny = q.servicesCompleted > 0 || q.totalClients > 0 || q.totalCashCollected > 0;
  return (
    <div className="flex h-full flex-col justify-center gap-[5%]">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between">
          <span className="text-white/70" style={{ fontSize: "0.68vw" }}>{r.label}</span>
          <span className="text-white" style={{ fontSize: "0.68vw" }}>{r.value}</span>
        </div>
      ))}
      {!hasAny && (
        <p className="mt-[2%] text-center text-white/35" style={{ fontSize: "0.6vw" }}>No data yet — your key stats will appear here as you use POLAR.</p>
      )}
    </div>
  );
}
