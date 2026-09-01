"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

type ActionResult = { error: string } | void;

/**
 * Creates or updates the calling barber's client_balances row for one
 * linked client. Relies entirely on the existing client_balances RLS
 * policies (linked barber creates / linked barber updates) — this
 * action adds no additional app-level authorization on top of that.
 * client_balances has no client-facing policy at all, so this is
 * barber-only by construction, not just by UI convention.
 */
export async function updateClientBalance(
  formData: FormData
): Promise<ActionResult> {
  const clientId = String(formData.get("client_id") ?? "").trim();
  if (!clientId) {
    return { error: "Missing client." };
  }

  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amount = amountRaw === "" ? 0 : Number(amountRaw);
  if (!Number.isFinite(amount)) {
    return { error: "Enter a valid amount." };
  }

  const noteRaw = String(formData.get("note") ?? "").trim();

  const { supabase } = await requireRole("barber");

  const { error } = await supabase.from("client_balances").upsert({
    profile_id: clientId,
    amount,
    note: noteRaw === "" ? null : noteRaw,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/barber/clients/${clientId}`);
}
