// PLACEHOLDER MASCOT ASSET — no approved final render exists yet.
// This is a modular geometric stand-in for the approved POLAR bear:
// white polar bear, large round head, glowing cyan/blue eyes, wide
// sharp-toothed grin, compact stocky body, plain black/navy zip
// hoodie, dark trousers, black boots. No logos/sneakers/accessories.
//
// Swap-out plan: once a final Guardian-pose render exists, replace
// the <svg> body below (or the whole component) with an <img>/<Image>
// pointing at the approved asset — every call site just passes a
// `pose` + `className`, so no caller needs to change.
type MascotPose = "assertive" | "guardian";

export function Mascot({
  pose = "assertive",
  className = "",
}: {
  pose?: MascotPose;
  className?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      <svg
        viewBox="0 0 200 240"
        className="h-full w-full drop-shadow-[0_20px_35px_rgba(11,95,255,0.35)]"
      >
        <rect x="70" y="188" width="26" height="42" rx="10" fill="#0A1128" />
        <rect x="104" y="188" width="26" height="42" rx="10" fill="#0A1128" />
        <rect x="63" y="222" width="34" height="16" rx="8" fill="#050914" />
        <rect x="103" y="222" width="34" height="16" rx="8" fill="#050914" />

        <rect x="48" y="108" width="104" height="96" rx="42" fill="#0A1128" />
        <rect x="76" y="158" width="48" height="30" rx="13" fill="#111B3A" />

        {pose === "guardian" ? (
          <>
            <rect x="30" y="118" width="28" height="74" rx="14" fill="#0A1128" />
            <rect x="142" y="118" width="28" height="74" rx="14" fill="#0A1128" />
            <circle cx="44" cy="196" r="15" fill="#FFFFFF" />
            <circle cx="156" cy="196" r="15" fill="#FFFFFF" />
          </>
        ) : (
          <>
            <rect
              x="26"
              y="128"
              width="26"
              height="62"
              rx="13"
              fill="#0A1128"
              transform="rotate(-18 39 159)"
            />
            <rect
              x="146"
              y="104"
              width="26"
              height="62"
              rx="13"
              fill="#0A1128"
              transform="rotate(24 159 135)"
            />
            <circle cx="34" cy="196" r="15" fill="#FFFFFF" />
            <circle cx="166" cy="142" r="15" fill="#FFFFFF" />
          </>
        )}

        <circle cx="100" cy="80" r="63" fill="#FFFFFF" />
        <circle cx="53" cy="33" r="17" fill="#FFFFFF" />
        <circle cx="147" cy="33" r="17" fill="#FFFFFF" />
        <ellipse cx="100" cy="100" rx="31" ry="21" fill="#FFFFFF" />

        <circle cx="77" cy="71" r="11" fill="#22D3FF" />
        <circle cx="123" cy="71" r="11" fill="#22D3FF" />
        <circle cx="77" cy="71" r="4.5" fill="#EAFBFF" />
        <circle cx="123" cy="71" r="4.5" fill="#EAFBFF" />

        <ellipse cx="100" cy="96" rx="8" ry="6" fill="#0A1128" />
        <path d="M74 104 Q100 132 126 104 Q100 120 74 104 Z" fill="#0A1128" />
        <path d="M80 105 L85 116 L90 105 Z" fill="#FFFFFF" />
        <path d="M94 109 L100 121 L106 109 Z" fill="#FFFFFF" />
        <path d="M110 105 L115 116 L120 105 Z" fill="#FFFFFF" />
      </svg>
    </div>
  );
}
