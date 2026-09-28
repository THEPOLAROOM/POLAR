"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { linkClientByEmail } from "@/lib/actions/barber-client-links";
import { ACCENTS } from "@/components/focus-mode/focus-mode-shell";
import { PolarStage } from "@/components/polar-ui/polar-stage";
import { BarberRoom } from "../dashboard-scene";

type Client = { id: string; full_name: string };

// Clients (desktop), in the Calendar's POLAR master language on the same
// 1672 × 941 stage: the master's own frame, drips, header bar, crown and
// corner paint, translated to the Clients blue/cyan identity
// (clients-*.webp), over POLAR navy. Every control is live HTML at a fixed
// native-px box. Behaviour is unchanged: search, A–Z jump, grouped list,
// Add Client (link by email), full screen, close. The directory is names
// only: find person → click person.
const BLUE = ACCENTS.blue;
const CYAN = { hex: "#22e4ff", rgb: "34,228,255" };
const ROW_LINE = `rgba(${BLUE.rgb},0.28)`;
const GRID = "rgba(30,123,255,0.62)";
const NAVY = "#060b1e";
const OUTLINE: React.CSSProperties = {
  borderColor: BLUE.hex,
  boxShadow: `0 0 10px rgba(${BLUE.rgb},0.55), inset 0 0 7px rgba(${BLUE.rgb},0.22)`,
};

// Typography: the Calendar's exact rules — Barlow Condensed for the UI
// voice, full-width Barlow 800 italic (Calendar's .cal-period display
// rule) for the page title.
const ui = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700", "800"], style: ["normal", "italic"] });
const wide = Barlow({ subsets: ["latin"], weight: ["600", "700", "800"], style: ["normal", "italic"] });

