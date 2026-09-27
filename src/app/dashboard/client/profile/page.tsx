import Image from "next/image";
import { requireRole } from "@/lib/auth/require-role";

// Same centred, room-photo composition as the Client Dashboard, My
// Appointments, Client Services and Your Barber — reused so this page
// sits inside the same visual frame as its siblings rather than
// inventing a new one. No bespoke mastered UI overlay exists for a
// full profile page yet, so the content panel below is real markup
// styled with the same colour/typography tokens already used
// throughout the Client Dashboard, not a new visual language.
const OVERLAY_SCALE = 0.62;
const OVERLAY_INSET_PCT = `${((1 - OVERLAY_SCALE) / 2) * 100}%`;
const OVERLAY_INSET = {
  left: OVERLAY_INSET_PCT,
  right: OVERLAY_INSET_PCT,
  top: OVERLAY_INSET_PCT,
  bottom: OVERLAY_INSET_PCT,
  transform: "translateY(6dvh)",
};

const PANEL_BG = "#000E18";
const POLAR_ID_PLACEHOLDER = "P-000000";

type FieldRow = { label: string; value: string | null };

function Field({ label, value }: FieldRow) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between border-b border-white/5 last:border-b-0" style={{ padding: "1.2% 0" }}>
      <span className="font-body text-white/50" style={{ fontSize: `${0.85 * OVERLAY_SCALE}vw` }}>{label}</span>
      <span className="font-body text-white/80" style={{ fontSize: `${0.9 * OVERLAY_SCALE}vw` }}>{value}</span>
    </div>
  );
}

