"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Barlow, Permanent_Marker } from "next/font/google";
import { linkClientByEmail } from "@/lib/actions/barber-client-links";
import { FocusModeShell, ACCENTS } from "@/components/focus-mode/focus-mode-shell";
import { BarberRoom } from "../dashboard-scene";

type Client = { id: string; full_name: string };

// Clients Focus Mode (desktop), built to the approved blue CLIENTS
// reference as real HTML inside the shared FocusModeShell, over the
// darkened POLAR Room — this replaces the previous flat mastered-image
// UI entirely. The directory is names only: find person → click person.
// Details, editing and removal live on the client's own page.
const BLUE = ACCENTS.blue;
const ROW_LINE = `rgba(${ACCENTS.blue.rgb},0.22)`;

const graffiti = Permanent_Marker({ subsets: ["latin"], weight: "400" });
const ui = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const ALPHABET = ["#", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

function groupKey(fullName: string): string {
  const first = fullName.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

function PeopleGlyph() {
  return (
    <svg viewBox="0 0 48 40" className="h-14 w-16 shrink-0" fill="none" stroke="#18d4ff" strokeWidth="3.6" strokeLinecap="round" aria-hidden="true" style={{ filter: "drop-shadow(0 0 6px rgba(24,212,255,0.7))" }}>
      <circle cx="17" cy="11" r="7" />
      <path d="M3 37c0-8 6.3-13 14-13s14 5 14 13z" />
      <circle cx="33" cy="12" r="6" />
      <path d="M34 24c6.5.5 11 5 11 12h-9" />
    </svg>
  );
}

function CrownGlyph() {
  return (
    <svg viewBox="0 0 80 64" className="h-16 w-20 shrink-0" fill="none" stroke={ACCENTS.blue.hex} strokeWidth="5" strokeLinejoin="round" aria-hidden="true" style={{ filter: `drop-shadow(0 0 8px rgba(${ACCENTS.blue.rgb},0.8))` }}>
      <path d="M8 16l16 16 16-26 16 26 16-16-6 30H14z" />
      <path d="M16 54c8-5 40-5 48 0" />
      <path d="M22 50v10M40 48v14M58 50v8" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

export function ClientDirectory({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [added, setAdded] = useState(false);
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
      await linkClientByEmail(formData);
      setAdded(true);
    });
  }

  function openAdd() {
    setAdded(false);
    setAddOpen(true);
  }

  const addButton = (
    <button
      type="button"
      onClick={openAdd}
      className="flex h-14 shrink-0 items-center gap-6 rounded-xl border-2 px-8 text-lg font-bold uppercase tracking-wide text-white transition hover:bg-white/5"
      style={{ borderColor: BLUE.hex, boxShadow: `0 0 16px -2px rgba(${BLUE.rgb},0.75), inset 0 0 10px rgba(${BLUE.rgb},0.3)` }}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#18d4ff" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
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
        .clients-title {
          display: inline-block;
          transform: rotate(-3deg) skewX(-6deg);
          background: linear-gradient(180deg, #ffffff 0%, #eef3ff 50%, #b9c6de 75%, #ffffff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.8)) drop-shadow(0 0 8px rgba(30, 123, 255, 0.45));
          padding: 0.05em 0.1em;
        }
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

      {/* Desktop — Clients Focus Mode. */}
      <FocusModeShell
        id="clients"
        accent="blue"
        room={<BarberRoom decorative />}
        className={ui.className}
        heading={
          <div className="relative flex min-w-0 flex-1 items-center gap-5">
            {/* Faint diagonal light streaks behind the header, as in the reference. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-[-24px] left-[38%] right-[18%]"
              style={{ background: `repeating-linear-gradient(115deg, transparent 0 70px, rgba(${BLUE.rgb},0.07) 70px 110px, transparent 110px 170px)` }}
            />
            <PeopleGlyph />
            <div className="relative">
              <h1 className={`${graffiti.className} clients-title leading-none`} style={{ fontSize: "clamp(40px, 3.6vw, 64px)" }}>
                Clients
              </h1>
              <p className="mt-1 whitespace-nowrap pl-3 text-sm font-medium uppercase tracking-[0.42em]" style={{ color: "#8fb6ff" }}>
                Real people. Real progress.
              </p>
            </div>
            <div className="relative ml-auto mr-[14%] hidden xl:block">
              <CrownGlyph />
            </div>
          </div>
        }
        toolbar={
          <>
            <label className="flex h-14 min-w-0 flex-1 items-center gap-4 rounded-xl border-2 px-5" style={{ borderColor: BLUE.hex, boxShadow: `0 0 14px -3px rgba(${BLUE.rgb},0.7), inset 0 0 8px rgba(${BLUE.rgb},0.2)` }}>
              <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
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
                className="h-full min-w-0 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-white/70"
              />
            </label>
            {addButton}
          </>
        }
      >
        {/* A–Z — jumps the list to that letter; letters with no clients are dimmed. */}
        <nav
          aria-label="Jump to letter"
          className="mb-3 flex shrink-0 items-center justify-between rounded-xl border px-2 py-1.5"
          style={{ borderColor: `rgba(${BLUE.rgb},0.35)`, background: "rgba(3,10,28,0.6)" }}
        >
          {ALPHABET.map((letter) => {
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
                className={`flex h-10 min-w-9 flex-1 items-center justify-center rounded-lg text-lg transition ${letter === "#" ? "max-w-12 border font-bold" : "max-w-12"} ${has ? "text-white hover:bg-white/5" : "cursor-default text-white/25"}`}
                style={{
                  ...(letter === "#" ? { borderColor: `rgba(${BLUE.rgb},0.5)` } : {}),
                  ...(active ? { background: `rgba(${BLUE.rgb},0.35)`, borderWidth: 2, borderStyle: "solid", borderColor: BLUE.hex, boxShadow: `0 0 12px rgba(${BLUE.rgb},0.7)`, fontWeight: 700 } : {}),
                }}
              >
                {letter}
              </button>
            );
          })}
        </nav>

        {/* Directory — real linked clients, names only. */}
        <div ref={listRef} className="clients-scroll relative min-h-0 flex-1 overflow-y-auto pr-3">
          {!hasAnyClients ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-2xl font-bold text-white">No clients yet</p>
              <p className="text-base text-white/60">Add your first client to get started.</p>
              <div className="mt-3">{addButton}</div>
            </div>
          ) : filtered.length === 0 ? (
            <p className="pt-4 text-lg text-white/60">No clients match &quot;{query}&quot;.</p>
          ) : (
            <div className="space-y-3">
              {ALPHABET.map((letter) => {
                const items = groups.get(letter) ?? [];
                if (items.length === 0) return null;
                return (
                  <section
                    key={letter}
                    id={`client-group-${letter}`}
                    aria-label={letter}
                    className="overflow-hidden rounded-xl border"
                    style={{ borderColor: `rgba(${BLUE.rgb},0.45)` }}
                  >
                    <h2
                      className="px-5 py-1.5 text-2xl font-bold text-white"
                      style={{ background: "linear-gradient(180deg, #0f3fa6 0%, #0a2f82 100%)" }}
                    >
                      {letter}
                    </h2>
                    <ul>
                      {items.map((client, i) => (
                        <li key={client.id} style={i ? { borderTop: `1px solid ${ROW_LINE}` } : undefined}>
                          <Link
                            href={`/dashboard/barber/clients/${client.id}`}
                            className="flex items-center justify-between px-10 py-2.5 text-xl font-medium text-white transition hover:bg-white/[0.05]"
                            style={{ background: "rgba(2,8,24,0.55)" }}
                          >
                            <span className="truncate">{client.full_name}</span>
                            <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-white/85" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      </FocusModeShell>

      {/* Add Client — the existing link-by-email flow. */}
      {addOpen && (
        <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/70 backdrop-blur-sm sm:flex" onClick={() => setAddOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-client-title"
            className={`${ui.className} relative w-[440px] rounded-2xl border-2 p-6`}
            style={{ borderColor: BLUE.hex, background: "linear-gradient(180deg, #06112a 0%, #030a1c 100%)", boxShadow: `0 0 30px -6px rgba(${BLUE.rgb},0.8)` }}
            onClick={(e) => e.stopPropagation()}
          >
            <p id="add-client-title" className="text-2xl font-bold uppercase tracking-wide text-white">Add client</p>
            {added ? (
              <>
                <p className="mt-3 text-base text-white/75">
                  If a POLAR client account exists with that email, they&apos;ve been added and now appear in your list.
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
                    className="h-12 w-full rounded-lg border-2 bg-black/30 px-4 text-base text-white outline-none placeholder:text-white/35"
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
