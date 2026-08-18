import {
  formatConflictMessage,
  hasAppointmentConflict,
} from "@/features/agenda/domain/appointment-conflict";
import { isSlotOfferExpired } from "@/features/waitlist/domain/slot-offer-expiry";
import { hashSlotOfferToken } from "@/features/waitlist/domain/token-hash";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppointmentStatus } from "@/types/clinroma";

export interface AcceptSlotOfferInput {
  token: string;
  ipHash: string;
  lgpdConsent: boolean;
}

export interface DeclineSlotOfferInput {
  token: string;
  ipHash: string;
  lgpdConsent: boolean;
}

export interface SlotOfferActionResult {
  ok: boolean;
  error?: string;
  alreadyResponded?: boolean;
  response?: "accept" | "decline";
  startsAt?: string;
  endsAt?: string;
}

interface OfferRow {
  id: string;
  waitlist_entry_id: string;
  offered_at: string;
  ends_at: string;
  dentist_id: string;
  expires_at: string;
  status: string;
  appointment_id: string | null;
  waitlist_entries: {
    id: string;
    patient_id: string;
    status: string;
  } | null;
}

interface AppointmentRow {
  id: string;
  dentist_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
}

async function loadOfferByToken(token: string): Promise<OfferRow | null> {
  const supabase = createAdminClient();
  const tokenHash = hashSlotOfferToken(token);

  const { data, error } = await supabase
    .from("slot_offers")
    .select(
      "id, waitlist_entry_id, offered_at, ends_at, dentist_id, expires_at, status, appointment_id, waitlist_entries(id, patient_id, status)",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const entry = Array.isArray(data.waitlist_entries)
    ? (data.waitlist_entries[0] ?? null)
    : data.waitlist_entries;

  return {
    ...data,
    waitlist_entries: entry,
  };
}

async function loadActiveAppointments(
  dentistId: string,
): Promise<AppointmentRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, dentist_id, starts_at, ends_at, status")
    .eq("dentist_id", dentistId);

  if (error) {
    throw new Error("Não foi possível validar horários");
  }

  return (data ?? []) as AppointmentRow[];
}

async function revertEntryToWaiting(entryId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("waitlist_entries")
    .update({ status: "waiting", updated_at: new Date().toISOString() })
    .eq("id", entryId)
    .eq("status", "offered");
}

export async function acceptSlotOffer(
  input: AcceptSlotOfferInput,
): Promise<SlotOfferActionResult> {
  if (!input.lgpdConsent) {
    return { ok: false, error: "Consentimento LGPD é obrigatório" };
  }

  const offer = await loadOfferByToken(input.token);

  if (!offer?.waitlist_entries) {
    return { ok: false, error: "Link inválido ou expirado" };
  }

  if (offer.status === "accepted") {
    return {
      ok: true,
      alreadyResponded: true,
      response: "accept",
      startsAt: offer.offered_at,
      endsAt: offer.ends_at,
    };
  }

  if (offer.status === "declined") {
    return {
      ok: true,
      alreadyResponded: true,
      response: "decline",
    };
  }

  if (offer.status !== "pending") {
    return { ok: false, error: "Link inválido ou expirado" };
  }

  if (isSlotOfferExpired(new Date(offer.expires_at))) {
    const supabase = createAdminClient();
    await supabase
      .from("slot_offers")
      .update({ status: "expired" })
      .eq("id", offer.id);
    await revertEntryToWaiting(offer.waitlist_entry_id);

    return { ok: false, error: "Link inválido ou expirado" };
  }

  const appointments = await loadActiveAppointments(offer.dentist_id);
  const conflict = hasAppointmentConflict(
    {
      dentistId: offer.dentist_id,
      startsAt: new Date(offer.offered_at),
      endsAt: new Date(offer.ends_at),
    },
    appointments.map((appointment) => ({
      id: appointment.id,
      dentistId: appointment.dentist_id,
      startsAt: new Date(appointment.starts_at),
      endsAt: new Date(appointment.ends_at),
      status: appointment.status,
    })),
  );

  if (conflict) {
    const supabase = createAdminClient();
    await supabase
      .from("slot_offers")
      .update({ status: "expired" })
      .eq("id", offer.id);
    await revertEntryToWaiting(offer.waitlist_entry_id);

    return {
      ok: false,
      error: "Horário não está mais disponível",
    };
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      patient_id: offer.waitlist_entries.patient_id,
      dentist_id: offer.dentist_id,
      starts_at: offer.offered_at,
      ends_at: offer.ends_at,
      status: "confirmed",
      notes: "Encaixe via fila Kanban",
    })
    .select("id")
    .single();

  if (appointmentError || !appointment) {
    if (appointmentError?.code === "23P01") {
      await supabase
        .from("slot_offers")
        .update({ status: "expired" })
        .eq("id", offer.id);
      await revertEntryToWaiting(offer.waitlist_entry_id);

      return {
        ok: false,
        error: "Horário não está mais disponível",
      };
    }

    return { ok: false, error: "Não foi possível confirmar o horário" };
  }

  const { error: offerError } = await supabase
    .from("slot_offers")
    .update({
      status: "accepted",
      appointment_id: appointment.id,
    })
    .eq("id", offer.id)
    .eq("status", "pending");

  if (offerError) {
    await supabase.from("appointments").delete().eq("id", appointment.id);
    return { ok: false, error: "Não foi possível confirmar o horário" };
  }

  await supabase
    .from("waitlist_entries")
    .update({ status: "scheduled", updated_at: now })
    .eq("id", offer.waitlist_entry_id);

  await supabase.from("patient_slot_responses").insert({
    slot_offer_id: offer.id,
    response: "accept",
    lgpd_consent: true,
    ip_hash: input.ipHash,
  });

  return {
    ok: true,
    startsAt: offer.offered_at,
    endsAt: offer.ends_at,
  };
}

export async function declineSlotOffer(
  input: DeclineSlotOfferInput,
): Promise<SlotOfferActionResult> {
  if (!input.lgpdConsent) {
    return { ok: false, error: "Consentimento LGPD é obrigatório" };
  }

  const offer = await loadOfferByToken(input.token);

  if (!offer) {
    return { ok: false, error: "Link inválido ou expirado" };
  }

  if (offer.status === "accepted" || offer.status === "declined") {
    return {
      ok: true,
      alreadyResponded: true,
      response: offer.status === "accepted" ? "accept" : "decline",
    };
  }

  if (
    offer.status !== "pending" ||
    isSlotOfferExpired(new Date(offer.expires_at))
  ) {
    return { ok: false, error: "Link inválido ou expirado" };
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  await supabase
    .from("slot_offers")
    .update({ status: "declined" })
    .eq("id", offer.id);
  await supabase
    .from("waitlist_entries")
    .update({ status: "waiting", updated_at: now })
    .eq("id", offer.waitlist_entry_id);

  await supabase.from("patient_slot_responses").insert({
    slot_offer_id: offer.id,
    response: "decline",
    lgpd_consent: true,
    ip_hash: input.ipHash,
  });

  return { ok: true, response: "decline" };
}

export { loadOfferByToken, formatConflictMessage };
