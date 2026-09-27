import Link from "next/link";
import { Barlow, Permanent_Marker, Russo_One } from "next/font/google";
import type { AnalyticsData, Period } from "@/lib/queries/barber-analytics";

// Smart Analytics — built as real HTML/CSS from the approved
// SMART-ANALYTICS master (1672 × 941). Every measurement below is the
// master's native px × --u, the same system as the POLAR CV page. All
// values come from getBarberAnalytics(); nothing in the artwork's
// example numbers is used.

const ui = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const display = Russo_One({ subsets: ["latin"], weight: "400" });
const marker = Permanent_Marker({ subsets: ["latin"], weight: "400" });

/* ------------------------------------------------------------------ */
/* Period navigation (unchanged behaviour: URL-driven, server-rendered) */

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
/** "This Month" etc. when the selected period contains today (as in the master); otherwise the period itself. */
function periodTitle(period: Period, date: string, today: string): string {
  const same =
    period === "day"
      ? date === today
      : period === "week"
        ? startOfWeekMonday(date) === startOfWeekMonday(today)
        : period === "month"
          ? date.slice(0, 7) === today.slice(0, 7)
          : date.slice(0, 4) === today.slice(0, 4);
  if (!same) return periodLabel(period, date);
  return { day: "Today", week: "This Week", month: "This Month", year: "This Year" }[period];
}

/* ------------------------------------------------------------------ */
/* Formatting                                                           */

const gbp0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 2 });
const gbp2 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Totals: £3,240 — pence only when there are pence. */
const money = (n: number) => (Number.isInteger(Math.round(n * 100) / 100) ? gbp0.format(Math.round(n)) : gbp2.format(n));
const hours = (minutes: number) => {
  const h = Math.round((minutes / 60) * 10) / 10;
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
};

/** 4 even steps from 0 to a tidy ceiling (0/150/300/450/600 style). */
function scale(max: number): number[] {
  if (max <= 0) return [0, 1, 2, 3, 4];
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((f) => f * mag).find((s) => s >= raw) ?? 10 * mag;
  const s = step < 1 ? 1 : step;
  return [0, s, 2 * s, 3 * s, 4 * s];
}

/* ------------------------------------------------------------------ */

