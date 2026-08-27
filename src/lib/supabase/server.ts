import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components, Route Handlers and
 * Server Actions. Still uses the public (anon/publishable) key — this
 * is NOT an admin/service-role client. Every query made through this
 * client is still subject to Row-Level Security for the currently
 * signed-in user.
 *
 * NOTE (Stage 1 deployment fix): Supabase/Vercel now use
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY rather than the older
 * NEXT_PUBLIC_SUPABASE_ANON_KEY name — this reads the current variable.
 *
 * A separate, explicitly-named admin client (service-role key) should
 * only ever be created later, kept server-only, and used sparingly for
 * genuinely privileged operations — never for normal request handling.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component without a mutable cookie
            // store — safe to ignore because middleware refreshes the
            // session on every request anyway.
          }
        },
      },
    }
  );
}
