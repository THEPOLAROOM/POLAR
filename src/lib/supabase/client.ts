import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components.
 * Reads the public (anon/publishable) key only — RLS policies govern
 * what this client can actually see or change. Never use the
 * service-role key here.
 *
 * NOTE (Stage 1 deployment fix): reads
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (current Supabase/Vercel naming)
 * rather than the older NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
