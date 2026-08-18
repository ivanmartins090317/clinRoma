import { createAdminClient } from "@/lib/supabase/admin";

export async function expirePendingSlotOffers(): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("expire_pending_slot_offers");

  if (error) {
    throw new Error("Não foi possível expirar ofertas pendentes");
  }

  return typeof data === "number" ? data : 0;
}

export async function expirePendingSlotOffersFallback(): Promise<number> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: expiredOffers, error: fetchError } = await supabase
    .from("slot_offers")
    .select("id, waitlist_entry_id")
    .eq("status", "pending")
    .lt("expires_at", now);

  if (fetchError) {
    throw new Error("Não foi possível buscar ofertas expiradas");
  }

  if (!expiredOffers?.length) {
    return 0;
  }

  const offerIds = expiredOffers.map((offer) => offer.id);
  const entryIds = [
    ...new Set(expiredOffers.map((offer) => offer.waitlist_entry_id)),
  ];

  const { error: offerError } = await supabase
    .from("slot_offers")
    .update({ status: "expired" })
    .in("id", offerIds);

  if (offerError) {
    throw new Error("Não foi possível marcar ofertas como expiradas");
  }

  const { error: entryError } = await supabase
    .from("waitlist_entries")
    .update({ status: "waiting", updated_at: now })
    .in("id", entryIds)
    .eq("status", "offered");

  if (entryError) {
    throw new Error("Não foi possível atualizar entradas da fila");
  }

  return expiredOffers.length;
}
