import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";

// Reuses the exact same full-bleed background + fixed-viewport +
// centred-box scaffold as the Barber Dashboard
// (src/app/dashboard/barber/page.tsx), including the identical
// OVERLAY_SCALE/aspect-ratio/width-cap values, so this page occupies
// the same on-screen area at the same scale — per instruction, this
// should feel like the dashboard naturally transitioning to another
// POLAR screen in the same environment, not a separate page shell.
const OVERLAY_SCALE = 0.72;
const OVERLAY_INSET_PCT = `${((1 - OVERLAY_SCALE) / 2) * 100}%`;
const OVERLAY_INSET = {
  left: OVERLAY_INSET_PCT,
  right: OVERLAY_INSET_PCT,
  top: OVERLAY_INSET_PCT,
  bottom: OVERLAY_INSET_PCT,
};

function vw(px: number) {
  return `${px * OVERLAY_SCALE}vw`;
}

type IconProps = { className?: string; style?: React.CSSProperties };

function PersonIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
    </svg>
  );
}
function PeopleIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 19c1-3 3.3-4.6 6.5-4.6s5.5 1.6 6.5 4.6" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 14.6c2.6.2 4.3 1.7 5 4.4" />
    </svg>
  );
}
function TrophyIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4h10v4a5 5 0 01-10 0V4z" />
      <path d="M7 5H4v1.5A3.5 3.5 0 007.5 10M17 5h3v1.5A3.5 3.5 0 0116.5 10" />
      <path d="M12 13v3M9 20h6M10 17h4v3h-4z" />
    </svg>
  );
}
function CameraIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  );
}
function LocationIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-6.4 7-11.5A7 7 0 105 9.5C5 14.6 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}
function CheckBadgeIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l2.2 1.3 2.5-.3 1 2.3 2.3 1-.3 2.5L21 12l-1.3 2.2.3 2.5-2.3 1-1 2.3-2.5-.3L12 21l-2.2-1.3-2.5.3-1-2.3-2.3-1 .3-2.5L3 12l1.3-2.2-.3-2.5 2.3-1 1-2.3 2.5.3z" />
      <path d="M9 12.3l2 2 4-4.3" />
    </svg>
  );
}
function BriefcaseIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="11" rx="1.5" />
      <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" />
    </svg>
  );
}
function AwardIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8.5" r="5" />
      <path d="M8.5 12.8L7 21l5-2.5L17 21l-1.5-8.2" />
    </svg>
  );
}
function ImageIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path d="M21 16.5l-5.5-5.5-4 4-2.5-2.5L3 18" />
    </svg>
  );
}
function EyeIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function PhoneIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h3.5l1.3 4-2 1.4a12 12 0 006 6l1.4-2 4 1.3V18a2 2 0 01-2 2C10.5 20 4 13.5 4 6a2 2 0 011-2z" />
    </svg>
  );
}
function LockIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 118 0v4" />
    </svg>
  );
}
function DocumentIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </svg>
  );
}
function StarIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" />
    </svg>
  );
}
function PlayIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}
function GearIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 00-.2-1.6l2-1.4-1.5-2.6-2.3.8a7 7 0 00-2.8-1.6L14 3h-4l-.2 2.6a7 7 0 00-2.8 1.6l-2.3-.8-1.5 2.6 2 1.4a7 7 0 000 3.2l-2 1.4 1.5 2.6 2.3-.8a7 7 0 002.8 1.6L10 21h4l.2-2.6a7 7 0 002.8-1.6l2.3.8 1.5-2.6-2-1.4c.13-.5.2-1.05.2-1.6z" />
    </svg>
  );
}
function ArrowIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

type Accent = "blue" | "magenta";

const ACCENT_CLASSES: Record<Accent, { border: string; glow: string; icon: string }> = {
  blue: {
    border: "border-royal-light/40",
    glow: "shadow-[0_0_0_1px_rgba(91,155,255,0.25),0_0_24px_-6px_rgba(91,155,255,0.55)]",
    icon: "text-royal-light",
  },
  magenta: {
    border: "border-magenta/40",
    glow: "shadow-[0_0_0_1px_rgba(255,61,154,0.25),0_0_24px_-6px_rgba(255,61,154,0.55)]",
    icon: "text-magenta",
  },
};

