// Shared crystalline top/bottom edge used consistently across body
// panels 02–06, per the approved border/background system.
export function IceBorder({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-x-0 z-10 h-[7px] bg-[linear-gradient(90deg,transparent_0%,rgba(11,95,255,0.6)_12%,rgba(255,255,255,0.95)_50%,rgba(11,95,255,0.6)_88%,transparent_100%)] ${
        position === "top" ? "top-0" : "bottom-0"
      }`}
      style={{
        clipPath:
          "polygon(0% 100%,3% 10%,6% 100%,9% 10%,12% 100%,15% 10%,18% 100%,21% 10%,24% 100%,27% 10%,30% 100%,33% 10%,36% 100%,39% 10%,42% 100%,45% 10%,48% 100%,51% 10%,54% 100%,57% 10%,60% 100%,63% 10%,66% 100%,69% 10%,72% 100%,75% 10%,78% 100%,81% 10%,84% 100%,87% 10%,90% 100%,93% 10%,96% 100%,99% 10%,100% 100%)",
      }}
    />
  );
}
