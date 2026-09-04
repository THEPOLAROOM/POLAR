// PLACEHOLDER BACKGROUND — no POLAR Room photography exists yet.
// CSS-only stand-in for the approved "frosted/blurred POLAR Room"
// treatment (blue cabinetry / white surfaces / cool lighting / subtle
// low-opacity mural-wave shapes) used behind body panels 02–06.
// Swap-out plan: replace this with a real photo (blurred/frosted via
// an overlay) once approved imagery exists — panels only reference
// <RoomBackground />, so no panel needs to change.
export function RoomBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden bg-ice-50">
      <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-royal/10 blur-3xl" />
      <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-royal/15 blur-3xl" />
      <div className="absolute right-1/3 top-1/4 h-40 w-40 rounded-full bg-magenta/10 blur-3xl" />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        preserveAspectRatio="none"
        viewBox="0 0 400 300"
      >
        <path d="M0 210 Q100 160 200 210 T400 210 V300 H0 Z" fill="#0B5FFF" />
        <path d="M0 245 Q100 205 200 245 T400 245 V300 H0 Z" fill="#0A1128" />
      </svg>
    </div>
  );
}
