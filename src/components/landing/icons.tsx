// Bold solid icon set for landing-page feature bullets. Deliberately
// plain single-path SVGs (no icon library dependency) filled with
// currentColor so each usage controls its own bright-blue fill.
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      {children}
    </svg>
  );
}

export function ShieldIcon() {
  return (
    <Icon>
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" />
    </Icon>
  );
}

export function PhotoIcon() {
  return (
    <Icon>
      <path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm2 3a2 2 0 100 4 2 2 0 000-4zm-2 9l5-5 4 4 3-3 5 5H4z" />
    </Icon>
  );
}

export function UserIcon() {
  return (
    <Icon>
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z" />
    </Icon>
  );
}

export function LockIcon() {
  return (
    <Icon>
      <path d="M7 10V7a5 5 0 0110 0v3h1a1 1 0 011 1v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9a1 1 0 011-1h1zm2 0h6V7a3 3 0 00-6 0v3z" />
    </Icon>
  );
}

export function ClockIcon() {
  return (
    <Icon>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5v5.5l4 2.4-.8 1.3L11 13V7h2z" />
    </Icon>
  );
}

export function LayersIcon() {
  return (
    <Icon>
      <path d="M12 2l9 5-9 5-9-5 9-5zm-9 9l9 5 9-5v2l-9 5-9-5v-2zm0 5l9 5 9-5v2l-9 5-9-5v-2z" />
    </Icon>
  );
}

export function LinkIcon() {
  return (
    <Icon>
      <path d="M10.6 13.4a3 3 0 000-4.2l-2-2a3 3 0 10-4.2 4.2l1 1 1.4-1.4-1-1a1 1 0 111.4-1.4l2 2a1 1 0 010 1.4zm2.8-2.8a3 3 0 000 4.2l2 2a3 3 0 104.2-4.2l-1-1-1.4 1.4 1 1a1 1 0 11-1.4 1.4l-2-2a1 1 0 010-1.4z" />
    </Icon>
  );
}

export function SparkleIcon() {
  return (
    <Icon>
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2zM19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z" />
    </Icon>
  );
}

export function SearchIcon() {
  return (
    <Icon>
      <path d="M10 4a6 6 0 104.5 10.1l4.7 4.7 1.4-1.4-4.7-4.7A6 6 0 0010 4zm0 2a4 4 0 110 8 4 4 0 010-8z" />
    </Icon>
  );
}

export function IdIcon() {
  return (
    <Icon>
      <path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm3 4a2 2 0 100 4 2 2 0 000-4zm-2.5 8h5c0-1.7-1.1-3-2.5-3s-2.5 1.3-2.5 3zM14 9h6v1.5h-6V9zm0 3h6v1.5h-6V12zm0 3h4v1.5h-4V15z" />
    </Icon>
  );
}
