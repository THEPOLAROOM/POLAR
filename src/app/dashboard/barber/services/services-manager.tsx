"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  saveService,
  deleteService,
  reorderService,
  uploadServiceImage,
  deleteServiceImage,
  setCoverImage,
} from "@/lib/actions/services";

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

// Same layered approach as the Barber Dashboard/My Profile/Clients:
// Layer 1 = full-bleed background (reused, decorative only), Layer 2
// = the locked, mastered two-panel Services UI PNG (the sole visual
// source of truth — nothing below recreates its cards/icons/
// typography), Layer 3 = real hit areas/data on top. This asset's own
// canvas (1363x941 — cropped tight to content; the raw supplied file
// had ~20% dead space from a baked-in "transparency" checkerboard,
// same issue as the Clients asset) is used at its own aspect ratio.
const ASSET_ASPECT = "1363 / 941";

// Every box below is measured directly against this asset's own
// cropped canvas (pixel-level border scan), same technique used for
// the Barber Dashboard/Clients overlays.
const SEARCH_BOX = { left: "2.38%", top: "15.67%", width: "35.03%", height: "5.84%" };
const REORDER_BOX = { left: "39.18%", top: "15.67%", width: "10.64%", height: "5.84%" };
const LIST_BOX = { left: "0.73%", top: "22.58%", width: "49.89%", height: "77.05%" };

const CLOSE_X_BOX = { left: "94.9%", top: "4.78%", width: "2.38%", height: "3.45%" };
const TITLE_PATCH_BOX = { left: "62.77%", top: "5.05%", width: "14.86%", height: "3.45%" };
const SERVICE_NAME_BOX = { left: "56.16%", top: "16.20%", width: "41.28%", height: "4.78%" };
const PRICE_BOX = { left: "60.38%", top: "26.30%", width: "15.96%", height: "4.52%" };
const HOURS_BOX = { left: "78.28%", top: "26.30%", width: "8.51%", height: "4.52%" };
const MINUTES_BOX = { left: "88.70%", top: "26.30%", width: "8.62%", height: "4.52%" };
const DESCRIPTION_BOX = { left: "56.16%", top: "36.03%", width: "41.28%", height: "9.56%" };
const NOTES_BOX = { left: "56.16%", top: "51.81%", width: "41.28%", height: "9.56%" };
const IMAGE_SLOT_TOP = "67.22%";
const IMAGE_SLOT_HEIGHT = "9.30%";
const IMAGE_SLOTS = [
  { left: "56.16%", width: "9.35%" },
  { left: "66.54%", width: "6.97%" },
  { left: "74.98%", width: "6.05%" },
  { left: "82.50%", width: "6.86%" },
  { left: "90.76%", width: "6.68%" },
];
const STATUS_TOGGLE_BOX = { left: "64.42%", top: "84.22%", width: "4.04%", height: "3.19%" };
const DELETE_BUTTON_BOX = { left: "56.16%", top: "92.72%", width: "12.11%", height: "5.31%" };
const SAVE_BUTTON_BOX = { left: "70.29%", top: "92.72%", width: "27.15%", height: "5.31%" };

const PATCH_FILL = "#01112a";
const LIST_FILL = "#010e25";

const HIT_AREA_CLASS =
  "absolute rounded-2xl bg-transparent transition duration-200 ease-out hover:shadow-[0_0_18px_4px_rgba(91,155,255,0.4),0_0_26px_8px_rgba(255,61,154,0.22)]";

