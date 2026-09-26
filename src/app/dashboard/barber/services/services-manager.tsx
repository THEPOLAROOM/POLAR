"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Barlow, Permanent_Marker } from "next/font/google";
import {
  saveService,
  deleteService,
  reorderService,
  uploadServiceImage,
  deleteServiceImage,
  setCoverImage,
} from "@/lib/actions/services";
import { FocusModeShell, ACCENTS, type FrameSplatter } from "@/components/focus-mode/focus-mode-shell";
import { BarberRoom } from "../dashboard-scene";

export type ServiceImage = { id: string; url: string; isCover: boolean };
export type ServiceWithImages = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description: string;
  notes: string;
  isActive: boolean;
  displayOrder: number;
  images: ServiceImage[];
};

// My Services Focus Mode (desktop), built to the approved pink MY
// SERVICES design as real HTML inside the shared FocusModeShell over the
// darkened POLAR Room — this replaces the previous flat mastered-image
// UI (and its permanent side-by-side Add Service form) entirely. The
// main screen is a clean directory; adding/editing/deleting happens in
// the service dialog. All data and actions are the existing ones.
const PINK = ACCENTS.magenta;
const BLUE = ACCENTS.blue;
const ROW_LINE = "rgba(255,255,255,0.07)";

const graffiti = Permanent_Marker({ subsets: ["latin"], weight: "400" });
const ui = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// Paint-only corner pieces shared with Calendar's frame.
const SPLATTER: FrameSplatter = {
  src: {
    tl: "/dashboard/focus/calendar-splat-tl.webp",
    tr: "/dashboard/focus/calendar-splat-tr.webp",
    bl: "/dashboard/focus/calendar-splat-bl.webp",
    br: "/dashboard/focus/calendar-splat-br.webp",
  },
  size: [240, 200],
  corner: { tl: [60, 66], tr: [181, 66], bl: [60, 122], br: [181, 122] },
  frameWidth: 1481,
};

const HOUR_OPTIONS = Array.from({ length: 7 }, (_, i) => i); // 0h..6h
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

type SortKey = "order" | "name" | "price" | "duration" | "status";

