import Image from "next/image";

// Shared desktop shell for /signup/client and /signup/barber — same
// crop-to-fill technique proven on /signup (doors) and /login this
// session: width: max(100%, calc(100dvh*ratio)) + shrink-0 (required —
// this box is a flex child, and default flex-shrink:1 silently
// re-compresses a max()'d width back down to fit the container,
// undoing the whole fix) + centered + overflow-hidden on every
// relevant ancestor. Guarantees the artwork always fills the viewport
// edge-to-edge on whichever axis is binding, cropping the other
// symmetrically, with zero distortion and zero gaps, on every screen.
//
// The artwork itself still has last pass's reference panel baked into
// its centre (the supplied PNGs are full design mockups, not
// room-only plates) — PANEL_BOX below is that panel's own measured
// OUTER footprint, border included (found by cropping candidate boxes
// directly out of the source art and visually confirming the fit).
// `children` renders inside a solid, opaque fill (colour sampled
// directly from the artwork's own panel interior — confirmed a flat
// near-black navy, not a gradient) inset 2% from that outer box, so
// the artwork's own baked gradient border shows through as a frame
// (matching the approved design, not redrawn in CSS) while the fill
// completely occludes the baked reference content behind it — same
// "new opaque layer covers old baked content" technique already used
// for the Page 5 CTA button earlier this project. Without this fill,
// the real (correctly positioned but transparent) panel content and
// the baked reference content behind it show through simultaneously,
// double-exposed — confirmed live before adding this. Nothing here is
// a click-overlay on a flat image; every control inside `children` is
// real, functional markup.
const CANVAS_ASPECT = "1672 / 941";
export const PANEL_BOX = { left: "23.33%", top: "9.35%", width: "53.89%", height: "83.64%" };
const PANEL_FILL = "#04070f";

// Barber-only alternative panel mode (`sizing="content"` below).
// Barber's artwork (unlike Client's) is a blank-interior plate — the
// splatter/glow/gradient frame is baked in, but the panel interior is
// empty, approved art with nothing left to occlude. So this mode
// renders a fully transparent container at the same LEFT/TOP/WIDTH
// (still the artwork's own measured panel position — unchanged) with
// height intrinsic to content, capped at that same 83.64% ceiling
// (the frame's own baked inner-bottom edge) so scrolling/expanded
// content is contained by the real frame instead of spilling past it.
// No fill colour, no CSS-drawn border — the approved baked frame does
// that job, unmodified, in every accordion state. Client's own
// rendering path (no `sizing` prop, still occluding a content-baked
// reference panel) is completely untouched by this.
const PANEL_LEFT = PANEL_BOX.left;
const PANEL_TOP = PANEL_BOX.top;
const PANEL_WIDTH = PANEL_BOX.width;
const PANEL_MAX_HEIGHT = PANEL_BOX.height;

export function SignupScene({
  src,
  alt,
  children,
  sizing = "fixed",
}: {
  src: string;
  alt: string;
  children: React.ReactNode;
  /** "fixed" (default, unchanged) = Client's exact-box panel, occluding
   *  a content-baked reference panel with an opaque fill.
   *  "content" = Barber's transparent, content-sized panel over a
   *  blank-interior artwork plate — no fill, no CSS border, capped at
   *  the same height ceiling as the frame's own baked interior. */
  sizing?: "fixed" | "content";
}) {
  return (
    <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="relative aspect-[1672/941] shrink-0" style={{ width: `max(100%, calc(100dvh * ${CANVAS_ASPECT}))` }}>
          <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" priority />

          {sizing === "fixed" ? (
            <div className="absolute" style={PANEL_BOX}>
              <div className="absolute inset-[2%] overflow-hidden rounded-[3%]" style={{ backgroundColor: PANEL_FILL }}>
                {children}
              </div>
            </div>
          ) : (
            <div
              className="absolute flex flex-col overflow-hidden rounded-[3%]"
              style={{ left: PANEL_LEFT, top: PANEL_TOP, width: PANEL_WIDTH, maxHeight: PANEL_MAX_HEIGHT }}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
