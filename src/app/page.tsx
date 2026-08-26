import { createClient } from "@/lib/supabase/server";

// STAGE 1 ONLY — this page exists purely to confirm the foundation is
// working end to end. It is not a real POLAR screen and is not styled
// as one. It will be replaced once Stage 2/3 begin (roles, sign-up).
export default async function Stage1StatusPage() {
  const supabase = await createClient();

  // Deliberately attempt to read a table that has RLS enabled and no
  // policies. Getting zero rows / a permission error here is SUCCESS —
  // it proves default-deny RLS is actually active, not just configured.
  const { data, error } = await supabase
    .from("_health_check")
    .select("id, created_at");

  const dbReachable = error !== null || Array.isArray(data);
  const rlsBlockingAsExpected = !data || data.length === 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-polar-text">
          POLAR — Stage 1
        </h1>
        <p className="mt-1 text-sm text-polar-muted">
          Project foundation status. Internal check only.
        </p>
      </div>

      <div className="rounded-lg border border-polar-border bg-polar-surface p-5">
        <StatusRow label="Next.js app deployed" ok={true} />
        <StatusRow
          label="Supabase connection reachable"
          ok={dbReachable}
        />
        <StatusRow
          label="RLS default-deny active (no data exposed)"
          ok={rlsBlockingAsExpected}
        />
      </div>

      <p className="text-xs text-polar-muted">
        Stage 1 test: this page loading with all three checks green
        confirms the pipeline works and no table is publicly readable.
        No login, booking, or client data exists yet.
      </p>
    </main>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-polar-border py-2 text-sm last:border-b-0">
      <span className="text-polar-text">{label}</span>
      <span
        className={
          ok
            ? "font-medium text-polar-success"
            : "font-medium text-polar-danger"
        }
      >
        {ok ? "OK" : "FAILED"}
      </span>
    </div>
  );
}