// Server-side ROLE check happens FIRST, same as every other protected
// dashboard page. Read-only: no edit action exists here or anywhere
// client-side for this data — the only existing edit capability for
// client_profile_details is barber-initiated (updateClientProfileDetails
// in src/lib/actions/client-profile.ts), which this page does not use
// or expose. Every read below is scoped to auth.uid() (the caller's
// own row) via both the query and the existing "read own" RLS
// policies on profiles/client_addresses/client_profile_details — a
// client can only ever retrieve their own data through this page,
// the same boundary every other client page already relies on.
// client_balances and custom_field_values are deliberately not read
// here at all: both are barber-private data with no client-facing RLS
// policy of any kind, so they are correctly inaccessible, not merely
// hidden.
export default async function ClientProfilePage() {
  const { supabase, user } = await requireRole("client");

  const [{ data: profile }, { data: address }, { data: details }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, polar_id").eq("id", user.id).maybeSingle(),
    supabase
      .from("client_addresses")
      .select("address_line_1, address_line_2, town_city, county_region, postcode, country")
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase
      .from("client_profile_details")
      .select("hair_type, hair_density, hair_colour, scalp_condition, skin_sensitivity, allergies, emergency_contact")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  const fullName = profile?.full_name ?? null;
  const phone = profile?.phone ?? null;
  const polarId = profile?.polar_id ?? POLAR_ID_PLACEHOLDER;

  const addressLine = address
    ? [
        address.address_line_1,
        address.address_line_2,
        address.town_city,
        address.county_region,
        address.postcode,
        address.country,
      ]
        .filter(Boolean)
        .join(", ")
    : null;

  const hasAnyDetails =
    !!details &&
    [
      details.hair_type,
      details.hair_density,
      details.hair_colour,
      details.scalp_condition,
      details.skin_sensitivity,
      details.allergies,
      details.emergency_contact,
    ].some(Boolean);

  return (
    <>
      {/* Mobile — plain functional placeholder, same established
          pattern already used elsewhere (Services, Your Barber) for a
          page with no bespoke mobile asset yet. */}
      <main className="mx-auto max-w-xl px-6 py-16 sm:hidden">
        <h1 className="text-xl font-semibold text-polar-text">POLAR Card</h1>

        <section className="mt-4 rounded border border-polar-border px-3 py-3">
          <p className="text-sm font-semibold text-polar-text">{fullName ?? "—"}</p>
          <p className="text-xs text-polar-muted">POLAR ID: {polarId}</p>
          {phone && <p className="mt-1 text-sm text-polar-text">{phone}</p>}
        </section>

        {addressLine && (
          <section className="mt-4 rounded border border-polar-border px-3 py-3">
            <p className="text-sm font-semibold text-polar-text">Address</p>
            <p className="mt-1 text-sm text-polar-text">{addressLine}</p>
          </section>
        )}

        <section className="mt-4 rounded border border-polar-border px-3 py-3">
          <p className="text-sm font-semibold text-polar-text">Client Details</p>
          {hasAnyDetails ? (
            <ul className="mt-1 space-y-1 text-sm text-polar-text">
              {details?.hair_type && <li>Hair type: {details.hair_type}</li>}
              {details?.hair_density && <li>Hair density: {details.hair_density}</li>}
              {details?.hair_colour && <li>Hair colour: {details.hair_colour}</li>}
              {details?.scalp_condition && <li>Scalp condition: {details.scalp_condition}</li>}
              {details?.skin_sensitivity && <li>Skin sensitivity: {details.skin_sensitivity}</li>}
              {details?.allergies && <li>Allergies: {details.allergies}</li>}
              {details?.emergency_contact && <li>Emergency contact: {details.emergency_contact}</li>}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-polar-muted">No details on file yet.</p>
          )}
        </section>
      </main>

      {/* Desktop — same POLAR Room background + centred, scaled
          content frame as the rest of the Client Dashboard. */}
      <main className="relative hidden overflow-hidden bg-navy sm:block" style={{ height: "100dvh" }}>
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full aspect-[1672/941]">
            <Image
              src="/dashboard/polar-client-dashboard-desktop-background.png"
              alt=""
              fill
              priority
              className="object-cover"
              aria-hidden="true"
            />

            <div className="absolute flex flex-col" style={OVERLAY_INSET}>
              <h1 className="font-display text-white" style={{ fontSize: `${2.2 * OVERLAY_SCALE}vw` }}>
                POLAR Card
              </h1>

              <div className="mt-[2%] flex-1 overflow-y-auto" style={{ display: "flex", flexDirection: "column", gap: "2%" }}>
                {/* Identity panel */}
                <div className="rounded-xl border border-white/10" style={{ backgroundColor: PANEL_BG, padding: "3%" }}>
                  <p className="font-display text-white" style={{ fontSize: `${1.5 * OVERLAY_SCALE}vw` }}>
                    {fullName ?? "—"}
                  </p>
                  <p className="mt-[0.5%] font-body text-royal-light" style={{ fontSize: `${0.95 * OVERLAY_SCALE}vw` }}>
                    POLAR ID: {polarId}
                  </p>
                  {phone && (
                    <p className="mt-[1%] font-body text-white/70" style={{ fontSize: `${0.9 * OVERLAY_SCALE}vw` }}>
                      {phone}
                    </p>
                  )}
                </div>

                {/* Address panel — omitted entirely (not shown as an
                    empty state) when no address is on file, same
                    pattern as Your Barber's work-address panel. */}
                {addressLine && (
                  <div className="rounded-xl border border-white/10" style={{ backgroundColor: PANEL_BG, padding: "3%" }}>
                    <p className="font-display text-white" style={{ fontSize: `${1.1 * OVERLAY_SCALE}vw` }}>
                      Address
                    </p>
                    <p className="mt-[1%] font-body text-white/70" style={{ fontSize: `${0.95 * OVERLAY_SCALE}vw` }}>
                      {addressLine}
                    </p>
                  </div>
                )}

                {/* Client Details panel */}
                <div className="rounded-xl border border-white/10" style={{ backgroundColor: PANEL_BG, padding: "3%" }}>
                  <p className="font-display text-white" style={{ fontSize: `${1.1 * OVERLAY_SCALE}vw` }}>
                    Client Details
                  </p>
                  {hasAnyDetails ? (
                    <div className="mt-[1%]">
                      <Field label="Hair type" value={details?.hair_type ?? null} />
                      <Field label="Hair density" value={details?.hair_density ?? null} />
                      <Field label="Hair colour" value={details?.hair_colour ?? null} />
                      <Field label="Scalp condition" value={details?.scalp_condition ?? null} />
                      <Field label="Skin sensitivity" value={details?.skin_sensitivity ?? null} />
                      <Field label="Allergies" value={details?.allergies ?? null} />
                      <Field label="Emergency contact" value={details?.emergency_contact ?? null} />
                    </div>
                  ) : (
                    <p className="mt-[1%] font-body text-white/50" style={{ fontSize: `${0.9 * OVERLAY_SCALE}vw` }}>
                      No details on file yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
