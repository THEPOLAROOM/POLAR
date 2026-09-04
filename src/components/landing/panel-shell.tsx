import { RoomBackground } from "./room-background";
import { IceBorder } from "./ice-border";

// Shared shell for body panels 02–06: consistent thin crystalline
// top/bottom edge + frosted POLAR-Room-inspired background. Panels 01
// and 07 deliberately do NOT use this — they keep their own stronger,
// distinct bookend treatments.
export function PanelShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative flex min-h-[600px] w-full flex-col justify-center overflow-hidden px-6 py-20 sm:px-12 md:px-20 ${className}`}
    >
      <RoomBackground />
      <IceBorder position="top" />
      <IceBorder position="bottom" />
      <div className="relative mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}
