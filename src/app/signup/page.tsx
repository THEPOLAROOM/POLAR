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
          Container ratio (1.28/1) is set at the maximum verified safe
          against the source artwork's own geometry: wider than this
          and the crop line starts cutting into the bottom of the door
          frames themselves, which would break "doors fully visible".
          At this ratio the crop stops just below the door frames
          (floor mark / caption / feature strip only) — POLAR branding,
          JOIN THE ROOM, and both complete doors always stay visible.
          Overlay percentages below are recalculated against the
          visible (cropped) window, not the full source image. */}
      <div className="hidden h-full w-full items-center justify-center sm:flex">
        <div className="relative h-full max-w-full aspect-[1.28/1]">
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
            style={{ position: "absolute", left: "1.23%", top: "3.67%", width: "17.18%", height: "4.71%" }}
          />
          <Link
            href="/signup/client"
            aria-label="I'm a Client — book, be seen, feel sharper"
            className={GLOW}
            style={{ position: "absolute", left: "20.46%", top: "34.56%", width: "27.82%", height: "64.42%" }}
          />
          <Link
            href="/signup/barber"
            aria-label="I'm a Barber — build, grow, be recognised"
            className={GLOW}
            style={{ position: "absolute", left: "52.78%", top: "34.56%", width: "28.23%", height: "64.42%" }}
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
