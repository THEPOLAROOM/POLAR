import Link from "next/link";
import Image from "next/image";

// Desktop Barber Dashboard scene: the approved artwork
// (barber-dashboard-v2.webp — the supplied file converted losslessly,
// pixel-identical, native 1942x809) with five real click targets laid
// over its five physical destinations. The artwork's own pills/objects
// ARE the navigation; no extra UI is drawn on top. Rendered by
// page.tsx only after its server-side requireRole("barber") check.
const BG_RATIO = 1942 / 809;

// Responsive fill — same strategy as /signup/barber and /signup/client.
// The stage covers the window and crops dynamically by viewport aspect
// ratio, but never into SAFE (fractions of the artwork): the Clients
// pill/tablet on the left to the My Services pill/workstation on the
// right, the top of the pills to POLAR's feet. This artwork is very wide
// (2.4:1), so on 16:9 / 16:10 screens the stage stops growing once SAFE
// fills the width; the remaining height is filled with the artwork's own
// sampled edge colours (EDGE_FILL), not navy.
const SAFE = { x0: 0.045, x1: 0.982, y0: 0.1, y1: 0.95 };
const STAGE_W = `min(max(100vw, calc(100dvh * ${BG_RATIO})), calc(100vw / ${SAFE.x1 - SAFE.x0}), calc(100dvh * ${BG_RATIO} / ${SAFE.y1 - SAFE.y0}))`;
const STAGE_H = `calc(var(--stage-w) / ${BG_RATIO})`;
const offset = (view: string, size: string, centre: number) =>
  `clamp(min(calc(${view} - ${size}), calc((${view} - ${size}) / 2)), calc(${view} / 2 - ${size} * ${centre}), max(0px, calc((${view} - ${size}) / 2)))`;
const STAGE_STYLE = {
  "--stage-w": STAGE_W,
  width: "var(--stage-w)",
  height: STAGE_H,
  left: offset("100vw", "var(--stage-w)", (SAFE.x0 + SAFE.x1) / 2),
  top: offset("100dvh", STAGE_H, (SAFE.y0 + SAFE.y1) / 2),
} as React.CSSProperties;
// Sampled from the artwork's own top / bottom edge rows.
const EDGE_FILL = "linear-gradient(180deg, #040308 0%, #040308 50%, #260f2d 100%)";

// Existing Barber Dashboard routes, mapped 1:1 onto the artwork's five
// destinations. `zone` is each destination's pill + physical object, in
// native artwork px (x, y, width, height of 1942x809).
export const DESTINATIONS = [
  { href: "/dashboard/barber/clients", label: "Clients", zone: [98, 326, 200, 222] },
  { href: "/dashboard/barber/calendar", label: "Calendar", zone: [396, 98, 282, 362] },
  { href: "/dashboard/barber/shift", label: "Workflow Mode", zone: [752, 178, 396, 532] },
  { href: "/dashboard/barber/account", label: "My Profile", zone: [1192, 90, 272, 674] },
  { href: "/dashboard/barber/services", label: "My Services", zone: [1540, 234, 362, 470] },
] as const;

const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;
const zoneStyle = ([x, y, w, h]: readonly number[]): React.CSSProperties => ({
  left: pct(x, 1942),
  top: pct(y, 809),
  width: pct(w, 1942),
  height: pct(h, 809),
});

const ZONE_CLASS =
  "absolute rounded-2xl bg-transparent transition duration-200 ease-out hover:bg-white/[0.05] hover:shadow-[0_0_0_2px_rgba(91,155,255,0.55),0_0_28px_6px_rgba(91,155,255,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light";

export function BarberDashboardScene() {
  return (
    <main className="relative hidden overflow-hidden sm:block" style={{ height: "100dvh", background: EDGE_FILL }}>
      <div className="absolute" style={STAGE_STYLE}>
        <Image
          src="/dashboard/barber-dashboard-v2.webp"
          alt="POLAR's barber shop: Clients tablet, Calendar board, Workflow Mode chair, POLAR for My Profile, and the My Services workstation."
          fill
          unoptimized
          priority
          className="object-contain"
        />
        <nav aria-label="Barber dashboard">
          {DESTINATIONS.map(({ href, label, zone }) => (
            <Link key={href} href={href} aria-label={label} title={label} className={ZONE_CLASS} style={zoneStyle(zone)} />
          ))}
        </nav>
      </div>
    </main>
  );
}
