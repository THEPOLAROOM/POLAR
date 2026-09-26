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
 * Returns { linked } from the function's own boolean: true when the
 * client is now in this barber's list (newly or already linked), false
 * when no POLAR client account has that email. It deliberately does not
 * say which of "no such email" / "not a client account" applies — the
 * barber learns no more than the Client Directory already shows them.
 * The client keeps ownership of their own account; nothing is created.
 */
export async function linkClientByEmail(formData: FormData): Promise<{ linked: boolean } | { error: string }> {
  const email = String(formData.get("client_email") ?? "").trim();
  if (!email) {
    return { error: "Enter the client's email." };
  }

  const { supabase } = await requireRole("barber");

  const { data, error } = await supabase.rpc("link_client_by_email", { client_email: email });
  if (error) {
    console.error("linkClientByEmail failed:", error.message);
    return { error: "Could not add the client. Please try again." };
  }

  revalidatePath("/dashboard/barber/clients");
  return { linked: data === true };
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
