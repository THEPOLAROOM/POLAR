function Icon({ children, className = "h-5 w-5" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

type IconProps = { className?: string };

export function UserIcon({ className }: IconProps) {
  return <Icon className={className}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></Icon>;
}
export function EnvelopeIcon({ className }: IconProps) {
  return <Icon className={className}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Icon>;
}
export function LockIcon({ className }: IconProps) {
  return <Icon className={className}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 118 0v4" /></Icon>;
}
export function PinIcon({ className }: IconProps) {
  return <Icon className={className}><path d="M12 21s7-6.2 7-11.5A7 7 0 105 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.3" /></Icon>;
}
export function SearchIcon({ className = "h-4 w-4" }: IconProps) {
  return <Icon className={className}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-3.8-3.8" /></Icon>;
}
export function EyeIcon({ className }: IconProps) {
  return <Icon className={className}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></Icon>;
}
export function EyeOffIcon({ className }: IconProps) {
  return <Icon className={className}><path d="M3 3l18 18" /><path d="M10.6 5.2A10.6 10.6 0 0112 5c6.4 0 10 7 10 7a17.6 17.6 0 01-3.6 4.6M6.5 6.6C4 8.3 2 12 2 12s3.6 7 10 7a10.4 10.4 0 004-.8" /><path d="M9.5 9.6a3 3 0 004 4" /></Icon>;
}
export function ChevronDownIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return <Icon className={className}><path d="M6 9l6 6 6-6" /></Icon>;
}