function formatDuration(totalMinutes: number): { hours: number; minutes: number } {
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}
function money(n: number): string {
  return Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`;
}
function durationLabel(totalMinutes: number): string {
  const { hours, minutes } = formatDuration(totalMinutes);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function ScissorsGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="h-14 w-14 shrink-0" fill="none" stroke={ACCENTS.magenta.hex} strokeWidth="3.6" strokeLinecap="round" aria-hidden="true" style={{ filter: `drop-shadow(0 0 6px rgba(${ACCENTS.magenta.rgb},0.8))` }}>
      <circle cx="12" cy="36" r="6" />
      <circle cx="36" cy="36" r="6" />
      <path d="M16.5 32L38 5M31.5 32L10 5" />
    </svg>
  );
}

function CrownGlyph() {
  return (
    <svg viewBox="0 0 80 64" className="h-16 w-20 shrink-0" fill="none" stroke={ACCENTS.magenta.hex} strokeWidth="5" strokeLinejoin="round" aria-hidden="true" style={{ filter: `drop-shadow(0 0 8px rgba(${ACCENTS.magenta.rgb},0.8))` }}>
      <path d="M8 16l16 16 16-26 16 26 16-16-6 30H14z" />
      <path d="M16 54c8-5 40-5 48 0" />
      <g fill={ACCENTS.magenta.hex} stroke="none">
        <circle cx="8" cy="14" r="3.5" />
        <circle cx="40" cy="4" r="3.5" />
        <circle cx="72" cy="14" r="3.5" />
      </g>
    </svg>
  );
}

function SortIcon({ dir }: { dir: "asc" | "desc" | null }) {
  return (
    <svg viewBox="0 0 12 18" className="h-4 w-3" aria-hidden="true">
      <path d="M6 1l5 6H1z" fill={ACCENTS.magenta.hex} opacity={dir === "desc" ? 0.3 : 1} />
      <path d="M6 17l5-6H1z" fill={ACCENTS.magenta.hex} opacity={dir === "asc" ? 0.3 : 1} />
    </svg>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span
      className="inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-sm font-semibold uppercase tracking-wide"
      style={{ borderColor: `rgba(${BLUE.rgb},0.65)`, background: `rgba(${BLUE.rgb},0.14)`, color: "#5aa3ff", boxShadow: `0 0 10px -3px rgba(${BLUE.rgb},0.7)` }}
    >
      <span className="h-3 w-3 rounded-full" style={{ background: "#3d95ff", boxShadow: `0 0 8px rgba(${BLUE.rgb},0.9)` }} />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-white/45">
      <span className="h-3 w-3 rounded-full bg-white/25" />
      Inactive
    </span>
  );
}

export function ServicesManager({ services }: { services: ServiceWithImages[] }) {
  // Dialog: null = closed, "new" = Add Service, otherwise a service id.
  const [dialog, setDialog] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [reorderMode, setReorderMode] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "order", dir: "asc" });
  const [pending, startTransition] = useTransition();

  // Mobile keeps its existing inline form.
  const [mobileSelectedId, setMobileSelectedId] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);

  const sorted = useMemo(() => [...services].sort((a, b) => a.displayOrder - b.displayOrder), [services]);
  const orderedIds = useMemo(() => sorted.map((s) => s.id), [sorted]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? sorted.filter((s) => s.name.toLowerCase().includes(q)) : sorted;
  }, [sorted, query]);

  // View-only column sort; Reorder always works on the saved display order.
  const visible = useMemo(() => {
    if (reorderMode || sort.key === "order") return filtered;
    const m = sort.dir === "asc" ? 1 : -1;
    const val = (s: ServiceWithImages) =>
      sort.key === "name" ? s.name.toLowerCase() : sort.key === "price" ? s.price : sort.key === "duration" ? s.durationMinutes : s.isActive ? 0 : 1;
    return [...filtered].sort((a, b) => (val(a) < val(b) ? -m : val(a) > val(b) ? m : a.displayOrder - b.displayOrder));
  }, [filtered, sort, reorderMode]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : { key: "order", dir: "asc" }));
  }

  function handleReorder(serviceId: string, direction: "up" | "down") {
    const formData = new FormData();
    formData.set("service_id", serviceId);
    formData.set("direction", direction);
    formData.set("ordered_ids", orderedIds.join(","));
    startTransition(async () => {
      await reorderService(formData);
    });
  }

  const hasAnyServices = services.length > 0;
  const dialogService = dialog && dialog !== "new" ? services.find((s) => s.id === dialog) ?? null : null;
  const mobileSelected = mobileSelectedId ? services.find((s) => s.id === mobileSelectedId) ?? null : null;
  const mobileDuration = formatDuration(mobileSelected?.durationMinutes ?? 0);

  function handleMobileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMobileError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveService(formData);
      if (result && "error" in result) setMobileError(result.error);
      else if (result && "id" in result) setMobileSelectedId(result.id);
    });
  }

  function handleMobileDelete() {
    if (!mobileSelectedId || !window.confirm("Delete this service? This cannot be undone.")) return;
    const formData = new FormData();
    formData.set("service_id", mobileSelectedId);
    startTransition(async () => {
      await deleteService(formData);
      setMobileSelectedId(null);
    });
  }

  const addButton = (
    <button
      type="button"
      onClick={() => setDialog("new")}
      className="flex h-14 shrink-0 items-center gap-5 rounded-xl border-2 px-7 text-lg font-bold uppercase tracking-wide text-white transition hover:brightness-110"
      style={{ borderColor: "#ff6fcf", background: `linear-gradient(180deg, #ff3fc0 0%, ${PINK.hex} 55%, #d10f90 100%)`, boxShadow: `0 0 18px -2px rgba(${PINK.rgb},0.85)` }}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
        <path d="M12 4v16M4 12h16" />
      </svg>
      Add Service
    </button>
  );

  const headerCell = (key: SortKey, label: string, className = "") => (
    <th scope="col" className={`py-4 text-left font-semibold ${className}`}>
      <button
        type="button"
        disabled={reorderMode}
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-3 text-lg uppercase tracking-wide text-white disabled:cursor-default"
        aria-label={`Sort by ${label.toLowerCase()}`}
      >
        {label}
        {!reorderMode && <SortIcon dir={sort.key === key ? sort.dir : null} />}
      </button>
    </th>
  );

  return (
    <div id="barber-services-page">
      {/* The shared barber nav lives in layout.tsx, which every other
          barber route still needs, so it's hidden for this page only. */}
      <style>{`
        div:has(> #barber-services-page) > nav {
          display: none;
        }
        .services-title {
          display: inline-block;
          transform: rotate(-2deg) skewX(-6deg);
          background: linear-gradient(180deg, #ffffff 0%, #fff4fb 55%, #f3c9e4 80%, #ffffff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.8)) drop-shadow(0 0 10px rgba(255, 31, 180, 0.55));
          padding: 0.05em 0.1em;
        }
        .services-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 31, 180, 0.8) transparent;
        }
      `}</style>

      {/* Mobile — the existing simple functional layout. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">My Services</h1>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services…"
          className="mt-4 w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />
        <ul className="mt-4 space-y-2">
          {filtered.map((s) => (
            <li key={s.id} className={`rounded border border-polar-border px-3 py-2 ${s.isActive ? "" : "opacity-50"}`}>
              <button type="button" onClick={() => setMobileSelectedId(s.id)} className="block w-full text-left text-sm text-polar-text">
                {s.name} — {money(s.price)} · {durationLabel(s.durationMinutes)}
              </button>
            </li>
          ))}
          {filtered.length === 0 && <p className="text-sm text-polar-muted">No services yet.</p>}
        </ul>

        <h2 className="mt-8 text-sm font-semibold text-polar-text">{mobileSelected ? "Edit Service" : "Add Service"}</h2>
        <form key={mobileSelectedId ?? "new"} onSubmit={handleMobileSave} className="mt-2 space-y-3">
          <input type="hidden" name="service_id" value={mobileSelected?.id ?? ""} />
          <input name="name" defaultValue={mobileSelected?.name ?? ""} required placeholder="Service name" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text" />
          <input name="price" type="number" step="0.01" min="0" defaultValue={mobileSelected?.price ?? ""} placeholder="Price" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text" />
          <div className="flex gap-2">
            <select name="duration_hours" defaultValue={mobileDuration.hours} className="w-1/2 rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm">
              {HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}h</option>)}
            </select>
            <select name="duration_minutes" defaultValue={mobileDuration.minutes} className="w-1/2 rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm">
              {MINUTE_OPTIONS.map((m) => <option key={m} value={m}>{m}m</option>)}
            </select>
          </div>
          <textarea name="description" defaultValue={mobileSelected?.description ?? ""} placeholder="Description" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text" />
          <textarea name="notes" defaultValue={mobileSelected?.notes ?? ""} placeholder="Notes" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text" />
          <label className="flex items-center gap-2 text-sm text-polar-text">
            <input type="checkbox" name="is_active" value="true" defaultChecked={mobileSelected?.isActive ?? true} />
            Active
          </label>
          {mobileError && <p className="text-sm text-polar-danger">{mobileError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="rounded bg-polar-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Saving…" : "Save Service"}
            </button>
            {mobileSelected && (
              <button type="button" onClick={handleMobileDelete} className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text">
                Delete
              </button>
            )}
          </div>
        </form>
      </main>

      {/* Desktop — My Services Focus Mode. */}
      <FocusModeShell
        id="services"
        accent="magenta"
        room={<BarberRoom decorative />}
        className={ui.className}
        splatter={SPLATTER}
        heading={
          <div className="relative flex min-w-0 flex-1 items-center gap-5">
            <ScissorsGlyph />
            <div className="relative">
              <h1 className={`${graffiti.className} services-title whitespace-nowrap leading-none`} style={{ fontSize: "clamp(40px, 3.6vw, 64px)" }}>
                My Services
              </h1>
              <p className="mt-1 whitespace-nowrap pl-2 text-sm font-medium uppercase tracking-[0.42em] text-white/85">Manage what you offer.</p>
            </div>
            <div className="relative ml-auto mr-[14%] hidden xl:block">
              <CrownGlyph />
            </div>
          </div>
        }
        toolbar={
          <>
            <label
              className="flex h-14 min-w-0 flex-1 items-center gap-4 rounded-xl border-2 px-5"
              style={{ borderColor: `rgba(${PINK.rgb},0.85)`, boxShadow: `0 0 14px -3px rgba(${PINK.rgb},0.7), inset 0 0 8px rgba(${PINK.rgb},0.15)` }}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="M20 20l-4.5-4.5" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services..."
                aria-label="Search services"
                className="h-full min-w-0 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-white/70"
              />
            </label>
            <button
              type="button"
              onClick={() => setReorderMode((v) => !v)}
              aria-pressed={reorderMode}
              disabled={!hasAnyServices}
              className="flex h-14 shrink-0 items-center gap-4 rounded-xl border-2 px-6 text-lg font-semibold text-white transition hover:bg-white/5 disabled:opacity-40"
              style={{
                borderColor: `rgba(${PINK.rgb},0.85)`,
                background: reorderMode ? `rgba(${PINK.rgb},0.22)` : "rgba(0,0,0,0.3)",
                boxShadow: `0 0 12px -3px rgba(${PINK.rgb},0.6)`,
              }}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 20V4M3 8l4-4 4 4M17 4v16M13 16l4 4 4-4" />
              </svg>
              {reorderMode ? "Done" : "Reorder"}
            </button>
            {addButton}
          </>
        }
      >
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border"
          style={{ borderColor: `rgba(${PINK.rgb},0.4)`, background: "rgba(4,6,14,0.7)" }}
        >
          {!hasAnyServices ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <p className="text-2xl font-bold text-white">No services yet</p>
              <p className="text-base text-white/60">Add your first service to start building your booking menu.</p>
            </div>
          ) : (
            <div className="services-scroll min-h-0 flex-1 overflow-y-auto">
              {reorderMode && (
                <p className="px-9 py-2 text-sm text-white/65" style={{ background: `rgba(${PINK.rgb},0.1)` }}>
                  Reorder mode — use the arrows to move a service up or down. This is the order clients see.
                </p>
              )}
              <table className="w-full table-fixed border-collapse text-white">
                <thead className="sticky top-0 z-10" style={{ background: "linear-gradient(180deg, #3a0a2c 0%, #2a0720 100%)" }}>
                  <tr>
                    {headerCell("name", "Service", "w-[46%] pl-9")}
                    {headerCell("price", "Price", "w-[16%]")}
                    {headerCell("duration", "Duration", "w-[18%]")}
                    {headerCell("status", "Status", "w-[14%]")}
                    <th scope="col" className="w-[6%]">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-9 py-6 text-lg text-white/60">
                        No services match &quot;{query}&quot;.
                      </td>
                    </tr>
                  ) : (
                    visible.map((service) => {
                      const index = orderedIds.indexOf(service.id);
                      return (
                        <tr
                          key={service.id}
                          onClick={reorderMode ? undefined : () => setDialog(service.id)}
                          className={`text-xl transition ${reorderMode ? "" : "cursor-pointer hover:bg-white/[0.04]"}`}
                          style={{ borderTop: `1px solid ${ROW_LINE}` }}
                        >
                          <td className="truncate py-4 pl-9 pr-4 font-medium">
                            {reorderMode ? (
                              service.name
                            ) : (
                              <button type="button" onClick={() => setDialog(service.id)} className="truncate text-left outline-none focus-visible:underline">
                                {service.name}
                              </button>
                            )}
                          </td>
                          <td className="py-4 tabular-nums">{money(service.price)}</td>
                          <td className="py-4 tabular-nums">{service.durationMinutes} min</td>
                          <td className="py-4">
                            <StatusPill active={service.isActive} />
                          </td>
                          <td className="py-4 pr-6 text-right">
                            {reorderMode ? (
                              <span className="inline-flex gap-1">
                                <button
                                  type="button"
                                  aria-label={`Move ${service.name} up`}
                                  disabled={pending || index === 0}
                                  onClick={() => handleReorder(service.id, "up")}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border text-base disabled:opacity-25"
                                  style={{ borderColor: `rgba(${PINK.rgb},0.6)` }}
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Move ${service.name} down`}
                                  disabled={pending || index === orderedIds.length - 1}
                                  onClick={() => handleReorder(service.id, "down")}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border text-base disabled:opacity-25"
                                  style={{ borderColor: `rgba(${PINK.rgb},0.6)` }}
                                >
                                  ▼
                                </button>
                              </span>
                            ) : (
                              <svg viewBox="0 0 24 24" className="ml-auto h-7 w-7 text-white/90" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FocusModeShell>

      {/* Service dialog (Add / Details & Edit) — outside the Focus panel so
          it overlays the whole page, including in Full Screen. */}
      {dialog && (
        <ServiceDialog
          key={dialog}
          service={dialogService}
          onOpen={(id) => setDialog(id)}
          onClose={() => setDialog(null)}
          className={ui.className}
        />
      )}
    </div>
  );
}

function ServiceDialog({
  service,
  onOpen,
  onClose,
  className,
}: {
  service: ServiceWithImages | null;
  onOpen: (id: string) => void;
  onClose: () => void;
  className: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [active, setActive] = useState(service?.isActive ?? true);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const duration = formatDuration(service?.durationMinutes ?? 0);

  // Esc closes the dialog first (and stops Full Screen exiting on the same key).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveService(formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "id" in result) {
        setSaved(true);
        // A newly created service stays open so images can be added.
        if (!service) onOpen(result.id);
      }
    });
  }

  function handleDelete() {
    if (!service) return;
    const formData = new FormData();
    formData.set("service_id", service.id);
    startTransition(async () => {
      await deleteService(formData);
      onClose();
    });
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !service) return;
    const formData = new FormData();
    formData.set("service_id", service.id);
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadServiceImage(formData);
      if (result && "error" in result) setError(result.error);
    });
  }

  function handleSetCover(imageId: string) {
    if (!service) return;
    const formData = new FormData();
    formData.set("image_id", imageId);
    formData.set("service_id", service.id);
    startTransition(async () => {
      await setCoverImage(formData);
    });
  }

  function handleDeleteImage(imageId: string) {
    const formData = new FormData();
    formData.set("image_id", imageId);
    startTransition(async () => {
      await deleteServiceImage(formData);
    });
  }

  const field = "w-full rounded-lg border-2 bg-black/30 px-4 text-base text-white outline-none placeholder:text-white/35 focus:border-[#ff1fb4]";
  const fieldStyle = { borderColor: `rgba(${PINK.rgb},0.45)` };
  const label = "mb-1.5 block text-sm font-semibold uppercase tracking-wide text-white/70";

  return (
    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/75 p-6 backdrop-blur-sm sm:flex" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-dialog-title"
        className={`${className} services-scroll relative flex max-h-full w-[720px] max-w-full flex-col overflow-y-auto rounded-2xl border-2 p-7`}
        style={{ borderColor: PINK.hex, background: "linear-gradient(180deg, #0c0510 0%, #07030a 100%)", boxShadow: `0 0 34px -6px rgba(${PINK.rgb},0.85)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <p id="service-dialog-title" className="text-2xl font-bold uppercase tracking-wide text-white">
            {service ? "Service details" : "Add service"}
          </p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl leading-none text-white/60 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <input type="hidden" name="service_id" value={service?.id ?? ""} />

          <label className="block">
            <span className={label}>Service name</span>
            <input name="name" type="text" required defaultValue={service?.name ?? ""} placeholder="Type service name..." className={`${field} h-12`} style={fieldStyle} />
          </label>

          <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-4">
            <label className="block">
              <span className={label}>Price (GBP)</span>
              <input name="price" type="number" step="0.01" min="0" defaultValue={service?.price ?? ""} placeholder="0.00" className={`${field} h-12`} style={fieldStyle} />
            </label>
            <label className="block">
              <span className={label}>Hours</span>
              <select name="duration_hours" defaultValue={duration.hours} className={`${field} h-12`} style={fieldStyle}>
                {HOUR_OPTIONS.map((h) => (
                  <option key={h} value={h} className="bg-[#0c0510]">{h}h</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={label}>Minutes</span>
              <select name="duration_minutes" defaultValue={duration.minutes} className={`${field} h-12`} style={fieldStyle}>
                {MINUTE_OPTIONS.map((m) => (
                  <option key={m} value={m} className="bg-[#0c0510]">{m}m</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className={label}>Description</span>
            <textarea name="description" rows={3} defaultValue={service?.description ?? ""} placeholder="Describe the service..." className={`${field} resize-none py-3`} style={fieldStyle} />
          </label>

          <div>
            <span className={label}>Service images</span>
            {service ? (
              <div className="flex flex-wrap gap-3">
                {service.images.map((img) => (
                  <div key={img.id} className="relative h-20 w-20 overflow-hidden rounded-lg" style={{ boxShadow: img.isCover ? `0 0 0 2px ${PINK.hex}` : "0 0 0 1px rgba(255,255,255,0.15)" }}>
                    <button type="button" onClick={() => handleSetCover(img.id)} aria-label="Set as cover image" title={img.isCover ? "Cover image" : "Set as cover"} className="h-full w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    </button>
                    <button type="button" onClick={() => handleDeleteImage(img.id)} aria-label="Remove image" className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/75 text-sm text-white hover:bg-black">
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pending}
                  className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed text-3xl text-white/70 hover:text-white disabled:opacity-40"
                  style={{ borderColor: `rgba(${PINK.rgb},0.5)` }}
                  aria-label="Add image"
                >
                  +
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChosen} className="hidden" />
              </div>
            ) : (
              <p className="text-sm text-white/45">Save the service first, then add images.</p>
            )}
          </div>

          <label className="block">
            <span className={label}>Internal notes</span>
            <textarea name="notes" rows={2} defaultValue={service?.notes ?? ""} placeholder="Add any important notes..." className={`${field} resize-none py-3`} style={fieldStyle} />
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" name="is_active" value="true" checked={active} onChange={(e) => setActive(e.target.checked)} className="sr-only" />
            <span className="relative h-7 w-12 rounded-full transition-colors" style={{ background: active ? BLUE.hex : "rgba(255,255,255,0.15)" }}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${active ? "left-6" : "left-1"}`} />
            </span>
            <span className="text-base font-semibold text-white">{active ? "Active — bookable by clients" : "Inactive — hidden from clients"}</span>
          </label>

          {error && <p className="text-sm font-semibold text-[#ff6b8b]">{error}</p>}
          {saved && !error && <p className="text-sm font-semibold text-white/70">Saved.</p>}

          {confirmDelete ? (
            <div role="alertdialog" aria-labelledby="delete-service-q" className="rounded-xl border-2 p-4" style={{ borderColor: "rgba(255,90,120,0.6)" }}>
              <p id="delete-service-q" className="text-base font-bold text-white">Delete this service?</p>
              <p className="mt-1 text-sm text-white/60">This permanently removes {service?.name} and its images.</p>
              <div className="mt-3 flex justify-end gap-3">
                <button type="button" onClick={() => setConfirmDelete(false)} disabled={pending} className="rounded-lg px-4 py-2 text-base text-white/75 hover:text-white">
                  Cancel
                </button>
                <button type="button" onClick={handleDelete} disabled={pending} className="rounded-lg bg-[#d6204a] px-5 py-2 text-base font-bold text-white disabled:opacity-60">
                  {pending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-2">
              {service && (
                <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-lg border-2 px-5 py-2.5 text-base font-semibold text-[#ff6b8b]" style={{ borderColor: "rgba(255,90,120,0.5)" }}>
                  Delete
                </button>
              )}
              <button type="button" onClick={onClose} className="ml-auto rounded-lg px-5 py-2.5 text-base text-white/75 hover:text-white">
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg px-6 py-2.5 text-base font-bold uppercase tracking-wide text-white disabled:opacity-60"
                style={{ background: `linear-gradient(180deg, #ff3fc0 0%, ${PINK.hex} 55%, #d10f90 100%)`, boxShadow: `0 0 14px -3px rgba(${PINK.rgb},0.8)` }}
              >
                {pending ? "Saving…" : "Save service"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
