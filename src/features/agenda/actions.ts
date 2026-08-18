"use server";

import { revalidatePath } from "next/cache";

import {
  formatConflictMessage,
  hasAppointmentConflict,
} from "@/features/agenda/domain/appointment-conflict";
import {
  cancelAppointmentSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentSchema,
} from "@/features/agenda/schemas";
import {
  getActiveAppointmentsForDentist,
  getActiveDentists,
} from "@/features/agenda/queries";
import { toClinicIso } from "@/features/agenda/types";
import { getModuleAccess } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/env";
import type { UserRole } from "@/types/clinroma";

export interface AgendaActionResult {
  success?: boolean;
  error?: string;
  appointmentId?: string;
}

function canWriteAgenda(role: UserRole): boolean {
  return getModuleAccess(role, "agenda") === "write";
}

function mapDatabaseError(error: { code?: string; message?: string }): string {
  if (error.code === "23P01") {
    return "Horário indisponível para este dentista";
  }

  return "Não foi possível salvar a consulta. Tente novamente.";
}

async function assertAgendaWriteAccess() {
  const session = await requireAuthSession("/agenda");

  if (!canWriteAgenda(session.profile.role)) {
    throw new Error("Sem permissão para alterar a agenda");
  }

  if (!hasSupabaseConfig()) {
    throw new Error("Supabase não configurado");
  }

  return session;
}

async function validateConflict(input: {
  dentistId: string;
  startsAt: string;
  endsAt: string;
  excludeId?: string;
}): Promise<string | null> {
  const dentists = await getActiveDentists();
  const dentist = dentists.find((item) => item.id === input.dentistId);

  if (!dentist) {
    return "Dentista inválido ou inativo";
  }

  const existing = await getActiveAppointmentsForDentist(
    input.dentistId,
    input.excludeId,
  );

  const conflict = hasAppointmentConflict(
    {
      dentistId: input.dentistId,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      excludeId: input.excludeId,
    },
    existing,
  );

  if (conflict) {
    return formatConflictMessage(dentist.fullName);
  }

  return null;
}

export async function createAppointmentAction(
  input: unknown,
): Promise<AgendaActionResult> {
  try {
    const session = await assertAgendaWriteAccess();
    const parsed = createAppointmentSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const startsAt = toClinicIso(parsed.data.date, parsed.data.startTime);
    const endsAt = toClinicIso(parsed.data.date, parsed.data.endTime);

    const conflictError = await validateConflict({
      dentistId: parsed.data.dentistId,
      startsAt,
      endsAt,
    });

    if (conflictError) {
      return { error: conflictError };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_id: parsed.data.patientId,
        dentist_id: parsed.data.dentistId,
        starts_at: startsAt,
        ends_at: endsAt,
        status: parsed.data.status,
        procedure_name: parsed.data.procedureName || null,
        notes: parsed.data.notes || null,
        created_by: session.userId,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: mapDatabaseError(error ?? {}) };
    }

    revalidatePath("/agenda");
    revalidatePath("/hoje");

    return { success: true, appointmentId: data.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível criar a consulta",
    };
  }
}

export async function updateAppointmentAction(
  input: unknown,
): Promise<AgendaActionResult> {
  try {
    await assertAgendaWriteAccess();
    const parsed = updateAppointmentSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const startsAt = toClinicIso(parsed.data.date, parsed.data.startTime);
    const endsAt = toClinicIso(parsed.data.date, parsed.data.endTime);

    const conflictError = await validateConflict({
      dentistId: parsed.data.dentistId,
      startsAt,
      endsAt,
      excludeId: parsed.data.id,
    });

    if (conflictError) {
      return { error: conflictError };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("appointments")
      .update({
        patient_id: parsed.data.patientId,
        dentist_id: parsed.data.dentistId,
        starts_at: startsAt,
        ends_at: endsAt,
        status: parsed.data.status,
        procedure_name: parsed.data.procedureName || null,
        notes: parsed.data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
      .select("id")
      .single();

    if (error || !data) {
      return { error: mapDatabaseError(error ?? {}) };
    }

    revalidatePath("/agenda");
    revalidatePath("/hoje");

    return { success: true, appointmentId: data.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a consulta",
    };
  }
}

export async function rescheduleAppointmentAction(
  input: unknown,
): Promise<AgendaActionResult> {
  try {
    await assertAgendaWriteAccess();
    const parsed = rescheduleAppointmentSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const startsAt = toClinicIso(parsed.data.date, parsed.data.startTime);
    const endsAt = toClinicIso(parsed.data.date, parsed.data.endTime);

    const conflictError = await validateConflict({
      dentistId: parsed.data.dentistId,
      startsAt,
      endsAt,
      excludeId: parsed.data.id,
    });

    if (conflictError) {
      return { error: conflictError };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("appointments")
      .update({
        dentist_id: parsed.data.dentistId,
        starts_at: startsAt,
        ends_at: endsAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
      .select("id")
      .single();

    if (error || !data) {
      return { error: mapDatabaseError(error ?? {}) };
    }

    revalidatePath("/agenda");
    revalidatePath("/hoje");

    return { success: true, appointmentId: data.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível remarcar a consulta",
    };
  }
}

export async function cancelAppointmentAction(
  input: unknown,
): Promise<AgendaActionResult> {
  try {
    await assertAgendaWriteAccess();
    const parsed = cancelAppointmentSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
      .select("id")
      .single();

    if (error || !data) {
      return { error: "Não foi possível cancelar a consulta" };
    }

    revalidatePath("/agenda");
    revalidatePath("/hoje");

    return { success: true, appointmentId: data.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar a consulta",
    };
  }
}

export async function searchPatientsAction(query: string) {
  const session = await requireAuthSession("/agenda");

  if (!canWriteAgenda(session.profile.role)) {
    return [];
  }

  const { searchPatients } = await import("@/features/patients/queries");
  return searchPatients(query);
}
