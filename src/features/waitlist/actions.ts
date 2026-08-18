"use server";

import { revalidatePath } from "next/cache";

import {
  formatConflictMessage,
  hasAppointmentConflict,
} from "@/features/agenda/domain/appointment-conflict";
import { getActiveAppointmentsForDentist } from "@/features/agenda/queries";
import { toClinicIso } from "@/features/agenda/types";
import { computeSlotOfferExpiresAt } from "@/features/waitlist/domain/slot-offer-expiry";
import {
  generateSlotOfferToken,
  hashSlotOfferToken,
} from "@/features/waitlist/domain/token-hash";
import {
  cancelSlotOfferSchema,
  createSlotOfferSchema,
  createWaitlistEntrySchema,
  removeWaitlistEntrySchema,
  updateWaitlistEntrySchema,
} from "@/features/waitlist/schemas";
import { getModuleAccess } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/env";
import type { UserRole } from "@/types/clinroma";

export interface WaitlistActionResult {
  success?: boolean;
  error?: string;
  offerUrl?: string;
  offerToken?: string;
  entryId?: string;
}

function canWriteWaitlist(role: UserRole): boolean {
  return getModuleAccess(role, "waitlist") === "write";
}

async function assertWaitlistWriteAccess() {
  const session = await requireAuthSession("/fila");

  if (!canWriteWaitlist(session.profile.role)) {
    throw new Error("Sem permissão para alterar a fila");
  }

  if (!hasSupabaseConfig()) {
    throw new Error("Supabase não configurado");
  }

  return session;
}

