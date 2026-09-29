# POLAR UI — development handoff (source of truth)

Last updated: 2026-09-29. This file preserves the working state and decisions from a long Claude Code session, so a fresh session can continue without it.

Product truth, users, brand commitments and the locked **POLAR UI design rule** are in [`PRODUCT.md`](../PRODUCT.md). Read that first; this file does not repeat it.

## 1. Where things are

| What | Where |
|---|---|
| Production | www.thepolaroom.com. Vercel project `polar1` (also `polar`) deploys `main` automatically. Supabase project `jhgqxsdzmpxdfsasreeg`. |
| Main checkout | `C:/Users/New Guest/Documents/GitHub/POLAR` (branch `main`) |
| Design worktree | `C:/Users/New Guest/Documents/GitHub/POLAR-barber-redesign` (git worktree; its `node_modules` is a junction to the main checkout's) |
| Approved visual masters | `design-masters/barber-calendar-master.png` (Calendar), `design-masters/polar-display-alphabet.png` (official A–Z lettering), `design-masters/my-profile-hub-concept.png` (My Profile composition concept) |
| Asset-generation scripts | `design-masters/tools/*.cjs` (see §5) |
| Generated UI artwork | `public/dashboard/polar-ui/` |

**Rollback tags:** `pre-barber-redesign-2026-09-28`, `pre-clients-redesign-2026-09-28`, `pre-services-redesign-2026-09-28`.

## 2. Page status

| Page | Route | State | Colour identity |
|---|---|---|---|
| Calendar | `/dashboard/barber/calendar` | **Master / approved.** On `PolarStage`, with Reschedule and Mark No Show in the appointment details. | Hot pink |
| Clients | `/dashboard/barber/clients` | **Approved and live.** On `PolarStage`, with the official CLIENTS title. | Blue/cyan |
| My Services | `/dashboard/barber/services` | **Live** (commit `1f66971`), same system. | Hot pink (blue only on the Active status) |
| My Profile | `/dashboard/barber/account` | **IN PROGRESS, not deployed** (see §4). | Blue/cyan, with a very subtle POLAR pink accent |
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

## 4. CURRENT TASK — My Profile hub (unfinished)

**Where the code is:** in the design worktree, on local branch **`profile-hub`**, committed there as a WIP commit. **Not pushed, not deployed.**

**Spec (user-approved, 2026-09-28):** My Profile becomes a visual navigation hub, "POLAR's profile world after closing time".
- **Background:** the production POLAR scene, much darker, with POLAR centred and lit and large clear space around him.
  - `public/dashboard/polar-ui/profile-hub-room.webp` is baked from `profile-room-v1.webp` by `tools/profile-hub-room.cjs`, at native resolution with POLAR at stage centre.
  - The official POLAR character is the identity source: arctic-white fur, glowing electric-blue eyes with no pupils, navy POLAR tracksuit, crown branding. Never substitute an AI-redrawn bear. **Production assets beat the concept image.**
- **Title:** MY PROFILE in the official lettering (`profile-title.webp`, blue edge, subtle pink flecks). The display lettering appears **only** here on this page.
- **Exactly five controls:** DETAILS, CAREER, ePORTFOLIO, ANALYTICS, SETTINGS.
  - The last design brief says **CAREER** replaces "Professional". A later migration note said "PROFESSIONAL"; **confirm with the user** which label is final.
  - Each control is **icon + title + arrow only**: no descriptions, no "Coming soon". Controls are compact and content-fitted, and use Barlow Condensed.
- **Layout:**
  - DETAILS upper-left, CAREER upper-right, ePORTFOLIO lower-left, ANALYTICS lower-right, SETTINGS bottom-centre. The hub is laid out to match the concept's composition.
  - Connector lines are thin, straight, 90° cyan lines that **stop clearly before POLAR** (never touching him or his rim light).
- **Colour:** about 90% dark/blue/cyan. Only a tiny POLAR-magenta accent (never red).
- **The hub shows no data:** no name, address, photo, bio, credentials, charts or toggles.

**Where each area goes:**

| Control | Route | State |
|---|---|---|
| DETAILS | `/dashboard/barber/account/personal-details` | Exists. The WIP moves **name editing** here: a "Your Name" field that saves through the existing `updateBarberName`. It replaces the hub's old Edit Profile dialog. |
| CAREER | `/dashboard/barber/account/professional-profile` | Exists (POLAR CV). Credentials and qualifications live here. |
| ePORTFOLIO | `/dashboard/barber/account/eportfolio` | **Page not created yet.** No portfolio storage exists. It needs an honest empty state, not an invented feature. |
| ANALYTICS | `/dashboard/barber/calendar/analytics` | Exists. |
| SETTINGS | `/dashboard/barber/account/settings` | **Page not created yet.** Real content available today: signed-in email and Log out (`logout` in `src/lib/actions/auth.ts`). Visibility and emergency contact have **no storage**, so don't fake them. Record any such gaps rather than inventing them. |

**The WIP so far:**
- `account/page.tsx` is now navigation only.
- `account/profile-view.tsx` has been rewritten as the hub (desktop stage plus a phone list).
- `personal-details/page.tsx` and `personal-details-view.tsx` have the name field.
- New assets: `profile-hub-room.webp`, `profile-title.webp`.
- Type-check passes. It has **not** been rendered, screenshot or tested yet.

**Next steps:**
1. Confirm CAREER vs PROFESSIONAL with the user.
2. **Get approval for the background re-framing.** `profile-hub-room.webp` re-frames and darkens the approved `profile-room-v1.webp` so POLAR stands centred. The owner's standing rule is never to crop or reframe approved artwork without asking, and this was done without asking. Show it to the user and get approval, or have the user supply a centred-POLAR production scene.
3. Create the ePORTFOLIO and SETTINGS pages. Use honest content only, with ✕ back to `/dashboard/barber/account`.
4. Render the hub at 1672 × 941 and compare it with `my-profile-hub-concept.png`.
5. Check the connectors stop clear of POLAR and that there is no dead space in the controls.
6. Test all five links, the ✕, the phone list, and the Details name save.
7. Build, commit only these files, and deploy. The user asked for deploy once testing passes.

## 5. Asset scripts (`design-masters/tools/`)

These are Node scripts using the repo's `sharp`. Paths inside them point at the old session's scratchpad and at the design worktree, so **edit the paths before running**.

| Script | Produces |
|---|---|
| `calendar-chrome.cjs` | Calendar chrome, period splash and corner splat from the master |
| `page-chrome-blue.cjs` / `page-chrome-pink.cjs` | Master chrome without the Calendar lettering, in blue (Clients) or pink (Services), plus the crown and corner splat |
| `alpha-title.cjs WORD pink\|blue\|bluepink out.webp` | A title built from the official alphabet. Environment variables: `OVERLAP` (default 0.27; use about 0.1 when a letter's bowl gets covered, e.g. the P in PROFILE) and `BODY_MIN` (default 92; use 66 for grey-shaded strokes). |
| `clients-title.cjs` | CLIENTS, cut from the alphabet sheet's own example title |
| `profile-hub-room.cjs` | The My Profile dark room with POLAR centred |

## 6. Mistakes not to repeat

- Don't make every page pink because Calendar is pink.
- Don't approximate master artwork with CSS or fonts: no Permanent Marker, no drawn crowns.
- Don't redesign several pages at once. Do one page, get approval, then move on.
- Don't restyle shared components (for example `FocusModeShell`) as a side effect; the old shell still serves pages that haven't been redesigned.
- Don't add or remove functionality during a visual pass. Restyle only.
- Newly added `public/` files are not served by a running `next dev`; restart it with `.next` cleared.
- The shared Playwright MCP browser can be locked by another session. Use `playwright-core` headless from a script instead.
- Test harness pages (`src/app/pilot-preview/`, `public/review/`) exist only in the design worktree. **Never commit them.**

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
