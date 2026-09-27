"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Barlow, Permanent_Marker, Russo_One } from "next/font/google";
import { saveBarberCv, type CvPayload } from "@/lib/actions/barber-cv";

const ui = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const display = Russo_One({ subsets: ["latin"], weight: "400" });
const marker = Permanent_Marker({ subsets: ["latin"], weight: "400" });

// Years of Experience is stored as an integer; these are the approved
// UI buckets. A stored value that isn't one of them is kept as its own
// option so opening + saving never silently rewrites it.
const YEARS_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Less than 1 year" },
  { value: 1, label: "1 year" },
  { value: 2, label: "2 years" },
  { value: 3, label: "3 years" },
  { value: 4, label: "4 years" },
  { value: 5, label: "5+ years" },
  { value: 10, label: "10+ years" },
  { value: 15, label: "15+ years" },
  { value: 20, label: "20+ years" },
];
const yearsLabel = (n: number | null) =>
  n === null ? "" : YEARS_OPTIONS.find((o) => o.value === n)?.label ?? `${n} year${n === 1 ? "" : "s"}`;

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1950 + 1 }, (_, i) => THIS_YEAR - i);

// Suggestions only: Position / Role stays free text.
const ROLE_SUGGESTIONS = ["Apprentice Barber", "Junior Barber", "Barber", "Senior Barber", "Master Barber", "Stylist", "Shop Manager", "Shop Owner"];

type Keyed<T> = T & { key: string };
type Work = Keyed<CvPayload["work"][number]>;
type Qual = Keyed<CvPayload["qualifications"][number]>;
type Ach = Keyed<CvPayload["achievements"][number]>;

let seq = 0;
const k = () => `n${++seq}`;
const blankWork = (): Work => ({ key: k(), workplace: "", position: "", fromYear: null, toYear: null });
const blankQual = (): Qual => ({ key: k(), name: "", provider: "", year: null });
const blankAch = (): Ach => ({ key: k(), name: "", result: "", year: null });

type SectionId = "work" | "qual" | "ach" | "info";