export function AnalyticsView({ period, date, today, data }: { period: Period; date: string; today: string; data: AnalyticsData }) {
  const step = (dir: 1 | -1) =>
    period === "day"
      ? `?period=day&date=${addDays(date, dir)}`
      : period === "week"
        ? `?period=week&date=${addDays(date, 7 * dir)}`
        : period === "year"
          ? `?period=year&date=${addYears(date, dir)}`
          : `?period=month&date=${addMonths(date, dir)}`;

  const a = data.appointments;
  const c = data.clientActivity;
  const q = data.quickStats;

  return (
    <div id="barber-analytics-page">
      {/* Route-scoped: hides only the shared barber <nav> on this page. */}
      <style>{`div:has(> #barber-analytics-page) > nav { display: none; }`}</style>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className={`sa-root ${ui.className}`}>
        <div className="sa-stage">
          {/* Splatter + outer frame lines, cut from the approved master. */}
          <img src="/dashboard/focus/analytics-splat-left.webp" alt="" className="sa-splat sa-splat-l" />
          <img src="/dashboard/focus/analytics-splat-right.webp" alt="" className="sa-splat sa-splat-r" />

          <header className="sa-head">
            <h1 className={`sa-title ${display.className}`}>
              <span className="sa-t1">SMART</span> <span className="sa-t2">ANALYTICS</span>{" "}
              <span className={`sa-t3 ${marker.className}`}>/ POLAR</span>
            </h1>
            <p className="sa-sub">INSIGHTS FOR A STRONGER BUSINESS</p>
            <Link href="/dashboard/barber/account" className="sa-x" aria-label="Close">
              <Icon name="x" />
            </Link>
          </header>

          <div className="sa-frame-glow">
            <div className="sa-frame">
              <main className="sa-inner">
                {/* Period control */}
                <div className="sa-period">
                  <nav className="sa-nav" aria-label="Period">
                    <Link href={step(-1)} className="sa-arrow" aria-label="Previous period">
                      <Icon name="left" />
                    </Link>
                    <Link href={`?period=${period}&date=${today}`} className="sa-current" title={`${periodLabel(period, date)} — jump to today`}>
                      {periodTitle(period, date, today)}
                    </Link>
                    <Link href={step(1)} className="sa-arrow" aria-label="Next period">
                      <Icon name="right" />
                    </Link>
                  </nav>
                  <div className="sa-tabs" role="tablist" aria-label="Period length">
                    {(["day", "week", "month", "year"] as Period[]).map((p) => (
                      <Link key={p} href={`?period=${p}&date=${date}`} role="tab" aria-selected={period === p} className={`sa-tab ${period === p ? "is-active" : ""}`}>
                        {p[0].toUpperCase() + p.slice(1)}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Row 1 — Cash Revenue + KPI stack */}
                <div className="sa-row sa-row1">
                  <section className="sa-card sa-cash">
                    <span className="sa-cash-icon">
                      <Icon name="coins" color="cyan" />
                    </span>
                    <div className="sa-cash-head">
                      <CardTitle title="CASH REVENUE" tip="Recorded prices of appointments in this period. Barter bookings, no-shows and walk-ins count as £0." />
                      <p className={`sa-cash-value ${display.className}`}>{money(data.cashRevenue.total)}</p>
                    </div>
                    <RevenueChart period={period} buckets={data.cashRevenue.buckets} />
                  </section>

                  <div className="sa-kpis">
                    <Kpi tone="pink" icon="clock" title="WORKING HOURS" tip="Your available hours in this period, minus breaks and blocked time." value={`${hours(data.workingHours.totalMinutes)}`} unit="hrs" />
                    <Kpi tone="cyan" icon="bars" title="£ / WORKING HOUR" tip="Cash Revenue divided by Working Hours." value={data.perWorkingHour != null ? gbp2.format(data.perWorkingHour) : "—"} />
                    <Kpi tone="pink" icon="trend" title="UTILISATION RATE" tip="Booked appointment time as a share of your Working Hours." value={data.utilisation != null ? `${data.utilisation}%` : "—"} />
                  </div>
                </div>

                {/* Row 2 — Appointments + Client Activity */}
                <div className="sa-row sa-row2">
                  <section className="sa-card sa-wide">
                    <CardHead icon="calendar" iconColor="cyan" title="APPOINTMENTS" tip="Completed: appointments whose time has passed (excluding no-shows). Upcoming: still to come. Cancelled: bookings cancelled in this period." />
                    <div className="sa-tiles sa-tiles-appt">
                      <Tile icon="check" dot="cyan" label="Completed" value={String(a.completed)} />
                      <Tile icon="clock" dot="violet" label="Upcoming" value={String(a.upcoming)} />
                      <Tile icon="cross" dot="pink" label="No Show" value={String(a.noShow)} />
                      <Tile icon="ban" dot="pink-ring" label="Cancelled" value={String(a.cancelled)} />
                    </div>
                  </section>
                  <section className="sa-card sa-wide">
                    <CardHead icon="users" iconColor="cyan" title="CLIENT ACTIVITY" tip="New: the client's first ever booking with you is in this period. Returning: booked with you before. Average Spend: Cash Revenue ÷ paying clients." />
                    <div className="sa-tiles sa-tiles-clients">
                      <Tile icon="user" glyph="cyan" label="Total Clients" value={String(c.totalClients)} />
                      <Tile icon="plus" dot="violet" label="New Clients" value={String(c.newClients)} />
                      <Tile icon="users2" glyph="blue" label="Returning Clients" value={String(c.returningClients)} />
                      <Tile icon="coins" glyph="pink" label="Average Spend" value={c.averageSpend != null ? gbp2.format(c.averageSpend) : "—"} wideIndent />
                    </div>
                  </section>
                </div>

                {/* Row 3 — Quick Stats, Top Services, Busiest Times */}
                <div className="sa-row sa-row3">
                  <section className="sa-card">
                    <CardHead icon="bolt" iconColor="pink" title="QUICK STATS" tip="Average Service Time uses booked appointment length. Total Cash Collected is the recorded booking price — payments aren't tracked." />
                    <div className="sa-quick">
                      <QuickTile icon="scissors" color="pink" label={["Services", "Completed"]} value={String(q.servicesCompleted)} />
                      <QuickTile icon="users" color="cyan" label={["Total Clients"]} value={String(q.totalClients)} />
                      <QuickTile icon="stopwatch" color="cyan" label={["Average", "Service Time"]} value={q.averageServiceMinutes != null ? String(Math.round(q.averageServiceMinutes)) : "—"} unit={q.averageServiceMinutes != null ? "mins" : undefined} />
                      <QuickTile icon="coins" color="pink" label={["Total Cash", "Collected"]} value={money(q.totalCashCollected)} />
                    </div>
                  </section>
                  <section className="sa-card">
                    <CardHead icon="scissors" iconColor="pink" title="TOP SERVICES" tip="Services booked in this period, most bookings first. Revenue uses the same rules as Cash Revenue." />
                    <TopServices services={data.topServices} />
                  </section>
                  <section className="sa-card">
                    <CardHead icon="clock" iconColor="cyan" ring title="BUSIEST TIMES" tip={BUSIEST_TIPS[period]} />
                    <BusiestChart period={period} date={date} buckets={data.busiestTimes} />
                  </section>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BUSIEST_TIPS: Record<Period, string> = {
  day: "Appointments starting in each hour of this day.",
  week: "Appointments on each day of this week.",
  month: "Appointments on each day of the week, across this month.",
  year: "Appointments in each month of this year.",
};

/* ------------------------------------------------------------------ */
/* Cards                                                                */

function CardTitle({ title, tip, align }: { title: string; tip: string; align?: "right" }) {
  return (
    <div className="sa-card-title">
      <h2 className={display.className}>{title}</h2>
      <span className="sa-info" tabIndex={0} role="note" aria-label={`${title}: ${tip}`} data-tip={tip} data-align={align}>
        <Icon name="info" />
      </span>
    </div>
  );
}

function CardHead({ icon, iconColor, title, tip, ring }: { icon: IconName; iconColor: Tone; title: string; tip: string; ring?: boolean }) {
  return (
    <div className="sa-card-head">
      <span className={`sa-head-icon ${ring ? "is-ring" : ""}`}>
        <Icon name={icon} color={iconColor} />
      </span>
      <CardTitle title={title} tip={tip} />
    </div>
  );
}

function Kpi({ tone, icon, title, tip, value, unit }: { tone: "pink" | "cyan"; icon: IconName; title: string; tip: string; value: string; unit?: string }) {
  return (
    <section className={`sa-kpi is-${tone}`}>
      <span className="sa-kpi-icon">
        <Icon name={icon} color={tone} />
      </span>
      <div className="sa-kpi-body">
        <CardTitle title={title} tip={tip} align="right" />
        <p className={`sa-kpi-value ${display.className}`}>
          {value}
          {unit && value !== "—" && <span className="sa-unit"> {unit}</span>}
        </p>
      </div>
    </section>
  );
}

type Dot = "cyan" | "violet" | "pink" | "pink-ring";
function Tile({ icon, dot, glyph, label, value, wideIndent }: { icon: IconName; dot?: Dot; glyph?: Tone; label: string; value: string; wideIndent?: boolean }) {
  return (
    <div className={`sa-tile ${wideIndent ? "is-indented" : ""}`}>
      <span className={dot ? `sa-dot is-${dot}` : "sa-glyph"}>
        <Icon name={icon} color={dot ? (dot === "pink-ring" ? "pink" : "navy") : glyph} />
      </span>
      <div>
        <p className="sa-tile-label">{label}</p>
        <p className={`sa-tile-value ${display.className}`}>{value}</p>
      </div>
    </div>
  );
}

function QuickTile({ icon, color, label, value, unit }: { icon: IconName; color: Tone; label: string[]; value: string; unit?: string }) {
  return (
    <div className="sa-qtile">
      <span className="sa-qicon">
        <Icon name={icon} color={color} />
      </span>
      <p className="sa-qlabel">
        {label.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </p>
      <p className={`sa-qvalue ${display.className}`}>
        {value}
        {unit && <span className="sa-qunit"> {unit}</span>}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Charts                                                               */

// Bars shade from POLAR blue (low) to POLAR pink (the period's peak),
// as in the master.
function barStyle(value: number, max: number): React.CSSProperties {
  const t = max > 0 ? value / max : 0;
  const mix = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
  const top = mix([34, 178, 255], [214, 60, 255]);
  const bottom = mix([88, 92, 255], [255, 22, 205]);
  return {
    height: `${max > 0 ? Math.max(value > 0 ? 2 : 0, (value / max) * 100) : 0}%`,
    background: `linear-gradient(180deg, ${top}, ${bottom})`,
    boxShadow: `0 0 calc(var(--u) * 10) ${mix([30, 160, 255], [255, 40, 210]).replace("rgb", "rgba").replace(")", ",.45)")}`,
  };
}

type Bucket = { label: string; value: number };

function PlotFrame({ ticks, format, empty, emptyText, children, xLabels, className }: { ticks: number[]; format: (n: number) => string; empty: boolean; emptyText: string; children: React.ReactNode; xLabels: React.ReactNode; className: string }) {
  return (
    <div className={`sa-plot ${className}`}>
      <div className="sa-yaxis" aria-hidden="true">
        {[...ticks].reverse().map((t, i) => (
          <span key={i}>{empty && t !== 0 ? "" : format(t)}</span>
        ))}
      </div>
      <div className="sa-plot-main">
        <div className="sa-grid" aria-hidden="true">
          {ticks.map((_, i) => (
            <span key={i} style={{ bottom: `${(i / 4) * 100}%` }} />
          ))}
        </div>
        <div className="sa-bars">{children}</div>
        {empty && <p className="sa-empty">{emptyText}</p>}
        <div className="sa-xaxis">{xLabels}</div>
      </div>
    </div>
  );
}

function RevenueChart({ period, buckets }: { period: Period; buckets: Bucket[] }) {
  const max = Math.max(0, ...buckets.map((b) => b.value));
  const ticks = scale(max);
  const top = ticks[4];
  const fmt = (n: number) => gbp0.format(n);
  const tip = (b: Bucket, prefix = "") => `${prefix}${b.label}: ${money(b.value)}`;

  // Month: the master groups the month into W1–W5. Each day keeps its
  // own bar (days 1–7 = W1, 8–14 = W2 …), grouped under its week.
  if (period === "month") {
    const groups: Bucket[][] = [];
    buckets.forEach((b, i) => (groups[Math.floor(i / 7)] ??= []).push(b));
    return (
      <PlotFrame
        className="sa-plot-cash is-grouped"
        ticks={ticks}
        format={fmt}
        empty={max === 0}
        emptyText="No revenue recorded for this period"
        xLabels={groups.map((_, i) => (
          <span key={i} style={{ flex: 1 }}>
            W{i + 1}
          </span>
        ))}
      >
        {groups.map((g, gi) => (
          <div key={gi} className="sa-group">
            {g.map((b) => (
              <div key={b.label} className="sa-slot" title={tip(b, "Day ")}>
                <div className="sa-bar" style={barStyle(b.value, top)} />
              </div>
            ))}
            {g.length < 7 && Array.from({ length: 7 - g.length }, (_, k) => <div key={`pad${k}`} className="sa-slot" aria-hidden="true" />)}
          </div>
        ))}
      </PlotFrame>
    );
  }

  return (
    <PlotFrame
      className="sa-plot-cash"
      ticks={ticks}
      format={fmt}
      empty={max === 0}
      emptyText="No revenue recorded for this period"
      xLabels={buckets.map((b) => (
        <span key={b.label} style={{ flex: 1 }}>
          {b.label}
        </span>
      ))}
    >
      {buckets.map((b) => (
        <div key={b.label} className="sa-slot" title={tip(b)}>
          <div className="sa-bar" style={barStyle(b.value, top)} />
        </div>
      ))}
    </PlotFrame>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function BusiestChart({ period, date, buckets }: { period: Period; date: string; buckets: Bucket[] }) {
  // Month arrives as one bucket per date; the master shows Mon–Sun, so
  // each date's count is added to its weekday (same appointments, same
  // counts — only grouped by weekday).
  let bars = buckets;
  if (period === "month") {
    const totals = [0, 0, 0, 0, 0, 0, 0];
    const ym = date.slice(0, 7);
    buckets.forEach((b) => {
      const dow = (new Date(`${ym}-${b.label.padStart(2, "0")}T00:00:00Z`).getUTCDay() + 6) % 7;
      totals[dow] += b.value;
    });
    bars = WEEKDAYS.map((label, i) => ({ label, value: totals[i] }));
  }
  const max = Math.max(0, ...bars.map((b) => b.value));
  const ticks = scale(max);
  const top = ticks[4];
  const sparse = bars.length > 8;
  return (
    <PlotFrame
      className="sa-plot-busy"
      ticks={ticks}
      format={(n) => String(n)}
      empty={max === 0}
      emptyText="No appointments in this period"
      xLabels={bars.map((b, i) => (
        <span key={b.label} style={{ flex: 1 }}>
          {sparse && i % 2 === 1 ? "" : b.label}
        </span>
      ))}
    >
      {bars.map((b) => (
        <div key={b.label} className="sa-slot" title={`${b.label}: ${b.value} appointment${b.value === 1 ? "" : "s"}`}>
          <div className="sa-bar" style={barStyle(b.value, top)} />
        </div>
      ))}
    </PlotFrame>
  );
}

// Master order: most bookings first; five rows, the fifth rolling up
// everything else as "Other" when more than five services were booked.
const RANK_COLOURS = [
  "linear-gradient(90deg, #11e4ff, #1f8dff)",
  "linear-gradient(90deg, #11d0ff, #1f8dff)",
  "linear-gradient(90deg, #9d6bff, #b35cff)",
  "linear-gradient(90deg, #c04dff, #e040f5)",
  "linear-gradient(90deg, #ff2bd1, #ff1a9c)",
];

function TopServices({ services }: { services: AnalyticsData["topServices"] }) {
  const sorted = [...services].sort((a, b) => b.count - a.count || b.revenue - a.revenue);
  const rows =
    sorted.length > 5
      ? [
          ...sorted.slice(0, 4),
          sorted.slice(4).reduce((acc, s) => ({ ...acc, count: acc.count + s.count, revenue: acc.revenue + s.revenue }), { serviceId: "other", name: "Other", count: 0, revenue: 0 }),
        ]
      : sorted;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <table className="sa-table">
      <thead>
        <tr>
          <th className="sa-col-rank">#</th>
          <th>Service Name</th>
          <th className="sa-col-num">Bookings</th>
          <th className="sa-col-rev">Revenue</th>
          <th className="sa-col-bar">
            <span className="sr-only">Share of bookings</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr className="sa-table-empty">
            <td colSpan={5}>No services booked in this period</td>
          </tr>
        ) : (
          rows.map((r, i) => (
            <tr key={r.serviceId}>
              <td className="sa-col-rank">{i === 0 ? "1" : `${i + 1}.`}</td>
              <td className="sa-col-name">{r.name}</td>
              <td className="sa-col-num">{r.count}</td>
              <td className="sa-col-rev">{money(r.revenue)}</td>
              <td className="sa-col-bar">
                <span className="sa-track">
                  <span style={{ width: `${Math.max(6, (r.count / max) * 100)}%`, background: RANK_COLOURS[i], boxShadow: `0 0 calc(var(--u) * 8) ${i < 2 ? "rgba(17,200,255,.45)" : i < 4 ? "rgba(192,77,255,.45)" : "rgba(255,43,209,.5)"}` }} />
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------ */
/* Icons                                                                */

type Tone = "cyan" | "pink" | "violet" | "blue" | "navy";
const TONE: Record<Tone, string> = { cyan: "#19d2ff", pink: "#ff2bd1", violet: "#8b5cff", blue: "#2f8dff", navy: "#06122a" };

type IconName =
  | "x" | "calendar" | "left" | "right" | "coins" | "clock" | "bars" | "trend" | "info" | "check" | "cross" | "ban" | "users" | "users2"
  | "user" | "plus" | "bolt" | "scissors" | "stopwatch";

const ICONS: Record<IconName, { fill?: boolean; body: React.ReactNode }> = {
  x: { body: <path d="M5 5l14 14M19 5L5 19" /> },
  left: { body: <path d="M15 5l-7 7 7 7" /> },
  right: { body: <path d="M9 5l7 7-7 7" /> },
  calendar: { body: (<><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="M7.5 13.5h1.5M11.25 13.5h1.5M15 13.5h1.5M7.5 17h1.5M11.25 17h1.5M15 17h1.5" /></>) },
  coins: { body: (<><ellipse cx="12" cy="5.5" rx="8" ry="3" /><path d="M4 5.5v3.5c0 1.7 3.6 3 8 3s8-1.3 8-3V5.5" /><path d="M4 9v3.5c0 1.7 3.6 3 8 3s8-1.3 8-3V9" /><path d="M4 12.5V16c0 1.7 3.6 3 8 3s8-1.3 8-3v-3.5" /></>) },
  clock: { body: (<><circle cx="12" cy="12" r="9.5" /><path d="M12 6.5V12l3.5 2.5" /></>) },
  bars: { fill: true, body: (<><rect x="2.5" y="12" width="3.6" height="9" rx=".6" /><rect x="7.6" y="7" width="3.6" height="14" rx=".6" /><rect x="12.8" y="2.5" width="3.6" height="18.5" rx=".6" /><rect x="17.9" y="9" width="3.6" height="12" rx=".6" /><rect x="1.5" y="21" width="21" height="1.4" rx=".5" /></>) },
  trend: { body: (<><path d="M2.5 19l6-6.5 4 3.5 8-9" /><path d="M14.5 6.5h6v6" /></>) },
  info: { body: (<><circle cx="12" cy="12" r="9.5" /><path d="M12 10.5v6.5" /><circle cx="12" cy="7.3" r=".6" fill="currentColor" /></>) },
  check: { body: <path d="M6.5 12.5l3.8 3.8 7.4-8" /> },
  cross: { body: <path d="M8 8l8 8M16 8l-8 8" /> },
  ban: { body: (<><circle cx="12" cy="12" r="7" /><path d="M7 17l10-10" /></>) },
  users: { fill: true, body: (<><circle cx="12" cy="7.5" r="3.4" /><circle cx="5" cy="9" r="2.6" /><circle cx="19" cy="9" r="2.6" /><path d="M5.5 20c0-4 2.9-6.6 6.5-6.6s6.5 2.6 6.5 6.6z" /><path d="M.8 18.6c0-3 1.8-5 4.3-5 1 0 1.8.3 2.4.7-1.3 1.2-2.2 2.9-2.4 4.3zM23.2 18.6c0-3-1.8-5-4.3-5-1 0-1.8.3-2.4.7 1.3 1.2 2.2 2.9 2.4 4.3z" /></>) },
  users2: { fill: true, body: (<><circle cx="9" cy="7" r="3.6" /><path d="M2 20.5c0-4.3 3.1-7 7-7s7 2.7 7 7z" /><circle cx="17" cy="9" r="2.8" opacity=".85" /><path d="M16.2 13.6c3.4.1 5.8 2.5 5.8 6.1h-4.4c-.2-2.4-.8-4.3-1.4-6.1z" opacity=".85" /></>) },
  user: { fill: true, body: (<><circle cx="12" cy="7" r="4.2" /><path d="M3.5 21.5c0-5 3.8-8 8.5-8s8.5 3 8.5 8z" /></>) },
  plus: { body: <path d="M12 7v10M7 12h10" /> },
  bolt: { fill: true, body: <path d="M13.5 1.5L4.5 13.5h6.2L8.5 22.5l10-13h-6.4z" /> },
  scissors: { body: (<><circle cx="6" cy="18" r="3.2" /><circle cx="18" cy="18" r="3.2" /><path d="M8.2 15.7L19.5 2.5M15.8 15.7L4.5 2.5" /></>) },
  stopwatch: { body: (<><circle cx="12" cy="13.5" r="8.2" /><path d="M12 9v4.8l3 2M9.5 2.5h5M12 2.5v2.8M19 6.5l1.6-1.6" /></>) },
};

function Icon({ name, color }: { name: IconName; color?: Tone }) {
  const def = ICONS[name];
  const c = color ? TONE[color] : "currentColor";
  return (
    <svg
      viewBox="0 0 24 24"
      className={`sa-icon sa-icon-${name}`}
      fill={def.fill ? c : "none"}
      stroke={def.fill ? "none" : c}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {def.body}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Measurements are the master's native px (1672 × 941) × --u.         */

const CSS = `
.sa-root {
  --u: max(min(calc(100vw / 1672), calc(100vh / 941)), 0.62px);
  --cy: #19d2ff; --pk: #ff2bd1; --line: #14324f;
  min-height: 100vh; min-height: 100dvh; color: #fff; overflow-x: hidden;
  background: radial-gradient(ellipse 70% 60% at 50% 0%, #031428 0%, rgba(3,20,40,0) 70%), linear-gradient(90deg, #000814 0%, #010814 50%, #00081c 100%);
}
.sa-root *, .sa-root *::before, .sa-root *::after { box-sizing: border-box; }
.sa-root p, .sa-root h1, .sa-root h2 { margin: 0; }
.sa-root .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.sa-stage { position: relative; width: 100%; min-height: calc(var(--u) * 941); margin: 0 auto; padding: 0 calc(var(--u) * 43) calc(var(--u) * 12) calc(var(--u) * 42); }
.sa-splat { position: absolute; top: 0; height: calc(var(--u) * 941); pointer-events: none; user-select: none; }
.sa-splat-l { left: 0; width: calc(var(--u) * 490); }
.sa-splat-r { right: 0; width: calc(var(--u) * 476); }

/* Header — same system as POLAR CV */
.sa-head { position: relative; height: calc(var(--u) * 123); text-align: center; }
.sa-title { padding-top: calc(var(--u) * 19); font-size: calc(var(--u) * 47); line-height: 1; letter-spacing: calc(var(--u) * 0.5); white-space: nowrap; font-weight: 400; }
.sa-t1 { color: #fdfcfb; }
.sa-t2 { color: #e9f0ff; }
.sa-t3 { display: inline-block; margin-left: calc(var(--u) * 4); font-size: calc(var(--u) * 53); line-height: .8; color: var(--pk); transform: skewX(-10deg) translateY(calc(var(--u) * 2)); text-shadow: 0 0 calc(var(--u) * 16) rgba(255,43,209,.55); }
.sa-sub { margin-top: calc(var(--u) * 12) !important; padding-left: calc(var(--u) * 13); font-size: calc(var(--u) * 16); font-weight: 500; letter-spacing: calc(var(--u) * 13.2); color: #e6e7ee; line-height: 1; }
.sa-x { position: absolute; top: calc(var(--u) * 18); right: calc(var(--u) * -27); display: grid; place-items: center; width: calc(var(--u) * 56); height: calc(var(--u) * 56); border: calc(var(--u) * 2) solid #bfeaff; border-radius: calc(var(--u) * 7); color: #fff; background: rgba(1,9,22,.7); box-shadow: 0 0 calc(var(--u) * 12) rgba(25,210,255,.55), inset 0 0 calc(var(--u) * 8) rgba(25,210,255,.25); transition: filter .15s; }
.sa-x:hover { filter: brightness(1.25); }
.sa-x .sa-icon { width: calc(var(--u) * 30); height: calc(var(--u) * 30); stroke-width: 3.2; }

/* Outer chamfered frame (cyan left → pink right). */
.sa-frame-glow { filter: drop-shadow(calc(var(--u) * -3) 0 calc(var(--u) * 8) rgba(0,220,255,.45)) drop-shadow(calc(var(--u) * 3) 0 calc(var(--u) * 8) rgba(245,10,232,.45)); }
.sa-frame {
  --c: calc(var(--u) * 20);
  padding: calc(var(--u) * 2.5);
  clip-path: polygon(var(--c) 0, calc(100% - var(--c)) 0, 100% var(--c), 100% calc(100% - var(--c)), calc(100% - var(--c)) 100%, var(--c) 100%, 0 calc(100% - var(--c)), 0 var(--c));
  background: linear-gradient(90deg, #00e8ff 0%, #01b4d8 22%, #046a9a 50%, #6a2fc0 80%, #f50ae8 100%);
}
.sa-inner {
  --c: calc(var(--u) * 19);
  display: flex; flex-direction: column; gap: calc(var(--u) * 13);
  padding: calc(var(--u) * 9) calc(var(--u) * 15.5) calc(var(--u) * 9.5) calc(var(--u) * 16.5);
  clip-path: polygon(var(--c) 0, calc(100% - var(--c)) 0, 100% var(--c), 100% calc(100% - var(--c)), calc(100% - var(--c)) 100%, var(--c) 100%, 0 calc(100% - var(--c)), 0 var(--c));
  background: linear-gradient(180deg, #030d1c 0%, #010814 100%);
}

/* Period control */
.sa-period { display: flex; align-items: center; height: calc(var(--u) * 56); margin-bottom: calc(var(--u) * 12); padding-bottom: 0; position: relative; }
.sa-period::after { content: ""; position: absolute; left: calc(var(--u) * -16); right: calc(var(--u) * -15); bottom: calc(var(--u) * -10); height: 1px; background: linear-gradient(90deg, rgba(0,220,255,.45), rgba(20,60,110,.5) 50%, rgba(245,10,232,.35)); }
.sa-nav { display: flex; align-items: center; width: calc(var(--u) * 337); height: calc(var(--u) * 47); border: 1px solid #1d4a6d; border-radius: calc(var(--u) * 7); background: rgba(4,16,34,.8); }
.sa-arrow { display: grid; place-items: center; width: calc(var(--u) * 56); height: 100%; color: #9fdcff; transition: color .15s, background .15s; border-radius: calc(var(--u) * 7); }
.sa-arrow:hover { color: #fff; background: rgba(25,210,255,.08); }
.sa-arrow .sa-icon { width: calc(var(--u) * 24); height: calc(var(--u) * 24); stroke-width: 2.8; }
.sa-current { flex: 1; min-width: 0; text-align: center; font-size: calc(var(--u) * 18); font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sa-current:hover { color: #bfeaff; }
.sa-tabs { display: flex; gap: calc(var(--u) * 3); margin-left: auto; margin-right: calc(var(--u) * 45); }
.sa-tab { display: grid; place-items: center; width: calc(var(--u) * 132); height: calc(var(--u) * 47); border: 1px solid #1d4a6d; border-radius: calc(var(--u) * 6); background: rgba(4,16,34,.8); font-size: calc(var(--u) * 18); font-weight: 500; color: #fff; transition: background .15s, border-color .15s; }
.sa-tab:hover { border-color: #2f7fb0; background: rgba(25,210,255,.07); }
.sa-tab.is-active { border-color: #5fd2ff; background: linear-gradient(180deg, #1fc2ff 0%, #1592f5 55%, #1172e0 100%); box-shadow: 0 0 calc(var(--u) * 14) rgba(31,178,255,.65); }

/* Cards */
.sa-row { display: grid; gap: calc(var(--u) * 14); }
.sa-row1 { grid-template-columns: 1187fr 344fr; gap: calc(var(--u) * 17); height: calc(var(--u) * 293); }
.sa-row2 { grid-template-columns: 615fr 922fr; gap: calc(var(--u) * 13); height: calc(var(--u) * 156); }
.sa-row3 { grid-template-columns: 490fr 596fr 436fr; height: calc(var(--u) * 224); }
.sa-card {
  position: relative; min-width: 0; border-radius: calc(var(--u) * 12); border: calc(var(--u) * 2) solid transparent;
  background: linear-gradient(180deg, rgba(4,15,32,.97), rgba(2,10,22,.98)) padding-box,
    linear-gradient(90deg, #00e0ff 0%, #0aa6d6 30%, #0f5f98 62%, #7a2fc8 86%, #f20ae4 100%) border-box;
  box-shadow: calc(var(--u) * -3) 0 calc(var(--u) * 12) calc(var(--u) * -3) rgba(0,220,255,.55), calc(var(--u) * 3) 0 calc(var(--u) * 12) calc(var(--u) * -3) rgba(245,10,232,.55);
}
.sa-card-title { display: flex; align-items: center; gap: calc(var(--u) * 13); }
.sa-card-title h2 { font-size: calc(var(--u) * 17.2); line-height: 1; font-weight: 400; letter-spacing: calc(var(--u) * 0.4); white-space: nowrap; }
.sa-info { position: relative; display: inline-grid; place-items: center; color: var(--cy); cursor: help; border-radius: 50%; outline: none; }
.sa-info .sa-icon { width: calc(var(--u) * 21); height: calc(var(--u) * 21); stroke-width: 1.8; }
.sa-info::after { content: attr(data-tip); position: absolute; top: calc(100% + var(--u) * 10); left: calc(var(--u) * -20); z-index: 20; width: calc(var(--u) * 300); padding: calc(var(--u) * 10) calc(var(--u) * 13); border-radius: calc(var(--u) * 8); border: 1px solid #1d4a6d; background: #061428; color: #dfe8f5; font-size: calc(var(--u) * 14); font-weight: 500; line-height: 1.4; text-align: left; letter-spacing: 0; white-space: normal; box-shadow: 0 calc(var(--u) * 8) calc(var(--u) * 24) rgba(0,0,0,.6); opacity: 0; visibility: hidden; transition: opacity .12s; pointer-events: none; }
.sa-info[data-align="right"]::after { left: auto; right: calc(var(--u) * -12); }
.sa-info:hover::after, .sa-info:focus-visible::after { opacity: 1; visibility: visible; }
.sa-info:focus-visible { box-shadow: 0 0 0 2px #fff; }
.sa-card-head { display: flex; align-items: center; gap: calc(var(--u) * 22); height: calc(var(--u) * 64); padding-left: calc(var(--u) * 17); }
.sa-head-icon { display: grid; place-items: center; width: calc(var(--u) * 40); flex: none; }
.sa-head-icon .sa-icon { width: calc(var(--u) * 40); height: calc(var(--u) * 40); }
.sa-head-icon.is-ring .sa-icon { width: calc(var(--u) * 42); height: calc(var(--u) * 42); stroke-width: 2.4; }

/* Cash Revenue */
.sa-cash { display: grid; grid-template-rows: calc(var(--u) * 97) 1fr; padding: calc(var(--u) * 15) calc(var(--u) * 43) calc(var(--u) * 11) calc(var(--u) * 30); }
.sa-cash-icon { position: absolute; left: calc(var(--u) * 30); top: calc(var(--u) * 15); }
.sa-cash-icon .sa-icon { width: calc(var(--u) * 50); height: calc(var(--u) * 50); stroke-width: 2.4; filter: drop-shadow(0 0 calc(var(--u) * 6) rgba(25,210,255,.5)); }
.sa-cash-head { padding-left: calc(var(--u) * 82); padding-top: calc(var(--u) * 5); }
.sa-cash-head h2 { font-size: calc(var(--u) * 20); }
.sa-cash-value { margin-top: calc(var(--u) * 13) !important; font-size: calc(var(--u) * 40.5); line-height: 1; letter-spacing: calc(var(--u) * 0.5); }

.sa-plot { display: flex; min-height: 0; }
.sa-yaxis { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; flex: none; font-size: calc(var(--u) * 16); font-weight: 600; color: #fff; line-height: 1; }
.sa-plot-main { position: relative; flex: 1; min-width: 0; }
.sa-grid span { position: absolute; left: 0; right: 0; height: 1px; background: rgba(40,90,140,.35); }
.sa-grid span:first-child { background: rgba(80,110,200,.7); }
.sa-bars { position: absolute; inset: 0; display: flex; align-items: flex-end; }
.sa-slot { position: relative; flex: 1; height: 100%; display: flex; align-items: flex-end; justify-content: center; }
.sa-bar { width: 72%; max-width: calc(var(--u) * 42); border-radius: calc(var(--u) * 4) calc(var(--u) * 4) 0 0; }
.sa-xaxis { position: absolute; left: 0; right: 0; display: flex; text-align: center; font-size: calc(var(--u) * 16); font-weight: 600; color: #fff; white-space: nowrap; }
.sa-empty { position: absolute; left: 0; right: 0; top: 42%; text-align: center; font-size: calc(var(--u) * 17); font-weight: 500; color: rgba(210,225,245,.55); }

.sa-plot-cash { padding-bottom: calc(var(--u) * 28); }
.sa-plot-cash .sa-yaxis { width: calc(var(--u) * 40); margin: calc(var(--u) * -8) calc(var(--u) * 17) calc(var(--u) * -8) 0; }
.sa-plot-cash .sa-xaxis { top: calc(100% + var(--u) * 10); }
.sa-plot-cash .sa-bar { width: 62%; }
.sa-plot-cash.is-grouped .sa-group { position: relative; flex: 1; height: 100%; display: flex; align-items: flex-end; padding: 0 calc(var(--u) * 14); }
.sa-plot-cash.is-grouped .sa-group + .sa-group::before { content: ""; position: absolute; left: 0; top: calc(var(--u) * -8); bottom: 0; width: 1px; background: rgba(40,90,140,.4); }
.sa-plot-cash.is-grouped .sa-bar { width: 70%; }

/* KPI stack */
.sa-kpis { display: flex; flex-direction: column; gap: calc(var(--u) * 12); padding-top: calc(var(--u) * 2); }
.sa-kpi { position: relative; display: flex; align-items: center; height: calc(var(--u) * 84); padding-left: calc(var(--u) * 20); border-radius: calc(var(--u) * 10); border: calc(var(--u) * 2) solid transparent; }
.sa-kpi.is-pink { background: linear-gradient(180deg, rgba(20,8,40,.95), rgba(8,6,26,.97)) padding-box, linear-gradient(90deg, #d316e8, #7a3cf0 50%, #ec10dc) border-box; box-shadow: 0 0 calc(var(--u) * 12) rgba(220,20,230,.4); }
.sa-kpi.is-cyan { background: linear-gradient(180deg, rgba(4,20,40,.95), rgba(2,12,28,.97)) padding-box, linear-gradient(90deg, #09c8ff, #1a8ee0 50%, #09c8ff) border-box; box-shadow: 0 0 calc(var(--u) * 12) rgba(9,200,255,.4); }
.sa-kpi-icon { display: grid; place-items: center; width: calc(var(--u) * 50); flex: none; }
.sa-kpi-icon .sa-icon { width: calc(var(--u) * 50); height: calc(var(--u) * 50); stroke-width: 2.4; filter: drop-shadow(0 0 calc(var(--u) * 5) currentColor); }
.sa-kpi.is-pink .sa-kpi-icon { color: var(--pk); }
.sa-kpi.is-cyan .sa-kpi-icon { color: var(--cy); }
.sa-kpi-body { margin-left: calc(var(--u) * 33); }
.sa-kpi-body h2 { font-size: calc(var(--u) * 15); }
.sa-kpi-value { margin-top: calc(var(--u) * 10) !important; font-size: calc(var(--u) * 28.5); line-height: 1; }
.sa-unit { font-size: calc(var(--u) * 24); }

/* Appointment / client tiles */
.sa-wide { display: flex; flex-direction: column; }
.sa-wide .sa-card-head { height: calc(var(--u) * 64); padding-left: calc(var(--u) * 17); gap: calc(var(--u) * 22); }
.sa-wide .sa-card-head h2 { font-size: calc(var(--u) * 17.2); }
.sa-tiles { display: grid; gap: calc(var(--u) * 3); margin: 0 calc(var(--u) * 14); height: calc(var(--u) * 82); }
.sa-tiles-appt { grid-template-columns: 1fr 1fr 1fr 1fr; }
.sa-tiles-clients { grid-template-columns: 179fr 173fr 237fr 295fr; }
.sa-tile { display: flex; align-items: flex-start; gap: calc(var(--u) * 11); padding: calc(var(--u) * 14) 0 0 calc(var(--u) * 17); border: 1px solid rgba(24,62,98,.8); border-radius: calc(var(--u) * 7); background: rgba(3,12,26,.85); min-width: 0; }
.sa-tile.is-indented { padding-left: calc(var(--u) * 48); }
.sa-dot { display: grid; place-items: center; width: calc(var(--u) * 34); height: calc(var(--u) * 34); margin-top: calc(var(--u) * 3); flex: none; border-radius: 50%; }
.sa-dot .sa-icon { width: calc(var(--u) * 22); height: calc(var(--u) * 22); stroke-width: 3; }
.sa-dot.is-cyan { background: #1fd8ff; box-shadow: 0 0 calc(var(--u) * 10) rgba(31,216,255,.55); }
.sa-dot.is-violet { background: #7a45ff; box-shadow: 0 0 calc(var(--u) * 10) rgba(122,69,255,.55); }
.sa-dot.is-pink { background: #ff1fc8; box-shadow: 0 0 calc(var(--u) * 10) rgba(255,31,200,.55); }
.sa-dot.is-pink-ring { border: calc(var(--u) * 3) solid var(--pk); box-shadow: 0 0 calc(var(--u) * 10) rgba(255,31,200,.45); }
.sa-dot.is-pink-ring .sa-icon { width: calc(var(--u) * 26); height: calc(var(--u) * 26); }
.sa-dot.is-violet .sa-icon-clock { stroke: #06122a; }
.sa-glyph { display: grid; place-items: center; width: calc(var(--u) * 38); flex: none; }
.sa-glyph .sa-icon { width: calc(var(--u) * 38); height: calc(var(--u) * 38); stroke-width: 2.4; }
.sa-tile-label { font-size: calc(var(--u) * 15.5); font-weight: 500; color: #fff; line-height: 1.1; white-space: nowrap; }
.sa-tile-value { margin-top: calc(var(--u) * 8) !important; font-size: calc(var(--u) * 29); line-height: 1; }

/* Quick stats */
.sa-quick { display: grid; grid-template-columns: repeat(4, 1fr); gap: calc(var(--u) * 7); margin: calc(var(--u) * -8) calc(var(--u) * 9) 0; height: calc(var(--u) * 153); }
.sa-qtile { display: flex; flex-direction: column; align-items: center; padding-top: calc(var(--u) * 14); border: 1px solid rgba(24,62,98,.8); border-radius: calc(var(--u) * 8); background: rgba(3,12,26,.85); text-align: center; min-width: 0; }
.sa-qicon .sa-icon { width: calc(var(--u) * 40); height: calc(var(--u) * 40); stroke-width: 2.3; filter: drop-shadow(0 0 calc(var(--u) * 5) currentColor); }
.sa-qlabel { display: flex; flex-direction: column; justify-content: center; height: calc(var(--u) * 44); margin-top: calc(var(--u) * 6) !important; font-size: calc(var(--u) * 15.5); font-weight: 500; line-height: 1.18; color: #fff; }
.sa-qvalue { margin-top: calc(var(--u) * 11) !important; font-size: calc(var(--u) * 30); line-height: 1; white-space: nowrap; }
.sa-qunit { font-size: calc(var(--u) * 20); }

/* Top services */
.sa-table { width: calc(100% - var(--u) * 30); margin: calc(var(--u) * -6) calc(var(--u) * 14) 0 calc(var(--u) * 12); border-collapse: collapse; font-size: calc(var(--u) * 15.5); font-weight: 500; }
.sa-table th { height: calc(var(--u) * 26); font-weight: 500; color: #2ee6ff; text-align: left; background: rgba(12,30,52,.55); border-bottom: 1px solid rgba(40,90,140,.55); }
.sa-table td { height: calc(var(--u) * 27); border-bottom: 1px solid rgba(24,62,98,.55); color: #fff; white-space: nowrap; }
.sa-table tr:last-child td { border-bottom: 0; }
.sa-col-rank { width: calc(var(--u) * 35); padding-left: calc(var(--u) * 14); }
.sa-col-name { max-width: 0; overflow: hidden; text-overflow: ellipsis; }
.sa-col-num { width: calc(var(--u) * 86); }
.sa-table td.sa-col-num { padding-left: calc(var(--u) * 12); }
.sa-col-rev { width: calc(var(--u) * 76); }
.sa-col-bar { width: calc(var(--u) * 212); padding-right: calc(var(--u) * 10); }
.sa-track { display: block; height: calc(var(--u) * 13); border-radius: 999px; background: rgba(20,40,68,.55); }
.sa-track span { display: block; height: 100%; border-radius: 999px; }
.sa-table-empty td { height: calc(var(--u) * 108); text-align: center; color: rgba(210,225,245,.55); font-size: calc(var(--u) * 17); border: 0; }

/* Busiest times */
.sa-plot-busy { height: calc(var(--u) * 132); margin: calc(var(--u) * 6) calc(var(--u) * 20) 0 calc(var(--u) * 13); padding-bottom: calc(var(--u) * 0); }
.sa-plot-busy .sa-yaxis { width: calc(var(--u) * 20); margin: calc(var(--u) * -7) calc(var(--u) * 15) calc(var(--u) * -7) 0; font-size: calc(var(--u) * 15.5); font-weight: 500; }
.sa-plot-busy .sa-plot-main { height: calc(var(--u) * 110); }
.sa-plot-busy .sa-xaxis { top: calc(100% + var(--u) * 9); font-size: calc(var(--u) * 15.5); font-weight: 500; }
.sa-plot-busy .sa-bar { width: 82%; }
.sa-plot-busy .sa-grid span:not(:first-child) { background: rgba(40,90,140,.3); }

.sa-root a:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .sa-root * { transition: none !important; } }

/* Narrow screens: same components, stacked (desktop is the target). */
@media (max-width: 900px) {
  .sa-root { --u: 0.62px; }
  .sa-stage { padding: 0 12px 20px; }
  .sa-splat { display: none; }
  .sa-title { white-space: normal; padding: 18px 56px 0; font-size: 30px; }
  .sa-t3 { font-size: 34px; }
  .sa-sub { font-size: 10px; letter-spacing: 4px; }
  .sa-x { right: 0; }
  .sa-head { height: auto; padding-bottom: 16px; }
  .sa-period { flex-wrap: wrap; height: auto; gap: 8px; }
  .sa-tabs { margin: 0; width: 100%; }
  .sa-tab { flex: 1; width: auto; height: 38px; font-size: 14px; }
  .sa-nav { flex: 1; height: 38px; }
  .sa-current { font-size: 14px; }
  .sa-row1, .sa-row2, .sa-row3 { grid-template-columns: 1fr; height: auto; }
  .sa-cash { height: 260px; }
  .sa-tiles { height: auto; grid-template-columns: 1fr 1fr; margin-bottom: 12px; }
  .sa-tile { padding-bottom: 12px; }
  .sa-quick { height: auto; grid-template-columns: 1fr 1fr; margin-bottom: 12px; }
  .sa-qtile { padding-bottom: 12px; }
  .sa-table { margin-bottom: 12px; }
  .sa-plot-busy { margin-bottom: 30px; }
  .sa-card-title h2 { font-size: 15px; }
  .sa-tile-label, .sa-qlabel, .sa-table { font-size: 13px; }
}
`;
