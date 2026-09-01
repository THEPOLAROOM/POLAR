import { requireRole } from "@/lib/auth/require-role";
import { createService, setServiceActive } from "@/lib/actions/services";

type ServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
  is_active: boolean;
};

// Server-side ROLE check happens FIRST, same as every other protected
// barber page. POLAR does not prescribe services — the barber defines
// their own; "Haircut" below is placeholder text only, never a seeded
// or default row.
//
// NOTE: the `services` table is a proposed migration awaiting
// approval — until applied, this list simply reads back empty and
// "Add a service" silently has no effect (see services.ts), rather
// than crashing the page.
export default async function MyServicesPage() {
  const { supabase, user } = await requireRole("barber");

  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_minutes, is_active")
    .eq("barber_profile_id", user.id)
    .order("name", { ascending: true });

  const myServices = (services ?? []) as ServiceRow[];

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold text-polar-text">My Services</h1>
      <p className="mt-1 text-sm text-polar-muted">
        Add the services you offer. Clients and walk-ins choose from your
        active services, and POLAR works out the finish time from the
        duration automatically.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">
          Add a service
        </h2>
        <form action={createService} className="mt-2 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-polar-text">
              Service name
            </span>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Haircut"
              className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-polar-text">
              Duration (minutes)
            </span>
            <input
              name="duration_minutes"
              type="number"
              min="1"
              step="1"
              required
              placeholder="e.g. 60"
              className="w-full rounded border border-polar-border bg-polar-surface px-3 py-2 text-sm outline-none focus:border-polar-text"
            />
          </label>
          <button
            type="submit"
            className="rounded border border-polar-border px-4 py-2 text-sm text-polar-text"
          >
            Add service
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-polar-text">
          Your services
        </h2>
        {myServices.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {myServices.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between gap-4 rounded border border-polar-border px-3 py-2"
              >
                <div>
                  <p className="text-sm text-polar-text">{service.name}</p>
                  <p className="text-xs text-polar-muted">
                    {service.duration_minutes} minutes ·{" "}
                    {service.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                <form action={setServiceActive}>
                  <input type="hidden" name="service_id" value={service.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={service.is_active ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className="rounded border border-polar-border px-3 py-1 text-xs text-polar-text"
                  >
                    {service.is_active ? "Make Inactive" : "Make Active"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-polar-muted">No services yet.</p>
        )}
      </section>
    </main>
  );
}