export function CvView({ initial }: { initial: CvPayload }) {
  const router = useRouter();
  const [barberName, setBarberName] = useState(initial.barberName);
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [yearsExperience, setYearsExperience] = useState<number | null>(initial.yearsExperience);
  const [workLocation, setWorkLocation] = useState(initial.workLocation);
  const [additionalInfo, setAdditionalInfo] = useState(initial.additionalInfo);
  const [work, setWork] = useState<Work[]>(() => (initial.work.length ? initial.work.map((w) => ({ ...w, key: w.id ?? k() })) : [blankWork()]));
  const [quals, setQuals] = useState<Qual[]>(() => (initial.qualifications.length ? initial.qualifications.map((q) => ({ ...q, key: q.id ?? k() })) : [blankQual()]));
  const [achs, setAchs] = useState<Ach[]>(() => (initial.achievements.length ? initial.achievements.map((a) => ({ ...a, key: a.id ?? k() })) : [blankAch()]));
  const [open, setOpen] = useState<Record<SectionId, boolean>>({ work: true, qual: false, ach: false, info: false });
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const payload: CvPayload = useMemo(
    () => ({
      barberName,
      businessName,
      yearsExperience,
      workLocation,
      additionalInfo,
      work: work.map(({ key: _k, ...w }) => w),
      qualifications: quals.map(({ key: _k, ...q }) => q),
      achievements: achs.map(({ key: _k, ...a }) => a),
    }),
    [barberName, businessName, yearsExperience, workLocation, additionalInfo, work, quals, achs]
  );
  // Row ids arrive after a save; they are not user edits.
  const snapshot = JSON.stringify(payload, (key, v) => (key === "id" ? undefined : v));
  const savedRef = useRef(snapshot);
  const dirty = snapshot !== savedRef.current;

  useEffect(() => {
    if (status?.kind === "ok" && dirty) setStatus(null);
  }, [dirty, status]);

  function save() {
    setStatus(null);
    const sent = snapshot;
    startTransition(async () => {
      const r = await saveBarberCv(payload);
      if (r && "error" in r) {
        setStatus({ kind: "error", text: r.error });
        return;
      }
      savedRef.current = sent;
      setStatus({ kind: "ok", text: "Saved" });
      // Pull fresh row ids so the next save updates instead of re-inserting.
      router.refresh();
    });
  }

  // After a save, the server hands back the stored rows (with ids).
  useEffect(() => {
    const withIds = (rows: { id?: string }[]) => rows.every((r) => r.id);
    if (withIds(initial.work)) setWork((cur) => mergeIds(cur, initial.work));
    if (withIds(initial.qualifications)) setQuals((cur) => mergeIds(cur, initial.qualifications));
    if (withIds(initial.achievements)) setAchs((cur) => mergeIds(cur, initial.achievements));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const toggle = (id: SectionId) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  return (
    <div id="barber-cv-page" className={`cv-root ${ui.className}`}>
      {/* Route-scoped: hides only the shared barber <nav> on this page. */}
      <style>{`div:has(> #barber-cv-page) > nav { display: none; }`}</style>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="cvg-cp" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#19d2ff" />
            <stop offset="1" stopColor="#ff2bd1" />
          </linearGradient>
        </defs>
      </svg>

      <div className="cv-stage">
        {/* Splatter + outer frame lines, cut from the approved master. */}
        <img src="/dashboard/focus/cv-splat-left.webp" alt="" className="cv-splat cv-splat-l" />
        <img src="/dashboard/focus/cv-splat-right.webp" alt="" className="cv-splat cv-splat-r" />

        <header className="cv-head">
          <h1 className={`cv-title ${display.className}`}>
            <span className="cv-t1">PROFESSIONAL</span> <span className="cv-t2">PROFILE</span>{" "}
            <span className={`cv-t3 ${marker.className}`}>/ POLAR CV</span>
          </h1>
          <p className="cv-sub">YOUR PROFESSIONAL IDENTITY</p>
          <Link
            href="/dashboard/barber/account"
            className="cv-x"
            aria-label="Close"
            onClick={(e) => {
              if (dirty && !window.confirm("You have unsaved changes. Close without saving?")) e.preventDefault();
            }}
          >
            <Icon name="x" />
          </Link>
        </header>

        <main className="cv-sections">
          {/* PROFESSIONAL DETAILS — always open (no chevron in the master). */}
          <section className="cv-panel cv-panel-details">
            <div className="cv-panel-head">
              <span className="cv-iconbox">
                <Icon name="user" grad />
              </span>
              <h2 className={`cv-h2 ${display.className}`}>PROFESSIONAL DETAILS</h2>
            </div>
            <div className="cv-inset cv-grid cv-grid-details">
              <Field label="BARBER / STYLIST NAME" icon="user">
                <input value={barberName} onChange={(e) => setBarberName(e.target.value)} placeholder="Your name" />
              </Field>
              <Field label="BUSINESS NAME" icon="store">
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Business name" />
              </Field>
              <Field label="YEARS OF EXPERIENCE" icon="scissors" pink chevron>
                <select
                  value={yearsExperience === null ? "" : String(yearsExperience)}
                  onChange={(e) => setYearsExperience(e.target.value === "" ? null : Number(e.target.value))}
                >
                  <option value="">Select</option>
                  {yearsExperience !== null && !YEARS_OPTIONS.some((o) => o.value === yearsExperience) && (
                    <option value={yearsExperience}>{yearsLabel(yearsExperience)}</option>
                  )}
                  {YEARS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="WORK LOCATION" icon="pin" chevron>
                <input value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} placeholder="e.g. London, UK" />
              </Field>
            </div>
          </section>

          <Section id="work" title="WORK EXPERIENCE" icon="briefcase" open={open.work} onToggle={toggle}>
            {work.map((w, i) => (
              <RecordCard
                key={w.key}
                tab={`WORKPLACE ${i + 1}`}
                deleteLabel={`Delete workplace ${i + 1}`}
                onDelete={() => setWork((rows) => rows.filter((r) => r.key !== w.key))}
                cols="cv-grid-work"
              >
                <Field label="WHERE DID YOU WORK?" icon="building">
                  <input value={w.workplace} onChange={(e) => setWork(patch<Work>(w.key, { workplace: e.target.value }))} placeholder="Shop / salon name" />
                </Field>
                <Field label="POSITION / ROLE" icon="users" chevron>
                  <input list="cv-roles" value={w.position} onChange={(e) => setWork(patch<Work>(w.key, { position: e.target.value }))} placeholder="e.g. Senior Barber" />
                </Field>
                <Field label="FROM (YEAR)" icon="calendar" chevron>
                  <select value={w.fromYear ?? ""} onChange={(e) => setWork(patch<Work>(w.key, { fromYear: e.target.value ? Number(e.target.value) : null }))}>
                    <option value="">Select</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="TO (YEAR)" icon="calendar" chevron>
                  <select value={w.toYear ?? ""} onChange={(e) => setWork(patch<Work>(w.key, { toYear: e.target.value ? Number(e.target.value) : null }))}>
                    <option value="">Present</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
              </RecordCard>
            ))}
            <AddRow label={work.length ? "ADD ANOTHER WORKPLACE" : "ADD A WORKPLACE"} onClick={() => setWork((rows) => [...rows, blankWork()])} />
          </Section>

          <Section id="qual" title="QUALIFICATIONS & CERTIFICATIONS" icon="cap" open={open.qual} onToggle={toggle}>
            {quals.map((q, i) => (
              <RecordCard
                key={q.key}
                tab={`QUALIFICATION ${i + 1}`}
                deleteLabel={`Delete qualification ${i + 1}`}
                onDelete={() => setQuals((rows) => rows.filter((r) => r.key !== q.key))}
                cols="cv-grid-3"
              >
                <Field label="QUALIFICATION / CERTIFICATE NAME" icon="cap">
                  <input value={q.name} onChange={(e) => setQuals(patch<Qual>(q.key, { name: e.target.value }))} placeholder="e.g. NVQ Level 3 Barbering" />
                </Field>
                <Field label="AWARDING BODY / PROVIDER" icon="store">
                  <input value={q.provider} onChange={(e) => setQuals(patch<Qual>(q.key, { provider: e.target.value }))} placeholder="e.g. City & Guilds" />
                </Field>
                <Field label="YEAR" icon="calendar" chevron>
                  <YearSelect value={q.year} onChange={(y) => setQuals(patch<Qual>(q.key, { year: y }))} />
                </Field>
              </RecordCard>
            ))}
            <AddRow label={quals.length ? "ADD ANOTHER QUALIFICATION" : "ADD A QUALIFICATION"} onClick={() => setQuals((rows) => [...rows, blankQual()])} />
          </Section>

          <Section id="ach" title="ACHIEVEMENTS & COMPETITIONS" icon="trophy" pink open={open.ach} onToggle={toggle}>
            {achs.map((a, i) => (
              <RecordCard
                key={a.key}
                tab={`ACHIEVEMENT ${i + 1}`}
                deleteLabel={`Delete achievement ${i + 1}`}
                onDelete={() => setAchs((rows) => rows.filter((r) => r.key !== a.key))}
                cols="cv-grid-3"
              >
                <Field label="ACHIEVEMENT / COMPETITION NAME" icon="trophy">
                  <input value={a.name} onChange={(e) => setAchs(patch<Ach>(a.key, { name: e.target.value }))} placeholder="e.g. UK Barber Awards" />
                </Field>
                <Field label="RESULT / PLACEMENT" icon="medal">
                  <input value={a.result} onChange={(e) => setAchs(patch<Ach>(a.key, { result: e.target.value }))} placeholder="e.g. Finalist, 1st Place" />
                </Field>
                <Field label="YEAR" icon="calendar" chevron>
                  <YearSelect value={a.year} onChange={(y) => setAchs(patch<Ach>(a.key, { year: y }))} />
                </Field>
              </RecordCard>
            ))}
            <AddRow label={achs.length ? "ADD ANOTHER ACHIEVEMENT" : "ADD AN ACHIEVEMENT"} onClick={() => setAchs((rows) => [...rows, blankAch()])} />
          </Section>

          <Section id="info" title="ADDITIONAL INFORMATION" icon="doc" open={open.info} onToggle={toggle}>
            <label className="cv-textarea">
              <span className="cv-label">ANYTHING ELSE YOU&apos;D LIKE ON YOUR CV (OPTIONAL)</span>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={4}
                placeholder="Specialisms, languages, training you deliver, anything else…"
              />
            </label>
          </Section>
        </main>

        <footer className="cv-foot">
          <button type="button" className="cv-preview-btn" onClick={() => setPreview(true)}>
            <Icon name="eye" />
            Preview CV
          </button>
          {status && (
            <p className={`cv-status ${status.kind === "error" ? "is-error" : ""}`} role="status">
              {status.text}
            </p>
          )}
          <button type="button" className="cv-save-btn" onClick={save} disabled={pending}>
            <Icon name="save" />
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </footer>
      </div>

      <datalist id="cv-roles">
        {ROLE_SUGGESTIONS.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>

      {preview && <CvPreview data={payload} onClose={() => setPreview(false)} />}
    </div>
  );
}

function mergeIds<T extends { key: string; id?: string }>(cur: T[], stored: { id?: string }[]): T[] {
  // Rows are saved in on-screen order (blank rows dropped), so pair the
  // non-blank on-screen rows with the stored rows positionally.
  if (!cur.length) return cur;
  const next = [...cur];
  let j = 0;
  for (let i = 0; i < next.length && j < stored.length; i++) {
    if (isBlank(next[i])) continue;
    if (!next[i].id) next[i] = { ...next[i], id: stored[j].id };
    j++;
  }
  return next;
}
function isBlank(r: object) {
  return Object.entries(r).every(([key, v]) => key === "key" || key === "id" || v === "" || v === null);
}
function patch<T extends { key: string }>(key: string, change: Partial<T>) {
  return (rows: T[]) => rows.map((r) => (r.key === key ? { ...r, ...change } : r));
}

/* ------------------------------------------------------------------ */

function Section({
  id,
  title,
  icon,
  open,
  onToggle,
  pink,
  children,
}: {
  id: SectionId;
  title: string;
  icon: IconName;
  open: boolean;
  onToggle: (id: SectionId) => void;
  pink?: boolean;
  children: React.ReactNode;
}) {
  const bodyId = `cv-body-${id}`;
  return (
    <section className={`cv-panel ${pink ? "cv-panel-pink" : ""} ${open ? "is-open" : "is-closed"}`}>
      <div className="cv-panel-head">
        <span className={open ? "cv-iconbox" : "cv-iconbare"}>
          <Icon name={icon} grad={!pink} pink={pink} />
        </span>
        <h2 className={`cv-h2 ${display.className}`}>{title}</h2>
        <button type="button" className="cv-chev" aria-expanded={open} aria-controls={bodyId} aria-label={`${open ? "Collapse" : "Expand"} ${title}`} onClick={() => onToggle(id)}>
          <Icon name={open ? "up" : "down"} />
        </button>
      </div>
      {open && (
        <div id={bodyId} className="cv-inset cv-body">
          {children}
        </div>
      )}
    </section>
  );
}

function RecordCard({ tab, deleteLabel, onDelete, cols, children }: { tab: string; deleteLabel: string; onDelete: () => void; cols: string; children: React.ReactNode }) {
  return (
    <div className="cv-record">
      <span className={`cv-tab ${display.className}`}>{tab}</span>
      <div className="cv-record-row">
        <div className={`cv-card cv-grid ${cols}`}>{children}</div>
        <button type="button" className="cv-trash" aria-label={deleteLabel} title={deleteLabel} onClick={onDelete}>
          <Icon name="trash" />
        </button>
      </div>
    </div>
  );
}

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="cv-add" onClick={onClick}>
      <Icon name="plus" />
      <span className={display.className}>{label}</span>
    </button>
  );
}

function Field({ label, icon, pink, chevron, children }: { label: string; icon: IconName; pink?: boolean; chevron?: boolean; children: React.ReactElement }) {
  const ref = useRef<HTMLLabelElement>(null);
  return (
    <label className="cv-field" ref={ref}>
      <span className="cv-label">{label}</span>
      <span className="cv-control">
        <span className={`cv-prefix ${pink ? "is-pink" : ""}`}>
          <Icon name={icon} pink={pink} />
        </span>
        {children}
        {chevron && (
          <span
            className="cv-caret"
            aria-hidden="true"
            onMouseDown={(e) => {
              // The caret opens the control's own picker (select or suggestion list).
              const el = ref.current?.querySelector<HTMLInputElement | HTMLSelectElement>("input, select");
              if (!el) return;
              e.preventDefault();
              el.focus();
              try {
                (el as HTMLInputElement).showPicker?.();
              } catch {}
            }}
          >
            <Icon name="down" />
          </span>
        )}
      </span>
    </label>
  );
}

function YearSelect({ value, onChange }: { value: number | null; onChange: (y: number | null) => void }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="">Select</option>
      {YEARS.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Preview CV — read-only, on-screen only (no PDF/export in V1).        */

function CvPreview({ data, onClose }: { data: CvPayload; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const work = data.work.filter((w) => w.workplace.trim());
  const quals = data.qualifications.filter((q) => q.name.trim());
  const achs = data.achievements.filter((a) => a.name.trim());
  const facts = [
    data.businessName.trim() && { icon: "store" as const, text: data.businessName.trim() },
    data.yearsExperience !== null && { icon: "scissors" as const, text: `${yearsLabel(data.yearsExperience)} experience` },
    data.workLocation.trim() && { icon: "pin" as const, text: data.workLocation.trim() },
  ].filter(Boolean) as { icon: IconName; text: string }[];
  const nothing = !work.length && !quals.length && !achs.length && !data.additionalInfo.trim();

  return (
    <div className="cv-modal" onClick={onClose}>
      <article role="dialog" aria-modal="true" aria-labelledby="cv-preview-name" className="cv-paper" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="cv-x cv-paper-x" aria-label="Close preview" onClick={onClose}>
          <Icon name="x" />
        </button>
        <p className="cv-paper-kicker">
          <span className={marker.className}>POLAR CV</span> · PREVIEW
        </p>
        <h2 id="cv-preview-name" className={`cv-paper-name ${display.className}`}>
          {data.barberName.trim() || "Your name"}
        </h2>
        {facts.length > 0 && (
          <ul className="cv-paper-facts">
            {facts.map((f) => (
              <li key={f.text}>
                <Icon name={f.icon} pink={f.icon === "scissors"} />
                {f.text}
              </li>
            ))}
          </ul>
        )}

        {work.length > 0 && (
          <PreviewBlock title="WORK EXPERIENCE" icon="briefcase">
            {work.map((w, i) => (
              <li key={i}>
                <div className="cv-paper-row">
                  <strong>{w.position.trim() || "—"}</strong>
                  <span className="cv-paper-when">{w.fromYear || w.toYear ? `${w.fromYear ?? "?"} – ${w.toYear ?? "Present"}` : ""}</span>
                </div>
                <span className="cv-paper-sub">{w.workplace.trim()}</span>
              </li>
            ))}
          </PreviewBlock>
        )}
        {quals.length > 0 && (
          <PreviewBlock title="QUALIFICATIONS & CERTIFICATIONS" icon="cap">
            {quals.map((q, i) => (
              <li key={i}>
                <div className="cv-paper-row">
                  <strong>{q.name.trim()}</strong>
                  <span className="cv-paper-when">{q.year ?? ""}</span>
                </div>
                {q.provider.trim() && <span className="cv-paper-sub">{q.provider.trim()}</span>}
              </li>
            ))}
          </PreviewBlock>
        )}
        {achs.length > 0 && (
          <PreviewBlock title="ACHIEVEMENTS & COMPETITIONS" icon="trophy" pink>
            {achs.map((a, i) => (
              <li key={i}>
                <div className="cv-paper-row">
                  <strong>{a.name.trim()}</strong>
                  <span className="cv-paper-when">{a.year ?? ""}</span>
                </div>
                {a.result.trim() && <span className="cv-paper-sub">{a.result.trim()}</span>}
              </li>
            ))}
          </PreviewBlock>
        )}
        {data.additionalInfo.trim() && (
          <PreviewBlock title="ADDITIONAL INFORMATION" icon="doc">
            <li>
              <p className="cv-paper-text">{data.additionalInfo.trim()}</p>
            </li>
          </PreviewBlock>
        )}
        {nothing && <p className="cv-paper-empty">Add your work experience, qualifications and achievements to build your POLAR CV.</p>}
        <p className="cv-paper-note">Only you can see your POLAR CV.</p>
      </article>
    </div>
  );
}

function PreviewBlock({ title, icon, pink, children }: { title: string; icon: IconName; pink?: boolean; children: React.ReactNode }) {
  return (
    <section className="cv-paper-block">
      <h3 className={display.className}>
        <Icon name={icon} grad={!pink} pink={pink} />
        {title}
      </h3>
      <ul>{children}</ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */

type IconName =
  | "user" | "store" | "scissors" | "pin" | "briefcase" | "building" | "users" | "calendar" | "trash" | "plus"
  | "down" | "up" | "cap" | "trophy" | "medal" | "doc" | "eye" | "save" | "x";

const PATHS: Record<IconName, React.ReactNode> = {
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>),
  store: (<><path d="M4 10v10h16V10" /><path d="M3 10l2-6h14l2 6" /><path d="M3 10a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0" /><path d="M9 20v-5h6v5" /></>),
  scissors: (<><circle cx="6" cy="18" r="3" /><circle cx="18" cy="18" r="3" /><path d="M8 16L19 3M16 16L5 3" /></>),
  pin: (<><path d="M12 22s7-7.2 7-12.5A7 7 0 005 9.5C5 14.8 12 22 12 22z" /><circle cx="12" cy="9.5" r="2.6" /></>),
  briefcase: (<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M3 12.5h18" /><rect x="10.5" y="11" width="3" height="3" rx=".6" /></>),
  building: (<><path d="M4 21V4h10v17" /><path d="M14 9h6v12" /><path d="M2 21h20" /><path d="M7 7.5h1M10 7.5h1M7 11h1M10 11h1M7 14.5h1M10 14.5h1M17 13h.5M17 16.5h.5" /><path d="M8 21v-3h2v3" /></>),
  users: (<><circle cx="12" cy="8" r="3" /><circle cx="5.5" cy="10" r="2.2" /><circle cx="18.5" cy="10" r="2.2" /><path d="M6.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5z" /><path d="M1.5 19c0-2.4 1.6-4 4-4 .8 0 1.5.2 2 .5M22.5 19c0-2.4-1.6-4-4-4-.8 0-1.5.2-2 .5" /></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="M7 13.5h2M11 13.5h2M15 13.5h2M7 17h2M11 17h2M15 17h2" /></>),
  trash: (<><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></>),
  plus: (<><circle cx="12" cy="12" r="9.5" /><path d="M12 7.5v9M7.5 12h9" /></>),
  down: <path d="M6 9l6 6 6-6" />,
  up: <path d="M6 15l6-6 6 6" />,
  cap: (<><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" /><path d="M22 9v6" /></>),
  trophy: (<><path d="M7 4h10v5a5 5 0 01-10 0z" /><path d="M7 6H3.5v1.5A3.5 3.5 0 007 11M17 6h3.5v1.5A3.5 3.5 0 0117 11" /><path d="M12 14v3M8 21h8M9 21v-2.5h6V21" /><path d="M12 6.3l.8 1.6 1.7.2-1.3 1.2.3 1.7-1.5-.8-1.5.8.3-1.7-1.3-1.2 1.7-.2z" /></>),
  medal: (<><circle cx="12" cy="15" r="5.5" /><path d="M8.5 10.5L6 3h4l2 5 2-5h4l-2.5 7.5" /><path d="M12 12.5v5" /></>),
  doc: (<><path d="M6 2.5h8l5 5V21a.5.5 0 01-.5.5h-12A.5.5 0 016 21z" /><path d="M14 2.5V8h5" /><path d="M9 12h7M9 15.5h7M9 19h4" /></>),
  eye: (<><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3.2" /></>),
  save: (<><path d="M4 3h13l4 4v14H4z" fill="currentColor" stroke="none" /><rect x="7.5" y="3" width="8" height="5.5" rx=".5" fill="#fff" stroke="none" /><rect x="12.2" y="4" width="2" height="3.5" fill="currentColor" stroke="none" /><rect x="7" y="12.5" width="10" height="6.5" rx=".6" fill="#fff" stroke="none" /></>),
  x: <path d="M5 5l14 14M19 5L5 19" />,
};

function Icon({ name, grad, pink }: { name: IconName; grad?: boolean; pink?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`cv-icon cv-icon-${name}`} fill="none" stroke={grad ? "url(#cvg-cp)" : pink ? "#ff2bd1" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Measurements are the master's native px (1672 × 941) × --u.         */

const CSS = `
.cv-root {
  --u: max(min(calc(100vw / 1672), calc(100vh / 941)), 0.62px);
  --cy: #19d2ff; --pk: #ff2bd1; --line: #123b5c;
  min-height: 100vh; min-height: 100dvh; color: #fff; overflow-x: hidden;
  background: radial-gradient(ellipse 70% 60% at 50% 0%, #02152c 0%, rgba(2,21,44,0) 70%), linear-gradient(90deg, #000f2b 0%, #010e1e 50%, #00091c 100%);
}
.cv-root *, .cv-root *::before, .cv-root *::after { box-sizing: border-box; }
.cv-stage { position: relative; width: 100%; min-height: calc(var(--u) * 941); margin: 0 auto; padding: 0 calc(var(--u) * 45) calc(var(--u) * 14); }
.cv-splat { position: absolute; top: 0; height: calc(var(--u) * 941); pointer-events: none; user-select: none; }
.cv-splat-l { left: 0; width: calc(var(--u) * 405); }
.cv-splat-r { right: 0; width: calc(var(--u) * 397); }

.cv-head { position: relative; height: calc(var(--u) * 124); text-align: center; }
.cv-title { margin: 0; padding-top: calc(var(--u) * 26); font-size: calc(var(--u) * 42); line-height: 1; letter-spacing: calc(var(--u) * 0.5); white-space: nowrap; font-weight: 400; }
.cv-t1 { color: #fdfcfb; }
.cv-t2 { background: linear-gradient(180deg, #ffffff 30%, #cfe0ff 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.cv-t3 { display: inline-block; margin-left: calc(var(--u) * 4); font-size: calc(var(--u) * 52); line-height: .8; color: var(--pk); transform: skewX(-10deg) translateY(calc(var(--u) * 2)); text-shadow: 0 0 calc(var(--u) * 16) rgba(255,43,209,.55); }
.cv-sub { margin: calc(var(--u) * 16) 0 0; padding-left: calc(var(--u) * 13); font-size: calc(var(--u) * 16); font-weight: 500; letter-spacing: calc(var(--u) * 13.4); color: #e6e7ee; line-height: 1; }
.cv-x { position: absolute; top: calc(var(--u) * 18); right: calc(var(--u) * -25); display: grid; place-items: center; width: calc(var(--u) * 52); height: calc(var(--u) * 52); border: calc(var(--u) * 2) solid #bfeaff; border-radius: calc(var(--u) * 7); color: #fff; background: rgba(1,9,22,.7); box-shadow: 0 0 calc(var(--u) * 12) rgba(25,210,255,.55), inset 0 0 calc(var(--u) * 8) rgba(25,210,255,.25); transition: filter .15s; cursor: pointer; }
.cv-x:hover { filter: brightness(1.25); }
.cv-x .cv-icon { width: calc(var(--u) * 28); height: calc(var(--u) * 28); stroke-width: 3.2; }

.cv-sections { position: relative; display: flex; flex-direction: column; gap: calc(var(--u) * 12); }
.cv-sections > .cv-panel-details { margin-bottom: calc(var(--u) * 11); }
.cv-panel.is-closed .cv-h2 { font-size: calc(var(--u) * 22.5); }
.cv-panel {
  position: relative; border-radius: calc(var(--u) * 14); border: calc(var(--u) * 2.5) solid transparent;
  background: linear-gradient(180deg, rgba(3,14,30,.96), rgba(1,9,22,.97)) padding-box,
    linear-gradient(90deg, #00e8ff 0%, #01b4d8 25%, #0470a8 70%, #5a2fb8 86%, #f50ae8 100%) border-box;
  box-shadow: calc(var(--u) * -3) 0 calc(var(--u) * 14) calc(var(--u) * -3) rgba(0,220,255,.6), calc(var(--u) * 3) 0 calc(var(--u) * 14) calc(var(--u) * -3) rgba(245,10,232,.6);
}
.cv-panel.is-open { background: linear-gradient(180deg, rgba(3,14,30,.96), rgba(1,9,22,.97)) padding-box, linear-gradient(90deg, #00f0ff 0%, #01b4d8 30%, #057dbc 72%, #7a2fc8 88%, #ea09d7 100%) border-box; }
.cv-panel-pink { background: linear-gradient(180deg, rgba(3,14,30,.96), rgba(1,9,22,.97)) padding-box, linear-gradient(90deg, #fa0af3 0%, #a0189c 12%, #044b7d 30%, #054e80 70%, #7a1c9e 88%, #f90dec 100%) border-box; box-shadow: calc(var(--u) * -3) 0 calc(var(--u) * 14) calc(var(--u) * -3) rgba(250,10,243,.6), calc(var(--u) * 3) 0 calc(var(--u) * 14) calc(var(--u) * -3) rgba(245,10,232,.6); }
.cv-panel-head { display: flex; align-items: center; gap: calc(var(--u) * 16); height: calc(var(--u) * 55); padding: 0 calc(var(--u) * 22) 0 calc(var(--u) * 26); }
.cv-panel.is-open .cv-panel-head, .cv-panel-details .cv-panel-head { height: calc(var(--u) * 76); padding-left: calc(var(--u) * 16); }
.cv-iconbox { display: grid; place-items: center; width: calc(var(--u) * 79); height: calc(var(--u) * 64); flex: none; border-radius: calc(var(--u) * 10); border: calc(var(--u) * 2) solid transparent; background: linear-gradient(#051428, #041022) padding-box, linear-gradient(135deg, #7a5cff, #19d2ff 45%, #ff2bd1) border-box; box-shadow: 0 0 calc(var(--u) * 10) rgba(122,92,255,.35); }
.cv-panel:not(.cv-panel-details) .cv-iconbox { border-color: var(--line); background: #041022; box-shadow: none; }
.cv-iconbox .cv-icon { width: calc(var(--u) * 44); height: calc(var(--u) * 44); stroke-width: 1.7; }
.cv-iconbare { display: grid; place-items: center; width: calc(var(--u) * 70); height: calc(var(--u) * 55); flex: none; border-right: 1px solid rgba(18,59,92,.8); margin-right: calc(var(--u) * 0); padding-right: calc(var(--u) * 6); }
.cv-iconbare .cv-icon { width: calc(var(--u) * 46); height: calc(var(--u) * 46); stroke-width: 1.7; }
.cv-h2 { margin: 0; flex: 1; font-size: calc(var(--u) * 27); line-height: 1; font-weight: 400; letter-spacing: calc(var(--u) * 0.6); color: #fff; }
.cv-chev { display: grid; place-items: center; width: calc(var(--u) * 44); height: calc(var(--u) * 44); flex: none; border-radius: calc(var(--u) * 7); border: calc(var(--u) * 2) solid #00d6f7; background: rgba(1,9,22,.6); color: #fff; box-shadow: 0 0 calc(var(--u) * 8) rgba(0,214,247,.45); cursor: pointer; transition: filter .15s; }
.cv-chev:hover { filter: brightness(1.3); }
.cv-chev .cv-icon { width: calc(var(--u) * 26); height: calc(var(--u) * 26); stroke-width: 2.8; }

.cv-inset { margin: 0 calc(var(--u) * 17) calc(var(--u) * 14); border-top: 1px solid rgba(18,59,92,.9); }
.cv-panel-details .cv-inset { border: 1px solid rgba(18,59,92,.9); border-radius: calc(var(--u) * 8); background: rgba(1,8,20,.55); padding: calc(var(--u) * 11) calc(var(--u) * 17) calc(var(--u) * 10); }
.cv-body { padding-top: calc(var(--u) * 11); }
.cv-grid { display: grid; column-gap: calc(var(--u) * 34); row-gap: calc(var(--u) * 14); }
.cv-grid-details { grid-template-columns: 358fr 362fr 328fr 355fr; }
.cv-grid-work { grid-template-columns: 414fr 350fr 305fr 262fr; }
.cv-grid-3 { grid-template-columns: 520fr 460fr 305fr; }

.cv-field { display: flex; flex-direction: column; min-width: 0; }
.cv-label { display: block; margin-bottom: calc(var(--u) * 8); font-size: calc(var(--u) * 17); line-height: 1.1; font-weight: 600; letter-spacing: calc(var(--u) * 0.5); color: #fff; }
.cv-control { position: relative; display: flex; height: calc(var(--u) * 54); border: 1px solid var(--line); border-radius: calc(var(--u) * 6); background: #061423; overflow: hidden; transition: border-color .15s, box-shadow .15s; }
.cv-control:focus-within { border-color: var(--cy); box-shadow: 0 0 calc(var(--u) * 10) rgba(25,210,255,.35); }
.cv-prefix { display: grid; place-items: center; width: calc(var(--u) * 65); flex: none; border-right: 1px solid #0c2741; background: #041020; color: var(--cy); }
.cv-prefix .cv-icon { width: calc(var(--u) * 34); height: calc(var(--u) * 34); }
.cv-prefix.is-pink { border: calc(var(--u) * 1.5) solid #ff2bd1; border-radius: calc(var(--u) * 6) 0 0 calc(var(--u) * 6); box-shadow: inset 0 0 calc(var(--u) * 8) rgba(255,43,209,.35); }
.cv-control input, .cv-control select { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: #fff; font: inherit; font-size: calc(var(--u) * 17); font-weight: 500; padding: 0 calc(var(--u) * 20); appearance: none; -webkit-appearance: none; }
.cv-control input::-webkit-calendar-picker-indicator { display: none !important; }
.cv-control input::placeholder { color: rgba(255,255,255,.35); }
.cv-control select { cursor: pointer; padding-right: calc(var(--u) * 56); }
.cv-control select option { background: #061423; color: #fff; }
.cv-control:has(.cv-caret) input { padding-right: calc(var(--u) * 56); }
.cv-caret { position: absolute; right: calc(var(--u) * 14); top: 50%; transform: translateY(-50%); display: grid; place-items: center; color: #fff; cursor: pointer; }
.cv-caret .cv-icon { width: calc(var(--u) * 24); height: calc(var(--u) * 24); stroke-width: 2.8; }

.cv-record { position: relative; margin: 0 0 calc(var(--u) * 2) calc(var(--u) * 13); }
.cv-record + .cv-record { margin-top: calc(var(--u) * 12); }
.cv-tab { position: relative; display: inline-flex; align-items: center; height: calc(var(--u) * 30); padding: 0 calc(var(--u) * 44) 0 calc(var(--u) * 44); font-size: calc(var(--u) * 16); letter-spacing: calc(var(--u) * 0.6); color: #fff; background: linear-gradient(90deg, #01386b, #014781); border: 1px solid #0f6fb3; border-bottom: 0; border-radius: calc(var(--u) * 8) 0 0 0; clip-path: polygon(0 0, calc(100% - calc(var(--u) * 16)) 0, 100% 100%, 0 100%); }
.cv-record-row { display: flex; align-items: flex-start; gap: calc(var(--u) * 8); }
.cv-card { flex: 1; min-width: 0; margin-top: -1px; padding: calc(var(--u) * 14) calc(var(--u) * 17) calc(var(--u) * 13) calc(var(--u) * 22); border: 1px solid #0d4f83; border-radius: 0 calc(var(--u) * 8) calc(var(--u) * 8) calc(var(--u) * 8); background: rgba(1,10,24,.7); }
.cv-trash { display: grid; place-items: center; width: calc(var(--u) * 44); height: calc(var(--u) * 44); flex: none; margin-top: calc(var(--u) * 2); border-radius: calc(var(--u) * 7); border: calc(var(--u) * 2) solid #b60089; background: rgba(40,0,30,.35); color: var(--pk); box-shadow: 0 0 calc(var(--u) * 8) rgba(255,43,209,.35); cursor: pointer; transition: filter .15s; }
.cv-trash:hover { filter: brightness(1.35); }
.cv-trash .cv-icon { width: calc(var(--u) * 24); height: calc(var(--u) * 24); stroke-width: 2; }
.cv-add { display: flex; align-items: center; justify-content: center; gap: calc(var(--u) * 14); width: calc(100% - var(--u) * 21); margin: calc(var(--u) * 4) 0 0 calc(var(--u) * 13); height: calc(var(--u) * 53); border: calc(var(--u) * 1.5) dashed #0aa3c9; border-radius: calc(var(--u) * 6); background: rgba(0,40,60,.12); color: #01ffff; font-size: calc(var(--u) * 18); letter-spacing: calc(var(--u) * 0.4); cursor: pointer; transition: background .15s; }
.cv-add:hover { background: rgba(0,200,255,.08); }
.cv-add .cv-icon { width: calc(var(--u) * 34); height: calc(var(--u) * 34); stroke-width: 1.6; }
.cv-body > .cv-add:first-child { margin-top: 0; }

.cv-textarea { display: block; padding-bottom: calc(var(--u) * 4); }
.cv-textarea textarea { display: block; width: 100%; min-height: calc(var(--u) * 120); resize: vertical; border: 1px solid var(--line); border-radius: calc(var(--u) * 6); background: #061423; color: #fff; font: inherit; font-size: calc(var(--u) * 17); line-height: 1.45; padding: calc(var(--u) * 14) calc(var(--u) * 18); outline: 0; }
.cv-textarea textarea:focus { border-color: var(--cy); box-shadow: 0 0 calc(var(--u) * 10) rgba(25,210,255,.35); }
.cv-textarea textarea::placeholder { color: rgba(255,255,255,.35); }

.cv-foot { position: relative; display: flex; align-items: center; gap: calc(var(--u) * 20); margin-top: calc(var(--u) * 10); margin-left: calc(var(--u) * -2); }
.cv-preview-btn { display: flex; align-items: center; gap: calc(var(--u) * 20); height: calc(var(--u) * 52); width: calc(var(--u) * 290); padding-left: calc(var(--u) * 66); border-radius: calc(var(--u) * 7); border: calc(var(--u) * 2) solid #d408b9; background: linear-gradient(180deg, rgba(40,2,40,.55), rgba(10,2,20,.7)); color: #fff; font: inherit; font-size: calc(var(--u) * 21); font-weight: 600; box-shadow: 0 0 calc(var(--u) * 12) rgba(212,8,185,.45); cursor: pointer; transition: filter .15s; }
.cv-preview-btn:hover { filter: brightness(1.2); }
.cv-preview-btn .cv-icon { width: calc(var(--u) * 34); height: calc(var(--u) * 34); stroke-width: 1.9; }
.cv-status { margin: 0 0 0 auto; font-size: calc(var(--u) * 17); font-weight: 600; color: #3ee6a8; }
.cv-status.is-error { color: #ff6b8b; max-width: calc(var(--u) * 700); text-align: right; }
.cv-save-btn { display: flex; align-items: center; justify-content: center; gap: calc(var(--u) * 22); height: calc(var(--u) * 56); width: calc(var(--u) * 408); margin-left: auto; border: 0; border-radius: calc(var(--u) * 7); background: linear-gradient(90deg, #00dcfd 0%, #01aafd 25%, #5f67fd 50%, #df28fc 76%, #fe20fd 100%); color: #0a1128; font: inherit; font-size: calc(var(--u) * 22); font-weight: 700; box-shadow: calc(var(--u) * -4) 0 calc(var(--u) * 16) rgba(0,220,253,.45), calc(var(--u) * 4) 0 calc(var(--u) * 16) rgba(254,32,253,.45); cursor: pointer; transition: filter .15s; }
.cv-status + .cv-save-btn { margin-left: 0; }
.cv-save-btn:hover { filter: brightness(1.1); }
.cv-save-btn:disabled { opacity: .7; cursor: progress; }
.cv-save-btn .cv-icon { width: calc(var(--u) * 32); height: calc(var(--u) * 32); color: #0a1128; }

.cv-root button:focus-visible, .cv-root a:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

/* Preview CV */
.cv-modal { position: fixed; inset: 0; z-index: 60; display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: calc(var(--u) * 40) 16px; background: rgba(0,4,12,.8); backdrop-filter: blur(4px); }
.cv-paper { position: relative; width: min(calc(var(--u) * 900), 100%); padding: calc(var(--u) * 44) calc(var(--u) * 54) calc(var(--u) * 36); border-radius: calc(var(--u) * 16); border: calc(var(--u) * 2.5) solid transparent; background: linear-gradient(180deg, #041229, #010916) padding-box, linear-gradient(90deg, #00e8ff, #0470a8 60%, #f50ae8) border-box; box-shadow: calc(var(--u) * -4) 0 calc(var(--u) * 24) rgba(0,220,255,.35), calc(var(--u) * 4) 0 calc(var(--u) * 24) rgba(245,10,232,.35); }
.cv-paper-x { top: calc(var(--u) * 18); right: calc(var(--u) * 18); width: calc(var(--u) * 44); height: calc(var(--u) * 44); }
.cv-paper-x .cv-icon { width: calc(var(--u) * 22); height: calc(var(--u) * 22); }
.cv-paper-kicker { margin: 0; font-size: calc(var(--u) * 15); letter-spacing: calc(var(--u) * 5); color: #9fb3cc; font-weight: 600; }
.cv-paper-kicker span { color: var(--pk); letter-spacing: calc(var(--u) * 1); font-size: calc(var(--u) * 20); }
.cv-paper-name { margin: calc(var(--u) * 10) 0 0; font-size: calc(var(--u) * 46); line-height: 1.05; font-weight: 400; overflow-wrap: anywhere; }
.cv-paper-facts { display: flex; flex-wrap: wrap; gap: calc(var(--u) * 10) calc(var(--u) * 28); margin: calc(var(--u) * 16) 0 0; padding: 0; list-style: none; font-size: calc(var(--u) * 18); font-weight: 500; color: #dfe8f5; }
.cv-paper-facts li { display: flex; align-items: center; gap: calc(var(--u) * 10); }
.cv-paper-facts .cv-icon { width: calc(var(--u) * 24); height: calc(var(--u) * 24); color: var(--cy); }
.cv-paper-block { margin-top: calc(var(--u) * 30); padding-top: calc(var(--u) * 22); border-top: 1px solid rgba(18,59,92,.9); }
.cv-paper-block h3 { display: flex; align-items: center; gap: calc(var(--u) * 14); margin: 0 0 calc(var(--u) * 14); font-size: calc(var(--u) * 21); font-weight: 400; letter-spacing: calc(var(--u) * 0.6); }
.cv-paper-block h3 .cv-icon { width: calc(var(--u) * 32); height: calc(var(--u) * 32); }
.cv-paper-block ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: calc(var(--u) * 14); }
.cv-paper-block li { padding-left: calc(var(--u) * 46); }
.cv-paper-row { display: flex; justify-content: space-between; gap: calc(var(--u) * 20); font-size: calc(var(--u) * 19); }
.cv-paper-row strong { font-weight: 600; overflow-wrap: anywhere; }
.cv-paper-when { flex: none; color: var(--cy); font-weight: 600; font-variant-numeric: tabular-nums; }
.cv-paper-sub { display: block; margin-top: calc(var(--u) * 3); font-size: calc(var(--u) * 17); color: #a9b8cc; overflow-wrap: anywhere; }
.cv-paper-text { margin: 0; font-size: calc(var(--u) * 18); line-height: 1.5; color: #dfe8f5; white-space: pre-line; overflow-wrap: anywhere; }
.cv-paper-empty { margin: calc(var(--u) * 30) 0 0; font-size: calc(var(--u) * 18); color: #a9b8cc; }
.cv-paper-note { margin: calc(var(--u) * 30) 0 0; font-size: calc(var(--u) * 14); color: #6f829c; }

@media (prefers-reduced-motion: reduce) { .cv-root * { transition: none !important; } }

/* Narrow screens: same components, stacked. */
@media (max-width: 900px) {
  .cv-root { --u: 0.62px; }
  .cv-stage { width: 100%; padding: 0 16px 24px; }
  .cv-splat { display: none; }
  .cv-title { white-space: normal; padding: 18px 56px 0; font-size: 30px; }
  .cv-t3 { font-size: 34px; }
  .cv-sub { font-size: 11px; letter-spacing: 5px; }
  .cv-x { right: 0; }
  .cv-head { height: auto; padding-bottom: 18px; }
  .cv-grid-details, .cv-grid-work, .cv-grid-3 { grid-template-columns: 1fr; }
  .cv-h2 { font-size: 18px; }
  .cv-label, .cv-control input, .cv-control select, .cv-textarea textarea { font-size: 15px; }
  .cv-control { height: 46px; }
  .cv-panel-head { height: auto !important; min-height: 56px; padding: 8px 12px !important; }
  .cv-iconbox { width: 52px; height: 44px; }
  .cv-iconbox .cv-icon, .cv-iconbare .cv-icon { width: 28px; height: 28px; }
  .cv-chev, .cv-trash { width: 40px; height: 40px; }
  .cv-inset { margin: 0 10px 12px; }
  .cv-record { margin-left: 0; }
  .cv-add { width: 100%; margin-left: 0; font-size: 13px; height: 46px; }
  .cv-foot { flex-wrap: wrap; }
  .cv-preview-btn, .cv-save-btn { width: 100%; height: 48px; font-size: 17px; justify-content: center; padding: 0; }
  .cv-status { order: 3; width: 100%; text-align: left; margin: 0; font-size: 15px; }
  .cv-paper-name { font-size: 30px; }
  .cv-paper-block h3 { font-size: 16px; }
  .cv-paper-row, .cv-paper-text { font-size: 15px; }
  .cv-paper-sub, .cv-paper-facts { font-size: 14px; }
  .cv-paper { padding: 28px 20px; }
  .cv-paper-block li { padding-left: 0; }
}
`;
