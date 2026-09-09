import Image from "next/image";
import Link from "next/link";

// POLAR 2-way signup portal. The artwork (public/signup/portal-*.png)
// is approved, final creative — rendered as-is, never recreated in
// CSS. Only two things are added on top: transparent, fully clickable
// <Link> regions positioned over the Client/Barber doors, plus a
// hover/press-only glow on each door region. Routes to the existing,
// unchanged /signup/client and /signup/barber flows.
//
// The current desktop artwork (1672x941, ~16:9) has no baked-in "Back
// to Home" element — unlike the earlier desktop artwork revision, so
// no overlay is added for it here (same as mobile, which never had
// one either).
const GLOW =
  "transition rounded-2xl hover:shadow-[0_0_45px_12px_rgba(11,95,255,0.35),0_0_80px_24px_rgba(255,61,154,0.15)] active:shadow-[0_0_35px_10px_rgba(11,95,255,0.45),0_0_60px_18px_rgba(255,61,154,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default function SignupPortalPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-navy sm:h-screen">
      {/* Desktop / tablet artwork — new artwork is ~16:9 (1672x941),
          near-identical to the most common laptop screen ratio, so it
          is sized by WIDTH (fills the viewport edge-to-edge on true
          16:9 screens) with a max-height safety cap for taller/narrower
          windows, using object-contain — no cropping needed at all on
          the vast majority of real screens. This is the opposite
          priority from the previous (portrait-ish) artwork, which had
          to be cropped to avoid huge empty side margins; this one
          naturally fills the width without any crop. */}
      <div className="hidden h-full w-full items-center justify-center sm:flex">
        <div className="relative w-full max-h-screen aspect-[1672/941]">
          <Image
            src="/signup/portal-desktop.png"
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
            style={{ position: "absolute", left: "30.2%", top: "28.69%", width: "18.54%", height: "49.95%" }}
          />
          <Link
            href="/signup/barber"
            aria-label="I'm a Barber — build, grow, be recognised"
            className={GLOW}
            style={{ position: "absolute", left: "51.73%", top: "28.69%", width: "18.54%", height: "49.95%" }}
          />
        </div>
      </div>

      {/* Mobile artwork — the artwork (1024:1536, ~0.667 w/h) is
          proportionally wider-relative-to-height than a real phone
          viewport (~0.46-0.56 w/h), so fitting it by WIDTH (the
          previous min() approach) always left it short of the full
          viewport height — that's the large navy gap. Instead size
          it by HEIGHT (fill 100dvh), letting the resulting width
          exceed the viewport; the parent's overflow-hidden (above)
          clips the excess symmetrically since this element stays
          centred, so only the artwork's outer side margins are
          cropped — the doors themselves sit well within the centre
          60% width and are never touched. Aspect ratio is always
          preserved since both dimensions come from one formula. */}
      <div
        className="relative mx-auto block sm:hidden"
        style={{ width: "max(100%, calc(100dvh * 1024 / 1536))" }}
      >
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
