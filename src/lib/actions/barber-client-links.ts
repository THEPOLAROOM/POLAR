"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

/**
 * Links the calling barber to a client account by email, via the
 * link_client_by_email() SECURITY DEFINER function — the sole write
 * path for barber_client_links (that table has no INSERT policy for
 * any role, by design). requireRole("barber") is the first check
 * here; the function's own internal has_role('barber') check (using
 * auth.uid(), not a caller-supplied id) is the second, non-bypassable
 * layer, mirroring every other action in this codebase.
 *
 * Bound directly via a <form action={...}> prop (no client
 * component), so this returns void. The function returns a bare
 * boolean that intentionally can't distinguish "no such email" from
 * "that account isn't a client" from "already linked" — there is
 * nothing safe to surface to the UI beyond "did the list change,"
 * which the barber can already see from the Client Directory itself.
 */
export async function linkClientByEmail(formData: FormData): Promise<void> {
  const email = String(formData.get("client_email") ?? "").trim();
  if (!email) {
    return;
  }

  const { supabase } = await requireRole("barber");

  await supabase.rpc("link_client_by_email", { client_email: email });

  revalidatePath("/dashboard/barber/clients");
}