const HOUR_OPTIONS = Array.from({ length: 7 }, (_, i) => i); // 0h..6h
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function formatDuration(totalMinutes: number): { hours: number; minutes: number } {
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

function money(n: number): string {
  return `£${n.toFixed(2)}`;
}

function durationLabel(totalMinutes: number): string {
  const { hours, minutes } = formatDuration(totalMinutes);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function ServicesManager({ services }: { services: ServiceWithImages[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [reorderMode, setReorderMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(
    () => [...services].sort((a, b) => a.displayOrder - b.displayOrder),
    [services]
  );
  const orderedIds = useMemo(() => sorted.map((s) => s.id), [sorted]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((s) => s.name.toLowerCase().includes(q));
  }, [sorted, query]);

  const selected = selectedId ? services.find((s) => s.id === selectedId) ?? null : null;
  const hasAnyServices = services.length > 0;

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveService(formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "id" in result) {
        setSelectedId(result.id);
      }
    });
  }

  function handleDelete() {
    if (!selectedId) return;
    const formData = new FormData();
    formData.set("service_id", selectedId);
    startTransition(async () => {
      await deleteService(formData);
      setSelectedId(null);
    });
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

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedId) return;
    const formData = new FormData();
    formData.set("service_id", selectedId);
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadServiceImage(formData);
      if (result && "error" in result) setError(result.error);
    });
  }

  function handleSetCover(imageId: string) {
    if (!selectedId) return;
    const formData = new FormData();
    formData.set("image_id", imageId);
    formData.set("service_id", selectedId);
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

  const duration = formatDuration(selected?.durationMinutes ?? 0);

  return (
    <div id="barber-services-page">
      {/* Same technique as the Barber Dashboard/My Profile/Clients:
          the shared barber nav lives in layout.tsx, which every other
          barber route still needs, so it's hidden for this specific
          page only via this scoped rule rather than editing the
          shared layout. */}
      <style>{`
        div:has(> #barber-services-page) > nav {
          display: none;
        }
      `}</style>

      {/* Mobile — simple functional placeholder; the immersive layered
          design below is desktop-only, matching the rest of the
          Barber Portal. */}
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
              <button type="button" onClick={() => setSelectedId(s.id)} className="block w-full text-left text-sm text-polar-text">
                {s.name} — {money(s.price)} · {durationLabel(s.durationMinutes)}
              </button>
            </li>
          ))}
          {filtered.length === 0 && <p className="text-sm text-polar-muted">No services yet.</p>}
        </ul>

        <h2 className="mt-8 text-sm font-semibold text-polar-text">{selected ? "Edit Service" : "Add Service"}</h2>
        <form onSubmit={handleSave} className="mt-2 space-y-3">
          <input type="hidden" name="service_id" value={selected?.id ?? ""} />
          <input name="name" defaultValue={selected?.name ?? ""} required placeholder="Service name" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text" />
          <input name="price" type="number" step="0.01" min="0" defaultValue={selected?.price ?? ""} placeholder="Price" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text" />
          <div className="flex gap-2">
            <select name="duration_hours" defaultValue={duration.hours} className="w-1/2 rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm">
              {HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}h</option>)}
            </select>
            <select name="duration_minutes" defaultValue={duration.minutes} className="w-1/2 rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm">
              {MINUTE_OPTIONS.map((m) => <option key={m} value={m}>{m}m</option>)}
            </select>
          </div>
          <textarea name="description" defaultValue={selected?.description ?? ""} placeholder="Description" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text" />
          <textarea name="notes" defaultValue={selected?.notes ?? ""} placeholder="Notes" className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text" />
          <label className="flex items-center gap-2 text-sm text-polar-text">
            <input type="checkbox" name="is_active" value="true" defaultChecked={selected?.isActive ?? true} />
            Active
          </label>
          {error && <p className="text-sm text-polar-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="rounded bg-polar-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Saving…" : "Save Service"}
            </button>
            {selected && (
              <button type="button" onClick={handleDelete} className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text">
                Delete
              </button>
            )}
          </div>
        </form>
      </main>

      {/* Desktop */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <Image
          src="/dashboard/polar-barber-dashboard-background.png"
          alt=""
          fill
          priority
          className="object-cover"
          aria-hidden="true"
        />

        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div
            className="relative"
            style={{ width: `min(100%, calc(100dvh * ${ASSET_ASPECT}))`, aspectRatio: ASSET_ASPECT }}
          >
            <Image
              src="/dashboard/polar-barber-services-ui-mastered.png"
              alt="My Services"
              fill
              priority
              className="object-contain"
            />

            {/* Search — fully transparent, matching the Clients page's
                fix: the baked placeholder text shows through when
                empty (real placeholder set transparent), typed text
                renders in white. */}
            <div className="absolute flex items-center" style={SEARCH_BOX}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services..."
                aria-label="Search services"
                className="h-full w-full border-none bg-transparent text-white shadow-none outline-none placeholder:text-transparent focus:border-none focus:shadow-none focus:outline-none focus:ring-0"
                style={{ fontSize: "1vw", paddingLeft: "7%" }}
              />
            </div>

            {/* Reorder toggle */}
            <button
              type="button"
              aria-label="Toggle manual reordering"
              onClick={() => setReorderMode((v) => !v)}
              className={HIT_AREA_CLASS}
              style={{ ...REORDER_BOX, boxShadow: reorderMode ? "0 0 0 2px rgba(91,155,255,0.7), 0 0 18px 4px rgba(91,155,255,0.5)" : undefined }}
            />

            {/* Services list — only rendered with real rows once
                there's at least one real service; otherwise the
                mastered asset's own accurate empty-state artwork
                ("No services yet") is left exactly as supplied. */}
            {hasAnyServices && (
              <div className="absolute overflow-y-auto rounded-xl" style={LIST_BOX}>
                <div className="absolute inset-0" style={{ backgroundColor: LIST_FILL }} aria-hidden="true" />
                {filtered.length === 0 ? (
                  <p className="text-white/50" style={{ padding: "1.5%", fontSize: "0.95vw" }}>
                    No services match &quot;{query}&quot;.
                  </p>
                ) : (
                  <ul>
                    {filtered.map((service) => {
                      const cover = service.images.find((i) => i.isCover) ?? service.images[0];
                      const index = orderedIds.indexOf(service.id);
                      return (
                        <li
                          key={service.id}
                          className={`flex items-center border-b border-white/5 ${service.isActive ? "" : "opacity-45"} ${selectedId === service.id ? "bg-white/[0.06]" : ""}`}
                          style={{ gap: "1%", padding: "1% 1.5%" }}
                        >
                          <button type="button" onClick={() => setSelectedId(service.id)} className="flex flex-1 items-center text-left" style={{ gap: "1%" }}>
                            <span
                              className="flex-none overflow-hidden rounded-md bg-white/5"
                              style={{ width: "3.2vw", height: "3.2vw" }}
                            >
                              {cover && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cover.url} alt="" className="h-full w-full object-cover" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-white" style={{ fontSize: "0.95vw" }}>{service.name}</span>
                              <span className="block text-white/50" style={{ fontSize: "0.75vw" }}>
                                {money(service.price)} · {durationLabel(service.durationMinutes)}
                                {!service.isActive && " · Inactive"}
                              </span>
                            </span>
                          </button>
                          {reorderMode && (
                            <span className="flex flex-none flex-col">
                              <button
                                type="button"
                                aria-label="Move up"
                                disabled={index === 0}
                                onClick={() => handleReorder(service.id, "up")}
                                className="text-white/60 hover:text-white disabled:opacity-20"
                                style={{ fontSize: "0.8vw", lineHeight: 1 }}
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                aria-label="Move down"
                                disabled={index === orderedIds.length - 1}
                                onClick={() => handleReorder(service.id, "down")}
                                className="text-white/60 hover:text-white disabled:opacity-20"
                                style={{ fontSize: "0.8vw", lineHeight: 1 }}
                              >
                                ▼
                              </button>
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Add/Edit Service form */}
            <form key={selectedId ?? "new"} onSubmit={handleSave}>
              <input type="hidden" name="service_id" value={selectedId ?? ""} />

              <button
                type="button"
                aria-label="Reset to Add Service"
                onClick={() => setSelectedId(null)}
                className={HIT_AREA_CLASS}
                style={CLOSE_X_BOX}
              />

              {/* The baked title reads "ADD SERVICE" — patched with
                  real text so it correctly reads "EDIT SERVICE" once
                  an existing service is selected. */}
              <div className="absolute flex items-center" style={TITLE_PATCH_BOX}>
                <div className="absolute inset-0" style={{ backgroundColor: PATCH_FILL }} aria-hidden="true" />
                <p className="relative font-display text-white" style={{ fontSize: "1.6vw" }}>
                  {selected ? "EDIT SERVICE" : "ADD SERVICE"}
                </p>
              </div>

              <div className="absolute flex items-center" style={SERVICE_NAME_BOX}>
                <input
                  key={`name-${selectedId}`}
                  name="name"
                  type="text"
                  required
                  defaultValue={selected?.name ?? ""}
                  placeholder="Type service name..."
                  className="h-full w-full border-none bg-transparent text-white outline-none placeholder:text-transparent"
                  style={{ fontSize: "1vw", paddingLeft: "3%" }}
                />
              </div>

              <div className="absolute flex items-center" style={PRICE_BOX}>
                <input
                  key={`price-${selectedId}`}
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={selected?.price ?? ""}
                  placeholder="0.00"
                  className="h-full w-full border-none bg-transparent text-white outline-none placeholder:text-transparent"
                  style={{ fontSize: "1vw", paddingLeft: "17%" }}
                />
              </div>

              <div className="absolute flex items-center" style={HOURS_BOX}>
                <select
                  key={`h-${selectedId}`}
                  name="duration_hours"
                  defaultValue={duration.hours}
                  className="h-full w-full appearance-none border-none bg-transparent text-white outline-none"
                  style={{ fontSize: "1vw", paddingLeft: "12%" }}
                >
                  {HOUR_OPTIONS.map((h) => (
                    <option key={h} value={h} className="bg-navy text-white">{h}h</option>
                  ))}
                </select>
              </div>

              <div className="absolute flex items-center" style={MINUTES_BOX}>
                <select
                  key={`m-${selectedId}`}
                  name="duration_minutes"
                  defaultValue={duration.minutes}
                  className="h-full w-full appearance-none border-none bg-transparent text-white outline-none"
                  style={{ fontSize: "1vw", paddingLeft: "12%" }}
                >
                  {MINUTE_OPTIONS.map((m) => (
                    <option key={m} value={m} className="bg-navy text-white">{m}m</option>
                  ))}
                </select>
              </div>

              <div className="absolute" style={DESCRIPTION_BOX}>
                <textarea
                  key={`desc-${selectedId}`}
                  name="description"
                  defaultValue={selected?.description ?? ""}
                  placeholder="Describe the service..."
                  className="h-full w-full resize-none border-none bg-transparent text-white outline-none placeholder:text-transparent"
                  style={{ fontSize: "0.9vw", padding: "3%" }}
                />
              </div>

              <div className="absolute" style={NOTES_BOX}>
                <textarea
                  key={`notes-${selectedId}`}
                  name="notes"
                  defaultValue={selected?.notes ?? ""}
                  placeholder="Add any important notes..."
                  className="h-full w-full resize-none border-none bg-transparent text-white outline-none placeholder:text-transparent"
                  style={{ fontSize: "0.9vw", padding: "3%" }}
                />
              </div>

              {/* Service Images — slot 0 is always the uploader
                  trigger; slots 1-4 show up to 4 existing images.
                  Clicking an image sets it as cover; its small ×
                  removes it. Disabled until the service has been
                  saved at least once (no id to attach images to
                  yet). */}
              <button
                type="button"
                aria-label="Add images"
                disabled={!selectedId}
                onClick={() => fileInputRef.current?.click()}
                className={`${HIT_AREA_CLASS} disabled:pointer-events-none disabled:opacity-40`}
                style={{ ...IMAGE_SLOTS[0], top: IMAGE_SLOT_TOP, height: IMAGE_SLOT_HEIGHT }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChosen}
                className="hidden"
              />

              {[0, 1, 2, 3].map((i) => {
                const img = selected?.images[i];
                const slot = IMAGE_SLOTS[i + 1];
                if (!img) return null;
                return (
                  <div
                    key={img.id}
                    className="absolute overflow-hidden rounded-lg"
                    style={{ ...slot, top: IMAGE_SLOT_TOP, height: IMAGE_SLOT_HEIGHT }}
                  >
                    <button
                      type="button"
                      aria-label="Set as cover image"
                      onClick={() => handleSetCover(img.id)}
                      className="absolute inset-0 h-full w-full"
                      style={{ boxShadow: img.isCover ? "inset 0 0 0 2px rgba(91,155,255,0.9)" : undefined }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute right-[4%] top-[4%] flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                      style={{ width: "18%", height: "18%", fontSize: "0.6vw" }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {/* Status — the baked artwork can only show one fixed
                  toggle position, but Active/Inactive is real, dynamic
                  data, so this one control is a small real toggle
                  (matching the same rationale as the Add/Edit title
                  patch above) rather than an invisible hit area over
                  static art. */}
              <div className="absolute" style={STATUS_TOGGLE_BOX}>
                <ActiveToggle key={`active-${selectedId}`} defaultChecked={selected?.isActive ?? true} />
              </div>

              <button
                type="button"
                aria-label="Delete service"
                disabled={!selectedId}
                onClick={handleDelete}
                className={`${HIT_AREA_CLASS} disabled:pointer-events-none disabled:opacity-40`}
                style={DELETE_BUTTON_BOX}
              />

              <button
                type="submit"
                aria-label="Save service"
                disabled={pending}
                className={HIT_AREA_CLASS}
                style={SAVE_BUTTON_BOX}
              />
            </form>

          </div>
        </div>

        {/* Outside the scaled artwork box on purpose, so it's never
            clipped by that box's own overflow-hidden regardless of
            viewport size. */}
        {error && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-md border border-magenta/50 bg-navy-light/95 px-4 py-3 text-sm text-magenta shadow-lg">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

// Small real toggle for the one genuinely dynamic control the baked
// artwork can't represent (see the comment where it's used above).
// Its own useState resets correctly on every service switch because
// its parent <form> is remounted via `key={selectedId}`.
function ActiveToggle({ defaultChecked }: { defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label className="flex h-full w-full cursor-pointer items-center">
      <input
        type="checkbox"
        name="is_active"
        value="true"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="sr-only"
      />
      <span className={`relative h-full w-full rounded-full transition-colors ${checked ? "bg-royal" : "bg-white/15"}`}>
        <span
          className={`absolute top-[10%] h-[80%] aspect-square rounded-full bg-white transition-all ${checked ? "left-[55%]" : "left-[5%]"}`}
        />
      </span>
    </label>
  );
}
