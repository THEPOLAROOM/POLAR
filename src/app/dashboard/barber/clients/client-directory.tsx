"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { linkClientByEmail } from "@/lib/actions/barber-client-links";

type Client = { id: string; full_name: string };

// Same layered approach as the Barber Dashboard/My Profile: Layer 1 =
// full-bleed background (reused, decorative only), Layer 2 = the
// locked, mastered transparent Clients UI PNG (the sole visual source
// of truth — nothing below recreates its cards/icons/typography),
// Layer 3 = real hit areas/data on top. This asset's own canvas
// (990x978, cropped tight to its actual content — the raw supplied
// file had ~38% dead space around it) is nearly square, unlike the
// Dashboard/My Profile's 1672x941 — its own ratio is used here, not
// borrowed from either of those pages.
const ASSET_ASPECT = "990 / 978";

// Every box below is measured directly against this asset's own
// cropped canvas (pixel-level border scan), same technique used for
// the Barber Dashboard overlay.
const HEADER_ADD_CLIENT_BOX = { left: "72.8%", top: "3.9%", width: "26.1%", height: "6.2%" };
const SEARCH_BOX = { left: "1.1%", top: "13.7%", width: "88.9%", height: "6.5%" };
const INDEX_COL_BOX = { left: "91.7%", top: "13.7%", width: "7.2%", height: "83.0%" };
const LIST_BOX = { left: "1.1%", top: "21.6%", width: "88.9%", height: "75.1%" };
const EMPTY_ADD_CLIENT_BOX = { left: "31.7%", top: "63.6%", width: "30.6%", height: "6.2%" };

// The button appearance is already fully baked into the mastered
// asset, so these hit areas stay visually invisible in every state —
// no hover background/border/glow of their own.
const HIT_AREA_CLASS = "absolute bg-transparent";

const ALPHABET = ["#", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

function groupKey(fullName: string): string {
  const first = fullName.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

export function ClientDirectory({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
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

  function jumpToLetter(letter: string) {
    if (!availableLetters.has(letter)) return;
    if (query) setQuery("");
    requestAnimationFrame(() => {
      document.getElementById(`client-group-${letter}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await linkClientByEmail(formData);
      setAddOpen(false);
    });
  }

  const addClientForm = addOpen && (
    <div
      className="absolute z-10 rounded-xl border border-royal-light/40 bg-navy-light/95 shadow-[0_0_24px_-4px_rgba(91,155,255,0.6)]"
      style={{ top: "11%", right: "1.5%", width: "26%", padding: "1.2vw" }}
    >
      <form onSubmit={handleAddSubmit} className="flex flex-col" style={{ gap: "0.6vw" }}>
        <label className="block">
          <span className="mb-1 block text-white/60" style={{ fontSize: "0.75vw" }}>
            Client&apos;s email
          </span>
          <input
            name="client_email"
            type="email"
            required
            placeholder="client@example.com"
            className="w-full rounded-md border border-royal-light/30 bg-navy px-3 py-2 text-white outline-none placeholder:text-white/30 focus:border-royal-light"
            style={{ fontSize: "0.85vw" }}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(false)}
            className="rounded-md px-3 py-1.5 text-white/60 hover:text-white"
            style={{ fontSize: "0.8vw" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-royal px-3 py-1.5 font-display text-white transition hover:bg-royal-dark disabled:opacity-60"
            style={{ fontSize: "0.8vw" }}
          >
            {pending ? "Linking…" : "Link client"}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div id="barber-clients-page">
      {/* Same technique as the Barber Dashboard/My Profile: the shared
          barber nav lives in layout.tsx, which every other barber
          route still needs, so it's hidden for this specific page
          only via this scoped rule rather than editing the shared
          layout. */}
      <style>{`
        div:has(> #barber-clients-page) > nav {
          display: none;
        }
      `}</style>

      {/* Mobile — simple functional placeholder; the immersive layered
          design below is desktop-only, matching the Barber Dashboard
          and My Profile. */}
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
              src="/dashboard/polar-barber-clients-ui-mastered.png"
              alt="Clients"
              fill
              priority
              className="object-contain"
            />

            {/* Search — fully transparent so the mastered artwork
                (including its own baked placeholder text) is the only
                thing visually drawing this control; the placeholder
                is set to transparent so it never doubles up with the
                baked text, while typed value text stays visible. */}
            <div className="absolute flex items-center" style={SEARCH_BOX}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients..."
                aria-label="Search clients"
                className="h-full w-full border-none bg-transparent text-white shadow-none outline-none placeholder:text-transparent focus:border-none focus:shadow-none focus:outline-none focus:ring-0"
                style={{ fontSize: "1vw", paddingLeft: "7.5%" }}
              />
            </div>

            {/* Add Client — the same existing link-by-email flow,
                triggered from either baked button (header, and the
                empty-state's own centred button when there are no
                clients yet). */}
            <button type="button" aria-label="Add client" onClick={() => setAddOpen((v) => !v)} className={HIT_AREA_CLASS} style={HEADER_ADD_CLIENT_BOX} />
            {!hasAnyClients && (
              <button type="button" aria-label="Add client" onClick={() => setAddOpen((v) => !v)} className={HIT_AREA_CLASS} style={EMPTY_ADD_CLIENT_BOX} />
            )}
            {addClientForm}

            {/* A-Z index — jumps the scrollable list below to the
                first client in that letter group; letters with no
                match are inert. */}
            <div className="absolute flex flex-col" style={INDEX_COL_BOX}>
              {ALPHABET.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  aria-label={`Jump to ${letter}`}
                  disabled={!availableLetters.has(letter)}
                  onClick={() => jumpToLetter(letter)}
                  className="flex-1 disabled:cursor-default"
                />
              ))}
            </div>

            {/* Client list — only rendered with real rows once there
                is at least one real client; otherwise the mastered
                asset's own accurate empty-state artwork ("No clients
                yet") is left exactly as supplied, untouched. */}
            {hasAnyClients && (
              <div ref={listRef} className="absolute overflow-y-auto" style={LIST_BOX}>
                {filtered.length === 0 ? (
                  <p className="text-white/50" style={{ padding: "1.5%", fontSize: "0.95vw" }}>
                    No clients match &quot;{query}&quot;.
                  </p>
                ) : (
                  ALPHABET.map((letter) => {
                    const items = groups.get(letter) ?? [];
                    if (items.length === 0) return null;
                    return (
                      <div key={letter} id={`client-group-${letter}`}>
                        <p
                          className="sticky top-0 bg-[#020c1c]/95 font-display text-royal-light"
                          style={{ padding: "0.6% 1.5%", fontSize: "0.85vw" }}
                        >
                          {letter}
                        </p>
                        <ul>
                          {items.map((client) => (
                            <li key={client.id} className="border-b border-white/5">
                              <Link
                                href={`/dashboard/barber/clients/${client.id}`}
                                className="block text-white transition hover:bg-white/5"
                                style={{ padding: "1% 1.5%", fontSize: "1vw" }}
                              >
                                {client.full_name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