// Server-side ROLE check happens FIRST, same as every other protected
// barber page.
export default async function BarberAccountPage() {
  const { supabase, user } = await requireRole("barber");

  const [{ data: profile }, { data: professional }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("barber_professional_details")
      .select("barber_name, business_name, years_experience, work_location")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  // Only "Years Experience" has a real backing field today. Happy
  // Clients and Achievements have no schema/tracking anywhere yet, so
  // they stay permanently 0 for V1 (never invented) — the header
  // keeps all three positions present so they can start populating
  // from real data later without a layout change.
  const displayName = profile?.full_name?.trim() || null;
  const location = professional?.work_location?.trim() || null;
  const yearsExperience = professional?.years_experience ?? 0;

  const hasPersonalDetails = Boolean(profile?.full_name?.trim() && profile?.phone?.trim());
  const hasProfessionalProfile = Boolean(
    professional?.barber_name?.trim() ||
      professional?.business_name?.trim() ||
      professional?.work_location?.trim() ||
      professional?.years_experience
  );

  const SECTIONS: {
    key: string;
    title: string;
    description: string;
    icon: (p: IconProps) => React.JSX.Element;
    statusIcon: (p: IconProps) => React.JSX.Element;
    statusText: string;
    href: string | null;
    accent: Accent;
  }[] = [
    {
      key: "personal",
      title: "Personal Details",
      description: "Add your personal information and account details.",
      icon: PersonIcon,
      statusIcon: LockIcon,
      statusText: hasPersonalDetails ? "Added" : "Not added yet",
      href: "/dashboard/barber/account/personal-details",
      accent: "blue",
    },
    {
      key: "professional",
      title: "Professional Profile & CV",
      description: "Add your professional information, experience and journey.",
      icon: BriefcaseIcon,
      statusIcon: DocumentIcon,
      statusText: hasProfessionalProfile ? "Added" : "Not added yet",
      href: "/dashboard/barber/account/professional-profile",
      accent: "magenta",
    },
    {
      key: "qualifications",
      title: "Qualifications, Skills & Achievements",
      description: "Add your qualifications, skills, courses and awards.",
      icon: AwardIcon,
      statusIcon: StarIcon,
      statusText: "Not added yet",
      href: null,
      accent: "blue",
    },
    {
      key: "eportfolio",
      title: "ePortfolio",
      description: "Showcase your work with photos and videos.",
      icon: ImageIcon,
      statusIcon: PlayIcon,
      statusText: "Not added yet",
      href: null,
      accent: "magenta",
    },
    {
      key: "visibility",
      title: "Profile Visibility",
      description: "Control what others can see on your public profile.",
      icon: EyeIcon,
      statusIcon: GearIcon,
      statusText: "Not configured yet",
      href: null,
      accent: "blue",
    },
    {
      key: "emergency",
      title: "Emergency Contact",
      description: "Add emergency contact information (private).",
      icon: PhoneIcon,
      statusIcon: LockIcon,
      statusText: "Not added yet",
      href: null,
      accent: "magenta",
    },
  ];

  return (
    <div id="barber-profile-page">
      {/* Same technique as the Barber Dashboard: the shared barber nav
          lives in layout.tsx, which every other barber route still
          needs, so it's hidden for this specific page only via this
          scoped rule rather than editing the shared layout. */}
      <style>{`
        div:has(> #barber-profile-page) > nav {
          display: none;
        }
      `}</style>

      {/* Mobile — simple functional placeholder; the immersive layered
          design below is desktop-only, matching the Barber Dashboard. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">My Profile</h1>
        <p className="mt-2 text-sm text-polar-muted">Signed in as {user.email}.</p>
        <ul className="mt-6 space-y-2">
          {SECTIONS.map((s) =>
            s.href ? (
              <li key={s.key}>
                <Link href={s.href} className="block rounded border border-polar-border px-3 py-2 text-sm text-polar-text">
                  {s.title} — {s.statusText}
                </Link>
              </li>
            ) : (
              <li key={s.key} className="rounded border border-polar-border px-3 py-2 text-sm text-polar-muted">
                {s.title} — {s.statusText}
              </li>
            )
          )}
        </ul>
      </main>

      {/* Desktop — identical background/viewport scaffold as the
          Barber Dashboard: full-bleed background layer, main fixed to
          100dvh with overflow-hidden, and the same width-capped,
          72%-inset centred box, so this page sits at the exact same
          scale/position on screen. There is no mastered PNG overlay
          here (none was supplied for this page) — this is real HTML,
          styled to match the supplied My Profile reference. */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/dashboard/polar-barber-dashboard-background.png)" }}
          aria-hidden="true"
        />

        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div
            className="relative aspect-[1672/941]"
            style={{ width: "min(100%, calc(100dvh * 1672 / 941))" }}
          >
            <div className="absolute flex flex-col" style={{ ...OVERLAY_INSET, gap: vw(14) }}>
              {/* Header card */}
              <div
                className={`relative flex flex-none items-center rounded-2xl border ${ACCENT_CLASSES.blue.border} bg-navy-light/50 backdrop-blur-sm ${ACCENT_CLASSES.blue.glow}`}
                style={{ padding: vw(16), gap: vw(20) }}
              >
                {/* Photo — no avatar field exists yet, so this is a
                    genuine, permanent empty-state placeholder, not a
                    functional uploader, for V1. */}
                <div
                  className="relative flex flex-none items-center justify-center rounded-full border-2 border-dashed border-magenta/50 text-white/60"
                  style={{ width: vw(90), height: vw(90) }}
                >
                  <div className="flex flex-col items-center" style={{ gap: vw(4) }}>
                    <CameraIcon style={{ width: vw(22), height: vw(22) }} />
                    <span style={{ fontSize: vw(9) }}>Add Photo</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center" style={{ gap: vw(8) }}>
                    <p className="truncate font-display text-white" style={{ fontSize: vw(20) }}>
                      {displayName ?? "Your Name"}
                    </p>
                    <CheckBadgeIcon className="flex-none text-royal-light" style={{ width: vw(16), height: vw(16) }} />
                  </div>
                  {location ? (
                    <p className="mt-1 flex items-center text-white/60" style={{ gap: vw(4), fontSize: vw(11) }}>
                      <LocationIcon style={{ width: vw(11), height: vw(11) }} />
                      {location}
                    </p>
                  ) : (
                    <Link
                      href="/dashboard/barber/account/professional-profile"
                      className="mt-1 flex items-center text-royal-light/70 hover:text-royal-light"
                      style={{ gap: vw(4), fontSize: vw(11) }}
                    >
                      <LocationIcon style={{ width: vw(11), height: vw(11) }} />
                      Add Location
                    </Link>
                  )}
                  <p className="mt-1 truncate text-white/40" style={{ fontSize: vw(11) }}>
                    Add a short bio about yourself…
                  </p>
                </div>

                <div className="flex flex-none items-center" style={{ gap: vw(18) }}>
                  <div className="flex-none bg-white/10" style={{ width: 1, height: vw(48) }} />
                  {[
                    { icon: PersonIcon, value: yearsExperience, label: "Years Experience" },
                    { icon: PeopleIcon, value: 0, label: "Happy Clients" },
                    { icon: TrophyIcon, value: 0, label: "Achievements" },
                  ].map(({ icon: StatIcon, value, label }) => (
                    <div key={label} className="flex flex-col items-center text-royal-light" style={{ gap: vw(2), width: vw(72) }}>
                      <StatIcon style={{ width: vw(16), height: vw(16) }} />
                      <p className="font-display text-white" style={{ fontSize: vw(16) }}>{value}</p>
                      <p className="text-center text-white/50" style={{ fontSize: vw(8.5) }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Edit Header — no single existing field/route owns
                    every field shown here (name lives in Personal
                    Details, location in Professional Profile), so
                    rather than invent a destination this stays a
                    visual-only target for V1, same treatment as the
                    Dashboard's backend-less Emergency action. */}
                <div
                  aria-hidden="true"
                  className={`flex flex-none items-center rounded-lg border ${ACCENT_CLASSES.blue.border} text-white/70`}
                  style={{ gap: vw(6), padding: `${vw(8)} ${vw(12)}`, fontSize: vw(10.5) }}
                >
                  <DocumentIcon style={{ width: vw(11), height: vw(11) }} />
                  Edit Header
                </div>
              </div>

              {/* Six section cards */}
              <div className="grid flex-1 grid-cols-3 grid-rows-2" style={{ gap: vw(14) }}>
                {SECTIONS.map((section) => {
                  const accent = ACCENT_CLASSES[section.accent];
                  const Icon = section.icon;
                  const StatusIcon = section.statusIcon;
                  const content = (
                    <>
                      <Icon className={accent.icon} style={{ width: vw(22), height: vw(22) }} />
                      <p className="mt-auto font-display text-white" style={{ fontSize: vw(13.5) }}>
                        {section.title}
                      </p>
                      <p className="text-white/50" style={{ fontSize: vw(10), marginTop: vw(4) }}>
                        {section.description}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-[0.6vw]">
                        <span className={`flex items-center text-white/40`} style={{ gap: vw(5), fontSize: vw(9.5) }}>
                          <StatusIcon style={{ width: vw(11), height: vw(11) }} />
                          {section.statusText}
                        </span>
                        <span
                          className={`flex items-center justify-center rounded-full border ${accent.border} ${accent.icon}`}
                          style={{ width: vw(24), height: vw(24) }}
                        >
                          <ArrowIcon style={{ width: vw(12), height: vw(12) }} />
                        </span>
                      </div>
                    </>
                  );
                  const cardClass = `relative flex flex-col rounded-2xl border ${accent.border} bg-navy-light/50 backdrop-blur-sm ${accent.glow} transition duration-200 ease-out`;
                  return section.href ? (
                    <Link
                      key={section.key}
                      href={section.href}
                      className={`${cardClass} hover:bg-white/[0.04]`}
                      style={{ padding: vw(14) }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={section.key} className={cardClass} style={{ padding: vw(14) }}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