const ALPHABET = ["#", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

function groupKey(fullName: string): string {
  const first = fullName.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

function PeopleGlyph() {
  return (
    <svg viewBox="0 0 48 40" width="88" height="74" className="shrink-0" fill="none" stroke="#22e4ff" strokeWidth="3.4" strokeLinecap="round" aria-hidden="true" style={{ filter: "drop-shadow(0 0 6px rgba(24,212,255,0.7))" }}>
      <circle cx="17" cy="11" r="7" />
      <path d="M3 37c0-8 6.3-13 14-13s14 5 14 13z" />
      <circle cx="33" cy="12" r="6" />
      <path d="M34 24c6.5.5 11 5 11 12h-9" />
    </svg>
  );
}

export function ClientDirectory({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [added, setAdded] = useState<null | "linked" | "not_found" | string>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  const hasAnyClients = clients.length > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.full_name.toLowerCase().includes(q));
  }, [clients, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Client[]>();
    for (const letter of ALPHABET) map.set(letter, []);
    for (const c of filtered) map.get(groupKey(c.full_name))!.push(c);
    return map;
  }, [filtered]);

  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    for (const letter of ALPHABET) if ((groups.get(letter) ?? []).length > 0) set.add(letter);
    return set;
  }, [groups]);

  // Jumps the list (not the page) to that letter's section.
  function jumpToLetter(letter: string) {
    if (!availableLetters.has(letter)) return;
    // Instant jump, like a phone contacts index. The list is the sections'
    // offsetParent (position: relative), so offsetTop is list-relative.
    const list = listRef.current;
    const target = document.getElementById(`client-group-${letter}`);
    if (list && target) list.scrollTop = target.offsetTop;
    setActiveLetter(letter);
  }

  function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await linkClientByEmail(formData);
      setAdded("error" in r ? r.error : r.linked ? "linked" : "not_found");
    });
  }

  function openAdd() {
    setAdded(null);
    setAddOpen(true);
  }

  const addButton = (
    <button
      type="button"
      onClick={openAdd}
      className="flex h-[55px] w-[240px] shrink-0 items-center justify-center gap-3 rounded-[10px] border-2 text-[22px] font-bold uppercase tracking-wide text-white transition hover:brightness-110"
      style={{ background: BLUE.hex, borderColor: "#6fb2ff", boxShadow: `0 0 16px -2px rgba(${BLUE.rgb},0.9)` }}
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" aria-hidden="true">
        <path d="M12 4v16M4 12h16" />
      </svg>
      Add Client
    </button>
  );

  return (
    <div id="barber-clients-page">
      {/* The shared barber nav lives in layout.tsx, which every other
          barber route still needs, so it's hidden for this page only. */}
      <style>{`
        div:has(> #barber-clients-page) > nav {
          display: none;
        }
        /* Calendar's .cal-period display rule, reused for the page title. */
        .clients-title {
          font-weight: 800;
          font-style: italic;
          letter-spacing: 0.01em;
          line-height: 1;
          color: #fff;
          text-shadow: 0 2px 0 rgba(0, 0, 0, 0.7), 0 0 18px rgba(30, 123, 255, 0.55);
        }
        /* Stage icon buttons in the Clients blue (scoped — Calendar keeps pink). */
        #barber-clients-page .polar-icon-btn {
          border-color: #1e7bff;
          box-shadow: 0 0 12px rgba(30, 123, 255, 0.6), inset 0 0 9px rgba(30, 123, 255, 0.28);
        }
        #barber-clients-page a.polar-icon-btn { color: #22e4ff !important; }
        #barber-clients-page ::selection { background: rgba(30, 123, 255, 0.45); }
        .clients-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(30, 123, 255, 0.9) transparent;
        }
        .clients-scroll::-webkit-scrollbar { width: 6px; }
        .clients-scroll::-webkit-scrollbar-thumb { background: rgba(30, 123, 255, 0.9); border-radius: 999px; }
      `}</style>

      {/* Mobile — unchanged simple functional layout. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">Clients</h1>

        <form onSubmit={handleAddSubmit} className="mt-4 flex gap-2">
          <input
            name="client_email"
            type="email"
            required
            placeholder="Client's email"
            className="flex-1 rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
          />
          <button type="submit" disabled={pending} className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text">
            {pending ? "Linking…" : "Link client"}
          </button>
        </form>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clients…"
          className="mt-4 w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
        />

        {filtered.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {filtered.map((client) => (
              <li key={client.id}>
                <Link href={`/dashboard/barber/clients/${client.id}`} className="block rounded border border-polar-border px-3 py-2 text-sm text-polar-text">
                  {client.full_name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-polar-muted">{hasAnyClients ? "No clients match your search." : "No clients yet."}</p>
        )}
      </main>

      {/* Desktop — Clients on the POLAR master stage (native 1672 × 941 px). */}
      <PolarStage id="clients" chromeSrc="/dashboard/polar-ui/clients-chrome.webp" room={<BarberRoom decorative />} className={ui.className}>
        {/* Header: icon, title, tagline, crown — inside the master header bar. */}
        <div className="absolute flex items-center gap-5" style={{ left: 146, top: 113, height: 86 }}>
          <PeopleGlyph />
          <div>
            <div className="flex items-start gap-2">
              {/* Official POLAR display lettering (design-masters/polar-display-alphabet.png), blue edge. */}
              <h1 className="relative">
                <span className="sr-only">Clients</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/dashboard/polar-ui/clients-title.webp" alt="" aria-hidden="true" width={202} height={65} className="block" />
              </h1>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/dashboard/polar-ui/clients-crown.webp" alt="" aria-hidden="true" className="-mt-5" width={62} height={55} />
            </div>
            <p className="mt-0.5 whitespace-nowrap pl-1 text-[16px] font-semibold uppercase tracking-[0.36em]" style={{ color: CYAN.hex }}>
              Real people. Real progress.
            </p>
          </div>
        </div>

        {/* Toolbar row (Calendar's toolbar line). */}
        <label className="absolute flex items-center gap-4 rounded-[10px] border-2 px-5" style={{ ...OUTLINE, left: 136, top: 227, width: 1162, height: 55, background: NAVY }}>
          <svg viewBox="0 0 24 24" width="28" height="28" className="shrink-0" fill="none" stroke={CYAN.hex} strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M20 20l-4.5-4.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveLetter(null);
            }}
            placeholder="Search clients..."
            aria-label="Search clients"
            className="h-full min-w-0 flex-1 bg-transparent text-[22px] font-medium text-white outline-none placeholder:text-white/55"
          />
        </label>
        <div className="absolute" style={{ left: 1312, top: 227 }}>
          {addButton}
        </div>

        {/* Body — the master's grid box. */}
        <div className="absolute flex flex-col overflow-hidden rounded-[12px] border-2" style={{ left: 134, top: 308, width: 1419, height: 531, borderColor: BLUE.hex, boxShadow: `0 0 10px rgba(${BLUE.rgb},0.35)`, background: NAVY }}>
          {/* A–Z — jumps the list to that letter; letters with no clients are dimmed. */}
          <nav aria-label="Jump to letter" className="flex shrink-0 items-stretch" style={{ height: 55, borderBottom: `2px solid ${GRID}` }}>
            {ALPHABET.map((letter, i) => {
              const has = availableLetters.has(letter);
              const active = activeLetter === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={!has}
                  onClick={() => jumpToLetter(letter)}
                  aria-label={`Jump to ${letter === "#" ? "numbers and symbols" : letter}`}
                  aria-pressed={active}
                  className={`flex flex-1 items-center justify-center text-[24px] font-bold transition ${has ? "text-white hover:bg-white/[0.06]" : "cursor-default text-white/25"}`}
                  style={{
                    borderLeft: i ? `1px solid rgba(${BLUE.rgb},0.22)` : undefined,
                    ...(letter === "#" && has && !active ? { color: CYAN.hex } : {}),
                    ...(active ? { background: BLUE.hex, color: "#fff", boxShadow: `0 0 16px rgba(${BLUE.rgb},0.8)` } : {}),
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </nav>

          {/* Directory — real linked clients, names only. */}
          <div ref={listRef} className="clients-scroll relative min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
            {!hasAnyClients ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-[34px] font-bold text-white">No clients yet</p>
                <p className="text-[20px] text-white/60">Add your first client to get started.</p>
                <div className="mt-3">{addButton}</div>
              </div>
            ) : filtered.length === 0 ? (
              <p className="pt-4 text-[22px] text-white/60">No clients match &quot;{query}&quot;.</p>
            ) : (
              <div className="space-y-4">
                {ALPHABET.map((letter) => {
                  const items = groups.get(letter) ?? [];
                  if (items.length === 0) return null;
                  return (
                    <section key={letter} id={`client-group-${letter}`} aria-label={letter} className="overflow-hidden rounded-[10px] border-2" style={{ borderColor: GRID }}>
                      <h2
                        className={`${wide.className} flex items-center gap-3 px-5 py-1.5 text-[28px] font-extrabold italic text-white`}
                        style={{ background: "linear-gradient(180deg, #0d2c6e 0%, #081d4d 100%)", borderBottom: `2px solid ${GRID}` }}
                      >
                        <span>{letter}</span>
                        <span className="h-[2px] flex-1" style={{ background: `linear-gradient(90deg, rgba(${CYAN.rgb},0.7), transparent)` }} aria-hidden="true" />
                        <span className="text-[17px] font-semibold not-italic text-white/60">{items.length}</span>
                      </h2>
                      <ul>
                        {items.map((client, i) => (
                          <li key={client.id} style={i ? { borderTop: `1px solid ${ROW_LINE}` } : undefined}>
                            <Link
                              href={`/dashboard/barber/clients/${client.id}`}
                              className="group flex items-center justify-between px-8 py-3 text-[24px] font-semibold text-white transition hover:bg-[rgba(30,123,255,0.12)]"
                            >
                              <span className="truncate">{client.full_name}</span>
                              <svg viewBox="0 0 24 24" width="26" height="26" className="shrink-0 text-white/70 transition group-hover:text-[#22e4ff]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/dashboard/polar-ui/clients-corner-splat.webp" alt="" aria-hidden="true" className="pointer-events-none absolute z-10 select-none" style={{ left: 1476, top: 784, width: 74, height: 52 }} />
      </PolarStage>

      {/* Add Client — the existing link-by-email flow. */}
      {addOpen && (
        <div className="fixed inset-0 z-50 hidden items-center justify-center bg-[#030612]/80 backdrop-blur-sm sm:flex" onClick={() => setAddOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-client-title"
            className={`${ui.className} relative w-[440px] rounded-2xl border-2 p-6`}
            style={{ borderColor: BLUE.hex, background: NAVY, boxShadow: `0 0 28px -4px rgba(${BLUE.rgb},0.7)` }}
            onClick={(e) => e.stopPropagation()}
          >
            <p id="add-client-title" className="text-2xl font-bold uppercase tracking-wide text-white">Add client</p>
            {added ? (
              <>
                <p className="mt-3 text-base text-white/75">
                  {added === "linked"
                    ? "Client added — they now appear in your list."
                    : added === "not_found"
                      ? "No POLAR client account uses that email. Ask the client to sign up to POLAR first, then add them here."
                      : added}
                </p>
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg px-5 py-2 text-base font-bold text-white" style={{ background: BLUE.hex }}>
                    Done
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleAddSubmit} className="mt-3 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-white/70">Enter the email address your client signed up to POLAR with.</span>
                  <input
                    name="client_email"
                    type="email"
                    required
                    autoFocus
                    placeholder="client@example.com"
                    className="h-12 w-full rounded-lg border-2 bg-[#0b1330] px-4 text-lg text-white outline-none placeholder:text-white/35 focus:shadow-[0_0_10px_rgba(30,123,255,0.6)]"
                    style={{ borderColor: `rgba(${BLUE.rgb},0.6)` }}
                  />
                </label>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg px-4 py-2 text-base text-white/70 hover:text-white">
                    Cancel
                  </button>
                  <button type="submit" disabled={pending} className="rounded-lg px-5 py-2 text-base font-bold text-white disabled:opacity-60" style={{ background: BLUE.hex }}>
                    {pending ? "Adding…" : "Add client"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
