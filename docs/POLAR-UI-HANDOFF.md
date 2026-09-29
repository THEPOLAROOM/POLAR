# POLAR UI — development handoff (source of truth)

Last updated: 2026-09-29 (My Profile rebuilt to its approved master). This file preserves the working state and decisions from a long Claude Code session, so a fresh session can continue without it.

Product truth, users, brand commitments and the locked **POLAR UI design rule** are in [`PRODUCT.md`](../PRODUCT.md). Read that first; this file does not repeat it.

## 1. Where things are

| What | Where |
|---|---|
| Production | www.thepolaroom.com. Vercel project `polar1` (also `polar`) deploys `main` automatically. Supabase project `jhgqxsdzmpxdfsasreeg`. |
| Main checkout | `C:/Users/New Guest/Documents/GitHub/POLAR` (branch `main`) |
| Design worktree | `C:/Users/New Guest/Documents/GitHub/POLAR-barber-redesign` (git worktree; its `node_modules` is a junction to the main checkout's) |
| Approved visual masters | `design-masters/barber-calendar-master.png` (Calendar), `design-masters/polar-display-alphabet.png` (official A–Z lettering), `design-masters/my-profile-hub-concept.png` (**My Profile visual master**: it outranks any written brief) |
| Asset-generation scripts | `design-masters/tools/*.cjs` (see §5) |
| Generated UI artwork | `public/dashboard/polar-ui/` |

**Rollback tags:** `pre-barber-redesign-2026-09-28`, `pre-clients-redesign-2026-09-28`, `pre-services-redesign-2026-09-28`, `pre-my-profile-2026-09-29`, `pre-my-profile-fidelity-2026-09-29`.

## 2. Page status

| Page | Route | State | Colour identity |
|---|---|---|---|
| Calendar | `/dashboard/barber/calendar` | **Master / approved.** On `PolarStage`, with Reschedule and Mark No Show in the appointment details. | Hot pink |
| Clients | `/dashboard/barber/clients` | **Approved and live.** On `PolarStage`, with the official CLIENTS title. | Blue/cyan |
| My Services | `/dashboard/barber/services` | **Live** (commit `1f66971`), same system. | Hot pink (blue only on the Active status) |
| My Profile | `/dashboard/barber/account` | **Live, rebuilt to its master** (see §4). The owner reviews it on production and sends final edits. | Blue/cyan with the master's own pink/blue splatter |
| Workflow Mode | `/dashboard/barber/shift` | Leave as it is (user instruction). | — |
| POLAR Room hub | `/dashboard/barber` | Leave as it is. | — |
| Smart Analytics, POLAR CV, Personal Details | — | Earlier dedicated designs; untouched by the redesign. | cyan/pink family |
| Old `/schedule` + barber reschedule page | — | Keep until the user confirms signed-in tests of Calendar Reschedule and No Show; then retire them. | — |

A wide pink restyle of every Barber page (`b72259c`) was **rolled back** (`5dfbbe7`). Pages are redone **one at a time**, each approved by the user.

## 3. How a page is built in this system (proven on Calendar, Clients and Services)

- **Stage:** `src/components/polar-ui/polar-stage.tsx`. The page is authored at the master's native **1672 × 941 px** and scaled uniformly to fit the viewport. It handles full screen (with Esc, remembered for the tab) and the ✕ button.
  - Every control is live HTML at native-px boxes. Reuse the Calendar geometry:
    - header bar at y 102–211;
    - toolbar row at y 227 (height 55);
    - body box at (134, 308), 1419 × 531.
- **Chrome:** the master's own frame, drips, header bar and corner paint, re-tinted to POLAR navy `#060b1e` and translated to the page's colour. Holes are cut where live UI sits. The Calendar master's lettering and icon are removed for other pages.
- **Title:** the official POLAR display lettering, built from `polar-display-alphabet.png` with `design-masters/tools/alpha-title.cjs`.
  - White/silver brush body with a solid near-black outline of about 6px.
  - An offset coloured edge on the lower-left, in the page colour.
  - The alphabet's own paint flecks.
  - Size it to the **visual letter height of CALENDAR/CLIENTS** (a letter core of about 72px on the stage). Let it break out of the header bar's top edge. Put the crown right after the title.
- **Typography:**
  - UI text uses **Barlow Condensed**, as on Calendar. Calendar's month title uses Barlow 800 italic.
  - The display lettering is **only** used for major page titles.
  - **Never** use Permanent Marker or any stand-in brush font.
- **Colour:** keep the page's existing dominant colour. Secondary colours appear only where they have a function. See PRODUCT.md.
- **Phone views:** the `sm:hidden` layouts are kept functional; they have not been redesigned.
- **Verification before any deploy** (user expectation):
  - Run a headless test script covering every control: search, sort, dialogs, full screen with Esc, ✕ target.
  - Take screenshots at 1672, 1366, 1920 and 390 px wide.
  - Confirm no console errors, no horizontal overflow, and that `next build` passes.
  - Commit only that page's files. Deploy by fast-forwarding `main` and pushing.

## 4. My Profile hub (rebuilt to its master, 2026-09-29)

**Source of truth:** `design-masters/my-profile-hub-concept.png` is the visual master. Written briefs never override it; raise any conflict with the owner. A first build (`72fa02a`) treated the concept as loose inspiration: it re-lit POLAR, approximated the strips in CSS and diverged badly. It was replaced.

**How it's built.** Layers, back to front, on the 1672 × 941 stage in `account/profile-view.tsx`:
1. **Room:** `/dashboard/profile-room-v1.webp`, the untouched file, positioned at +276, +35 so POLAR stands centred.
2. **Room treatment:** CSS only. The scene's edges fade into navy, and the clear zone either side of POLAR is darkened to the master's levels.
3. **Back-glow:** blue light behind POLAR.
4. **POLAR:** the same untouched file again, clipped by `profile-polar-matte.webp` (CSS mask). His pixels are exactly the source's; the fidelity test proves 0 difference.
5. **Connectors:** SVG at the master's measured paths.
6. **Strip panels:** a CSS dark panel for each strip.
7. **Strip art:** `profile-strip-*.webp`, the frame, glow, splatter and drips cut from the master.
8. **Live controls:** icon, label and chevron at the master's measured boxes. Each `<a>` spans the master's frame box.
9. **Title:** `profile-title.webp` (official alphabet) at the master's letter-core height (101 px), centred on the master's letters. Then the crown.
10. **✕:** top right.

All geometry lives in `account/profile-hub-spec.json`, measured from the master by `design-masters/tools/my-profile-*.cjs`. Don't hand-tune it; re-measure. The stage is contain-scaled and placed on whole pixels (a half-pixel offset resamples every layer). Below 1024 px wide, a separate list layout is shown.

**Fidelity gate:** run `node design-masters/tools/my-profile-fidelity.cjs <url-of-a-page-rendering-ProfileView> <outDir>`, with `PLAYWRIGHT_CORE` and `CHROMIUM` set. It scores the render against the master and writes a report, an onion-skin and a diff heatmap. It exits 1 on any failure. **57/57 passed** at deploy:
- strip art error ≤ 1 where opaque;
- POLAR pixels exact;
- labels, icons and chevrons within 3 px;
- title core 100 vs 101 px;
- strip pink 99% of the master's.

**Deviation register:** owner-approved differences from the master, 2026-09-29.
- **D1/D4 POLAR:** production POLAR at 1:1, untouched. Not the master's re-rendered POLAR (his head sits about 25 px higher).
- **D4 Room:** the untouched production room. It doesn't have the master's layout (left lamp/chair, right shelves and pink cabinet, brighter floor). The left 276 px and the top and bottom edges fade to navy.
- **D2 Title:** the official alphabet at the master's letter height. It's wider than the master's lettering and has no splatter halo.
- **D3 Pink:** the master's own pink/blue strip splatter is the target, replacing the old "90% blue / tiny pink" brief.
- **SETTINGS strip:** the lower drips are truncated and the top glow thinned, because floor reflections contaminate the master there.
- **D5 ✕:** not in the master; placed top right.

Any other visible difference from the master is a bug.

**Workflow (owner, 2026-09-29):** implement, test, then deploy. The owner reviews on production, not locally, and sends final edits from there. Tag a rollback point before each deploy.

**Where each area goes:**

| Control | Route | State |
|---|---|---|
| DETAILS | `/dashboard/barber/account/personal-details` | **Name editing** lives here: a "Your Name" field saved by the existing `updateBarberName`. It replaces the hub's old Edit Profile dialog. |
| CAREER | `/dashboard/barber/account/professional-profile` | Exists (POLAR CV). Credentials and qualifications live here. |
| ePORTFOLIO | `/dashboard/barber/account/eportfolio` | Live: an honest empty state (no portfolio storage exists yet). Adding uploads is future work that needs storage first. |
| ANALYTICS | `/dashboard/barber/calendar/analytics` | Exists. |
| SETTINGS | `/dashboard/barber/account/settings` | Live: signed-in email and Log out (`logout` in `src/lib/actions/auth.ts`). Visibility and emergency contact have **no storage**, so they are not shown. |

**Files:** `account/page.tsx` (navigation only), `account/profile-view.tsx` (hub: desktop stage + list layout below 1024 px), `account/profile-hub-spec.json` (measured geometry), `account/account-subpage.tsx` (shared shell for SETTINGS/ePORTFOLIO in the Personal Details visual family), `settings/*`, `eportfolio/*`, and the name field in `personal-details/*`.

**Open:** the signed-in round trip of the DETAILS name save still needs checking with a real barber login (the form wiring was verified; the action itself is unchanged).

## 5. Asset scripts (`design-masters/tools/`)

These are Node scripts using the repo's `sharp`. The older ones (Calendar, Clients, Services, titles) have paths pointing at the old session's scratchpad and the design worktree, so **edit their paths before running**. The `my-profile-*` scripts use repo-relative paths.

| Script | Produces |
|---|---|
| `calendar-chrome.cjs` | Calendar chrome, period splash and corner splat from the master |
| `page-chrome-blue.cjs` / `page-chrome-pink.cjs` | Master chrome without the Calendar lettering, in blue (Clients) or pink (Services), plus the crown and corner splat |
| `alpha-title.cjs WORD pink\|blue\|bluepink out.webp` | A title built from the official alphabet. Environment variables: `OVERLAP` (default 0.27; use about 0.1 when a letter's bowl gets covered, e.g. the P in PROFILE) and `BODY_MIN` (default 92; use 66 for grey-shaded strokes). |
| `clients-title.cjs` | CLIENTS, cut from the alphabet sheet's own example title |
| `my-profile-strips.cjs` | My Profile strip art cut from the master, plus the measured strip boxes (run with no arguments) |
| `my-profile-matte.cjs` | The POLAR silhouette matte (alpha mask) for `profile-room-v1.webp` |
| `my-profile-connectors.cjs` | Measures the master's connector paths and dots |
| `my-profile-fidelity.cjs` | The My Profile fidelity gate (see §4) |

`profile-hub-room.cjs` and its baked `profile-hub-room.webp` are **retired**. They re-lit and recoloured POLAR, which isn't allowed. They remain in git history only.

## 6. Mistakes not to repeat

- Don't make every page pink because Calendar is pink.
- Don't approximate master artwork with CSS or fonts: no Permanent Marker, no drawn crowns.
- Don't redesign several pages at once. Do one page, get approval, then move on.
- Don't restyle shared components (for example `FocusModeShell`) as a side effect; the old shell still serves pages that haven't been redesigned.
- Don't add or remove functionality during a visual pass. Restyle only.
- Newly added `public/` files are not served by a running `next dev`; restart it with `.next` cleared.
- The shared Playwright MCP browser can be locked by another session. Use `playwright-core` headless from a script instead.
- Test harness pages (`src/app/pilot-preview/`, `public/review/`) exist only in the design worktree. **Never commit them.**
- **Never treat an approved master as "inspiration".** Measure it, build to it, and score the render against it. Don't claim "matches" without the fidelity numbers.
- **Never bake transformations into approved art** (re-lighting, recolouring, reframing). Position and treat it with non-destructive CSS layers, so the source file stays byte-identical.
- Tailwind's preflight gives every `<img>` `max-width: 100%`. Absolutely positioned art larger than its parent gets squeezed, so set `max-width: none`.
- Centring a stage with `top: 50%` plus `translate(-50%)` on an odd viewport height leaves a half-pixel offset that blurs every layer. Place the stage on whole pixels.

## 7. Other open items

- Signed-in verification of Calendar **Reschedule**, **Mark No Show** and the Cancel refresh is still pending. After it passes, retire `/dashboard/barber/schedule` and the barber reschedule page.
- `/dashboard/barber/availability` has no navigation entry point yet; that's the user's decision.
- The Client-side audit (2026-09-28) found:
  - no desktop Book entry on the Client Dashboard;
  - client logout not reachable;
  - Book and client reschedule offer only the start of each availability window;
  - future bookings listed under "Previous".

  None of these are fixed yet.
- The main checkout has **uncommitted local changes that belong to the user or another session**. Don't commit or discard them:
  - `src/app/dashboard/barber/page.tsx`, `schedule/page.tsx`;
  - `src/lib/actions/auth.ts` (logout redirects to `/`), `custom-fields.ts`, `walk-ins.ts`;
  - `src/lib/queries/barber-schedule.ts`, `.impeccable/config.json`;
  - untracked `supabase/migrations/*`, `src/app/dev-preview/`, `src/app/redesign-preview/`, `src/components/landing-redesign/`.
