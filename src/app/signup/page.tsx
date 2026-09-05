import Image from "next/image";
import Link from "next/link";

// POLAR 2-way signup portal. The artwork (public/signup/portal-*.png)
// is approved, final creative — rendered as-is, never recreated in
// CSS. Only two things are added on top: transparent, fully clickable
// <Link> regions positioned over the Client/Barber doors (and, on
// desktop only, the "Back to Home" text baked into that artwork —
// the mobile artwork has no equivalent element, so none is added
// there), plus a hover/press-only glow on each door region. Routes to
// the existing, unchanged /signup/client and /signup/barber flows.
const GLOW =
  "transition rounded-2xl hover:shadow-[0_0_45px_12px_rgba(11,95,255,0.35),0_0_80px_24px_rgba(255,61,154,0.15)] active:shadow-[0_0_35px_10px_rgba(11,95,255,0.45),0_0_60px_18px_rgba(255,61,154,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default function SignupPortalPage() {
  return (
    <main className="min-h-screen bg-navy sm:h-screen sm:overflow-hidden">
      {/* Desktop / tablet artwork — fit to viewport height, no scroll.
          Container ratio (1.44/1, ~90% viewport width at 1440x900) now
          crops slightly into the decorative lower door frame / floor-
          reflection area below the readable text, per explicit
          approval — the crop line sits well clear of all text and
          icons (verified against the actual pixel position of "FEEL
          SHARPER."/"BE RECOGNISED." baselines) so nothing readable or
          brand-critical is ever cut off. Door overlay height is
          clamped to end exactly at the visible crop edge (not the
          full original door height) so the clickable region always
          matches what's actually on screen. */}
      <div className="hidden h-full w-full items-center justify-center sm:flex">
        <div className="relative h-full max-w-full aspect-[1.44/1]">
          <Image
            src="/signup/portal-desktop.png"
            alt="POLAR — Join the Room. Two doors: I'm a Client, I'm a Barber."
            fill
            sizes="100vh"
            className="object-cover object-top"
            priority
          />

          <Link
            href="/"
            aria-label="Back to home"
            className={GLOW}
            style={{ position: "absolute", left: "1.23%", top: "4.12%", width: "17.18%", height: "5.3%" }}
          />
          <Link
            href="/signup/client"
            aria-label="I'm a Client — book, be seen, feel sharper"
            className={GLOW}
            style={{ position: "absolute", left: "20.46%", top: "38.87%", width: "27.82%", height: "61.13%" }}
          />
          <Link
            href="/signup/barber"
            aria-label="I'm a Barber — build, grow, be recognised"
            className={GLOW}
            style={{ position: "absolute", left: "52.78%", top: "38.87%", width: "28.23%", height: "61.13%" }}
          />
        </div>
      </div>

      {/* Mobile artwork */}
      <div className="relative mx-auto block w-full max-w-md sm:hidden">
        <div className="relative aspect-[1024/1536] w-full">
          <Image
            src="/signup/portal-mobile.png"
            alt="POLAR — Join the Room. Two doors: I'm a Client, I'm a Barber."
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />

          <Link
            href="/signup/client"
            aria-label="I'm a Client — book, be seen, feel sharper"
            className={GLOW}
            style={{ position: "absolute", left: "20.51%", top: "19.53%", width: "59.57%", height: "27.99%" }}
          />
          <Link
            href="/signup/barber"
            aria-label="I'm a Barber — build, grow, be recognised"
            className={GLOW}
            style={{ position: "absolute", left: "20.51%", top: "51.43%", width: "59.57%", height: "27.99%" }}
          />
        </div>
      </div>
    </main>
  );
}
