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

  const { error } = await supabase.rpc("link_client_by_email", { client_email: email });
  if (error) {
    console.error("linkClientByEmail failed:", error.message);
  }

  revalidatePath("/dashboard/barber/clients");
}

/**
 * Unlinks the calling barber from one of their own clients, via the
 * unlink_client() SECURITY DEFINER function — the sole write path for
 * removing a barber_client_links row (that table has no DELETE policy
 * for any role, by design). requireRole("barber") is the first check;
 * the function's own internal has_role('barber') check plus scoping
 * the delete to auth.uid() as the barber (never a caller-supplied id)
 * is the second, non-bypassable layer — a client can never unlink
 * themselves or anyone, and a barber can never unlink another
 * barber's client.
 *
 * Deleting the link only removes that one row: it does not touch the
 * client's bookings, profile details, address, balance, or custom
 * field values in any way, and the barber can freely relink the same
 * client later via linkClientByEmail above.
 *
 * No UI currently calls this — it is intentionally unwired pending
 * the Client Directory's visual/mastering pass, which will decide
 * where and how an unlink control is presented.
 */
export async function unlinkClient(formData: FormData): Promise<void> {
  const clientId = String(formData.get("client_id") ?? "").trim();
  if (!clientId) {
    return;
  }

  const { supabase } = await requireRole("barber");

  const { error } = await supabase.rpc("unlink_client", { p_client_profile_id: clientId });
  if (error) {
    console.error("unlinkClient failed:", error.message);
  }

  revalidatePath("/dashboard/barber/clients");
}
