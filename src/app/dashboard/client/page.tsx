import Link from "next/link";
import Image from "next/image";
import { requireRole } from "@/lib/auth/require-role";

// UI fallback only — shown when profiles.polar_id is genuinely null
// (not yet assigned; assignment happens on email verification for
// client accounts, per the polar_client_id_seq migration).
const POLAR_ID_PLACEHOLDER = "P-000000";

// Desktop: the final mastered Client Dashboard artwork (1670 × 942),
// shown whole. Hotspots are % boxes measured on that canvas.
const DESKTOP_ASSET = "/dashboard/polar-client-dashboard-final.webp";
const DESKTOP_TARGETS = [
  { href: "/dashboard/client/bookings", label: "Appointments", box: { left: "17.37%", top: "15.92%", width: "16.29%", height: "37.69%" } },
  { href: "/dashboard/client/your-barber", label: "Your barber", box: { left: "41.20%", top: "19.64%", width: "15.57%", height: "6.37%" } },
  { href: "/dashboard/client/profile", label: "Your POLAR card", box: { left: "60.06%", top: "26.75%", width: "18.92%", height: "30.79%" } },
  { href: "/dashboard/client/services", label: "Services", box: { left: "85.39%", top: "32.17%", width: "13.83%", height: "6.48%" } },
  // Tablet → future Settings. The page doesn't exist yet, so it stays here.
  { href: "/dashboard/client", label: "Settings (coming soon)", box: { left: "0.84%", top: "48.83%", width: "10.66%", height: "14.01%" } },
] as const;

// Live profiles.polar_id over the card's baked placeholder ID.
const DESKTOP_POLAR_ID_BOX = { left: "70.90%", top: "52.97%", width: "6.95%", height: "2.87%" };

const HOTSPOT_CLASS =
  "absolute rounded-xl transition duration-200 ease-out hover:bg-white/[0.06] hover:shadow-[0_0_0_2px_rgba(91,155,255,0.55),0_0_28px_6px_rgba(91,155,255,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light";

// Mobile ("app") two-asset pair — same technique as desktop, but
// these mastered assets are meant to fill the frame directly (no
// 76%-style inset/shrink). Percentages measured directly against
// the assets' native 941x1672 canvas via the same pixel-level
// brightness-peak scan used for the desktop overlay.
const MOBILE_CLICK_TARGETS = [
  { href: "/dashboard/client/book", label: "Book appointment", box: { left: "3.19%", top: "51.20%", width: "46.76%", height: "11.60%" } },
  { href: "/dashboard/client/bookings", label: "My appointments", box: { left: "49.95%", top: "51.20%", width: "46.86%", height: "11.60%" } },
] as const;

// Services / Your Barber stay purely visual on mobile too — no
// route to invent, matching desktop's current inert treatment.
const MOBILE_POLAR_ID_PATCH_BOX = { left: "39.74%", top: "38.40%", width: "27.10%", height: "3.05%" };

export default async function ClientDashboardPage() {
  const { supabase, user } = await requireRole("client");

  const { data: profile } = await supabase
    .from("profiles")
    .select("polar_id")
    .eq("id", user.id)
    .maybeSingle();

  const polarId = profile?.polar_id ?? POLAR_ID_PLACEHOLDER;

  return (
    <>
      {/* Mobile — two-asset architecture mirroring desktop: mastered
          portrait background + transparent UI overlay, stacked and
          scaled together 1:1 within a container that holds the
          assets' own 941:1672 aspect ratio (no inset/shrink here —
          unlike desktop's 76% composition, these mobile assets are
          meant to fill the frame directly). Real HTML on top is
          limited to the two functional click targets (Book
          Appointment, My Appointments) and the live POLAR ID patch;
          Services/Your Barber stay purely visual, matching their
          current desktop (inert) treatment. */}
      <main className="relative min-h-[100dvh] w-full overflow-hidden bg-navy sm:hidden">
        <div className="relative w-full aspect-[941/1672]">
          <Image
            src="/dashboard/polar-client-dashboard-app-background.png"
            alt=""
            fill
            priority
            className="object-cover"
            aria-hidden="true"
          />

          <Image
            src="/dashboard/polar-client-dashboard-app-ui.png"
            alt=""
            fill
            priority
            className="object-cover"
            aria-hidden="true"
          />

          {/* Real, dynamic POLAR ID patched over the baked
              placeholder — never baked into production. */}
          <div className="absolute" style={MOBILE_POLAR_ID_PATCH_BOX}>
            <div className="absolute inset-0" style={{ backgroundColor: "#E2F1FB" }} aria-hidden="true" />
            <p
              className="relative flex h-full w-full items-center justify-center whitespace-nowrap font-body font-extrabold text-black"
              style={{ fontSize: "5.6vw", lineHeight: 1 }}
            >
              {polarId}
            </p>
          </div>

          {MOBILE_CLICK_TARGETS.map(({ href, label, box }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="absolute focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-light"
              style={box}
            />
          ))}
        </div>
      </main>

      {/* Desktop — the final mastered artwork, full width, centred
          (overflow cropped top/bottom on wide screens), with the same
          image blurred behind it to fill any letterbox space. */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-60 blur-2xl"
          style={{ backgroundImage: `url(${DESKTOP_ASSET})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full aspect-[1670/942]" style={{ containerType: "inline-size" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={DESKTOP_ASSET} alt="" className="absolute inset-0 h-full w-full" aria-hidden="true" />

            <div className="absolute" style={DESKTOP_POLAR_ID_BOX}>
              <div className="absolute inset-0 rounded-sm" style={{ backgroundColor: "#060508" }} aria-hidden="true" />
              <p className="relative flex h-full w-full items-center whitespace-nowrap font-body font-bold text-white" style={{ fontSize: "1.05cqw", lineHeight: 1 }}>
                {polarId}
              </p>
            </div>

            {DESKTOP_TARGETS.map(({ href, label, box }) => (
              <Link key={label} href={href} aria-label={label} className={HOTSPOT_CLASS} style={box} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
