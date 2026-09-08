function Icon({ children, className = "h-8 w-8" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function CalendarIcon(props: { className?: string }) {
  return <Icon {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /><circle cx="8" cy="14" r="0.5" fill="currentColor" /><circle cx="12" cy="14" r="0.5" fill="currentColor" /><circle cx="16" cy="14" r="0.5" fill="currentColor" /></Icon>;
}
export function HistoryIcon(props: { className?: string }) {
  return <Icon {...props}><path d="M3 11a9 9 0 1 1 2.6 6.3" /><path d="M3 5v6h6" /><path d="M12 8v4l3 2" /></Icon>;
}
export function UserIcon(props: { className?: string }) {
  return <Icon {...props}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></Icon>;
}
export function ScissorsIcon(props: { className?: string }) {
  return <Icon {...props}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4L8.5 12M20 20L8.5 12M8.5 12L4 8.5M8.5 12L4 15.5" /></Icon>;
}
export function ChevronCircleIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={props.className ?? "h-6 w-6"} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={1.5} />
      <path d="M10 8l4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function CrownIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={props.className ?? "h-6 w-6"} fill="currentColor" aria-hidden="true">
      <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8zm2 12h14v2H5v-2z" />
    </svg>
  );
}
