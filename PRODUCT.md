# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **The barber (primary, V1: one POLAR London barber).** Runs their own chair/shop and uses POLAR through the working day: calendar and bookings, walk-ins, breaks and blocked time, client records, services, availability, and business analytics. Mostly desktop at the shop; phone views exist as simpler fallbacks.
- **The barber's clients.** Book, reschedule and cancel appointments, see their barber and services, and hold a POLAR Card (client ID). They reach POLAR on phone and desktop.
- Multi-barber / multi-shop is a later stage. V1 targets one fixed barber (`POLAR_BARBER_PROFILE_ID`).

## Product Purpose

POLAR is the barber's own booking and client-management system wrapped in the POLAR brand. It replaces a generic booking app with one that runs the chair: bookings, walk-ins, rescheduling, no-shows, client records and truthful business insight. It gives clients a premium, branded way to book and hold their POLAR identity.

## Positioning

**The premium POLAR brand world is the product experience, not decoration.** POLAR's identity carries every screen: the street and graffiti art, the mastered artwork, the neon and the POLAR bear. A generic booking tool cannot copy that.

## Operating Context

- The barber works between clients at the shop, on a desktop or laptop. Clients book from their phone or a desktop.
- The barber enters every surface from the POLAR Room dashboard hub. Barber pages open as focused panels over the room, and each panel's ✕ returns to the hub.
- Visual masters are supplied by the owner as mastered artwork images, for example `design-masters/barber-calendar-master.png`. They are the approved visual authority for their surface.

## Capabilities and Constraints

- **Stack:** Next.js (App Router) and Supabase, deployed on Vercel. Auth and role gating use `requireRole`. Data access relies on RLS and SECURITY DEFINER RPCs.
- **Barber capabilities:**
  - Calendar: Day, Week, Month, List and Year views; Add Appointment, Walk-In and Barter; Block Time and breaks; Reschedule; Mark No Show; Capacity View.
  - Services, clients and records: Services management, the Client Phone Book and client records, Barber Insights and custom fields, Availability, Workflow Mode.
  - My Profile: Personal Details and the POLAR CV.
  - Smart Analytics.
- **Client capabilities:** booking, My Appointments (reschedule and cancel), Your Barber, Services, POLAR Card/Profile.
- **Truthfulness:**
  - Analytics metrics show only real, calculable data, and each documents its V1 meaning.
  - Walk-ins count as £0.
  - "Completed" means the appointment's time has passed.
  - Working Hours means availability minus breaks and blocked time.
- **Undecided:**
  - A Settings page for clients (the tablet).
  - Password reset.
  - Clients editing their own profile.
  - An entry point to `/availability`.

## Brand Commitments

- The name is POLAR (POLAR London), with the POLAR bear mascot, the crown mark and street/graffiti art.
- **The owner's approved masters are binding.**
  - Build them faithfully.
  - Artwork such as lettering, frames, drips and splatter is cut from the master, never approximated with CSS or fonts.
  - Controls, text and data are live HTML.
  - Do not redesign or add to a master without approval.
  - An approved master image outranks any written brief. When a brief and a master conflict, ask the owner; never resolve it silently. Build to the master measurably, and record owner-approved differences in a deviation register.
- **POLAR UI design rule (locked 2026-09-28).**
  - **Calendar is the master for design language, not colour.** Translate its frame construction, header composition, paint/drip/splatter treatment, border depth and glow, spacing, typography hierarchy, button construction and neon finish into each page's own colour.
  - **Every page keeps its existing dominant colour.** Blue stays blue, cyan stays cyan, pink stays pink, and a deliberate combination stays that combination. Inspect the page and name its colour before changing it. Clients is blue/cyan.
  - **No random pink and blue mixing.** A secondary colour only appears where it has a functional or design purpose. The result is one POLAR system with different page colour identities.
  - **Official POLAR display lettering** (`design-masters/polar-display-alphabet.png`, A–Z plus example CALENDAR and CLIENTS titles) is used for major page titles. Never substitute a generic graffiti/brush font. Functional UI text stays readable (Barlow / Barlow Condensed).
  - **Restyle only.** Never change functionality, data, routes, actions, permissions or backend logic to match Calendar.
  - The base is extremely dark POLAR navy, never black.

## Evidence on Hand

- **Mastered artwork:**
  - Calendar (`design-masters/`).
  - Smart Analytics, POLAR CV and the Client Dashboard. These are held by the owner; implementations are under `src/app/dashboard/**`.
  - The POLAR Room scenes in `public/dashboard/`.
- **Absent:** customer testimonials, reviews, pricing plans, press and client ratings. Do not fabricate them.

## Product Principles

1. The brand world is the product. Every surface should feel unmistakably POLAR.
2. Faithful beats clever. The approved master wins over any designer's taste.
3. Never fake data, controls or claims. An empty state is better than an invented number or a dead button.
4. Preserve what works. A redesign restyles; it never silently drops a pathway, field or action.
5. The barber's time is short. The core actions (book, walk-in, reschedule, cancel, no-show) stay one or two steps away.