function mapDatabaseError(error: { code?: string; message?: string }): string {
  if (error.code === "23505") {
    return "Paciente já possui entrada ativa na fila";
  }

  if (error.code === "23P01") {
    return "Horário indisponível para este dentista";
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

async function validatePatientForWaitlist(
  patientId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, lgpd_consent_at")
    .eq("id", patientId)
    .maybeSingle();

  if (error || !data) {
    return "Paciente não encontrado";
  }

  if (!data.lgpd_consent_at) {
    return "Paciente sem consentimento LGPD registrado";
  }

  return null;
}

export async function createWaitlistEntryAction(
  input: unknown,
): Promise<WaitlistActionResult> {
  try {
    const session = await assertWaitlistWriteAccess();
    const parsed = createWaitlistEntrySchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const patientError = await validatePatientForWaitlist(
      parsed.data.patientId,
    );

    if (patientError) {
      return { error: patientError };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("waitlist_entries")
      .insert({
        patient_id: parsed.data.patientId,
        priority: parsed.data.priority,
        reason: parsed.data.reason || null,
        preferred_dentist_id: parsed.data.preferredDentistId ?? null,
        status: "waiting",
        created_by: session.profile.id,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: mapDatabaseError(error ?? {}) };
    }

    revalidatePath("/fila");
    revalidatePath("/hoje");

    return { success: true, entryId: data.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível incluir na fila",
    };
  }
}

export async function updateWaitlistEntryAction(
  input: unknown,
): Promise<WaitlistActionResult> {
  try {
    await assertWaitlistWriteAccess();
    const parsed = updateWaitlistEntrySchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.priority) {
      updates.priority = parsed.data.priority;
    }

    if (parsed.data.reason !== undefined) {
      updates.reason = parsed.data.reason || null;
    }

    if (parsed.data.preferredDentistId !== undefined) {
      updates.preferred_dentist_id = parsed.data.preferredDentistId;
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("waitlist_entries")
      .update(updates)
      .eq("id", parsed.data.id)
      .in("status", ["waiting", "offered"]);

    if (error) {
      return { error: mapDatabaseError(error) };
    }

    revalidatePath("/fila");
    revalidatePath("/hoje");

    return { success: true, entryId: parsed.data.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a entrada",
    };
  }
}

export async function removeWaitlistEntryAction(
  input: unknown,
): Promise<WaitlistActionResult> {
  try {
    await assertWaitlistWriteAccess();
    const parsed = removeWaitlistEntrySchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const supabase = await createClient();

    const { data: entry } = await supabase
      .from("waitlist_entries")
      .select("id, status")
      .eq("id", parsed.data.id)
      .maybeSingle();

    if (!entry) {
      return { error: "Entrada não encontrada" };
    }

    if (entry.status === "offered") {
      await supabase
        .from("slot_offers")
        .update({ status: "expired" })
        .eq("waitlist_entry_id", entry.id)
        .eq("status", "pending");
    }

    const { error } = await supabase
      .from("waitlist_entries")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id);

    if (error) {
      return { error: mapDatabaseError(error) };
    }

    revalidatePath("/fila");
    revalidatePath("/hoje");

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível remover da fila",
    };
  }
}

export async function createSlotOfferAction(
  input: unknown,
): Promise<WaitlistActionResult> {
  try {
    const session = await assertWaitlistWriteAccess();
    const parsed = createSlotOfferSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const startsAt = toClinicIso(parsed.data.date, parsed.data.startTime);
    const endsAt = toClinicIso(parsed.data.date, parsed.data.endTime);

    if (new Date(endsAt) <= new Date(startsAt)) {
      return { error: "Horário final deve ser posterior ao início" };
    }

    const supabase = await createClient();
    const { data: entry, error: entryError } = await supabase
      .from("waitlist_entries")
      .select("id, status, preferred_dentist_id")
      .eq("id", parsed.data.entryId)
      .maybeSingle();

    if (entryError || !entry) {
      return { error: "Entrada não encontrada" };
    }

    if (entry.status !== "waiting") {
      return { error: "Somente entradas aguardando podem receber oferta" };
    }

    const existing = await getActiveAppointmentsForDentist(
      parsed.data.dentistId,
    );
    const conflict = hasAppointmentConflict(
      {
        dentistId: parsed.data.dentistId,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
      },
      existing,
    );

    if (conflict) {
      return { error: formatConflictMessage("este dentista") };
    }

    const token = generateSlotOfferToken();
    const tokenHash = hashSlotOfferToken(token);
    const createdAt = new Date();
    const expiresAt = computeSlotOfferExpiresAt(createdAt);

    const { error: offerError } = await supabase.from("slot_offers").insert({
      waitlist_entry_id: parsed.data.entryId,
      offered_at: startsAt,
      ends_at: endsAt,
      dentist_id: parsed.data.dentistId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      status: "pending",
      created_by: session.profile.id,
    });

    if (offerError) {
      return { error: mapDatabaseError(offerError) };
    }

    const { error: statusError } = await supabase
      .from("waitlist_entries")
      .update({
        status: "offered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.entryId)
      .eq("status", "waiting");

    if (statusError) {
      return { error: mapDatabaseError(statusError) };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";
    const offerUrl = `${appUrl.replace(/\/$/, "")}/fila/resposta/${token}`;

    revalidatePath("/fila");
    revalidatePath("/hoje");
    revalidatePath("/agenda");

    return {
      success: true,
      offerUrl,
      offerToken: token,
      entryId: parsed.data.entryId,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível criar a oferta",
    };
  }
}

export async function cancelSlotOfferAction(
  input: unknown,
): Promise<WaitlistActionResult> {
  try {
    await assertWaitlistWriteAccess();
    const parsed = cancelSlotOfferSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const supabase = await createClient();

    const { error: offerError } = await supabase
      .from("slot_offers")
      .update({ status: "expired" })
      .eq("id", parsed.data.offerId)
      .eq("waitlist_entry_id", parsed.data.entryId)
      .eq("status", "pending");

    if (offerError) {
      return { error: mapDatabaseError(offerError) };
    }

    const { error: entryError } = await supabase
      .from("waitlist_entries")
      .update({
        status: "waiting",
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.entryId)
      .eq("status", "offered");

    if (entryError) {
      return { error: mapDatabaseError(entryError) };
    }

    revalidatePath("/fila");
    revalidatePath("/hoje");

    return { success: true, entryId: parsed.data.entryId };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar a oferta",
    };
  }
}

export async function getWaitingEntriesForOfferAction() {
  try {
    const session = await requireAuthSession("/fila");

    if (!canWriteWaitlist(session.profile.role)) {
      return [];
    }

    const { getWaitingEntriesForOffer } =
      await import("@/features/waitlist/queries");
    return getWaitingEntriesForOffer();
  } catch {
    return [];
  }
}
