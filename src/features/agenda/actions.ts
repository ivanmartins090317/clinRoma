"use server";

import { revalidatePath } from "next/cache";
import { parseISO } from "date-fns";

import {
  findPairPartnerId,
  formatConflictMessage,
  planAppointmentWrite,
  type AppointmentInterval,
  type AppointmentWritePlan,
  type OverlapPrompt,
} from "@/features/agenda/domain/appointment-conflict";
import { isActiveAppointmentStatus } from "@/features/agenda/domain/appointment-status";
import { PAST_SLOT_MESSAGE } from "@/features/agenda/domain/appointment-time";
import {
  cancelAppointmentSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentSchema,
} from "@/features/agenda/schemas";
import {
  getActiveAppointmentsForDentist,
  getActiveDentists,
  getAppointmentById,
} from "@/features/agenda/queries";
import {
  formatClinicTime,
  toClinicIso,
  type AgendaAppointment,
} from "@/features/agenda/types";
import { getModuleAccess } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/env";
import type { AppointmentStatus, UserRole } from "@/types/clinroma";

export interface AgendaActionResult {
  success?: boolean;
  error?: string;
  appointmentId?: string;
  overlap?: OverlapPrompt;
}

function canWriteAgenda(role: UserRole): boolean {
  return getModuleAccess(role, "agenda") === "write";
}

function mapDatabaseError(
  error: { code?: string; message?: string },
  dentistName?: string,
): string {
  if (error.code === "23P01") {
    return dentistName
      ? formatConflictMessage(dentistName)
      : "Horário indisponível para este dentista";
  }

  return "Não foi possível salvar a consulta. Tente novamente.";
}

function revalidateAgenda() {
  revalidatePath("/agenda");
  revalidatePath("/hoje");
}

function labelTime(date: Date): string {
  return formatClinicTime(date.toISOString());
}

function toInterval(appointment: AgendaAppointment): AppointmentInterval {
  return {
    id: appointment.id,
    dentistId: appointment.dentistId,
    startsAt: parseISO(appointment.startsAt),
    endsAt: parseISO(appointment.endsAt),
    status: appointment.status,
    inductionMinutes: appointment.inductionMinutes ?? 0,
    patientName: appointment.patientName,
  };
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

async function readPatientName(patientId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("full_name")
    .eq("id", patientId)
    .maybeSingle();

  return data?.full_name ?? "Paciente";
}

async function evaluateAppointmentWrite(input: {
  mode: "create" | "edit";
  appointmentId?: string;
  patientId: string;
  dentistId: string;
  startsAt: string;
  endsAt: string;
  confirmation?: { partnerId: string } | null;
  candidateStatus?: AppointmentStatus;
}): Promise<{
  error?: string;
  overlap?: OverlapPrompt;
  plan?: AppointmentWritePlan;
  dentistName?: string;
}> {
  const dentists = await getActiveDentists();
  const dentist = dentists.find((item) => item.id === input.dentistId);

  if (!dentist) {
    return { error: "Dentista inválido ou inativo" };
  }

  const existing = await getActiveAppointmentsForDentist(
    input.dentistId,
    input.appointmentId,
  );
  const previousPartnerId = await findPreviousPartnerId(
    input.appointmentId,
    input.dentistId,
    existing,
  );
  const patientName = await readPatientName(input.patientId);
  const plan = planAppointmentWrite({
    candidate: {
      dentistId: input.dentistId,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      excludeId: input.appointmentId,
      patientName,
    },
    existing,
    dentistName: dentist.fullName,
    mode: input.mode,
    confirmation: input.confirmation,
    previousPartnerId,
    candidateStatus: input.candidateStatus,
    formatTime: labelTime,
  });

  if (plan.outcome === "reject") {
    return {
      error: plan.error ?? "Não foi possível salvar a consulta. Tente novamente.",
    };
  }

  if (plan.outcome === "confirm") {
    return { overlap: plan.overlap, dentistName: dentist.fullName };
  }

  return { plan, dentistName: dentist.fullName };
}

async function findPreviousPartnerId(
  appointmentId: string | undefined,
  nextDentistId: string,
  nextDentistAppointments: AppointmentInterval[],
): Promise<string | null> {
  if (!appointmentId) {
    return null;
  }

  const current = await getAppointmentById(appointmentId);

  if (!current || !isActiveAppointmentStatus(current.status)) {
    return null;
  }

  const pool =
    current.dentistId === nextDentistId
      ? nextDentistAppointments
      : await getActiveAppointmentsForDentist(
          current.dentistId,
          appointmentId,
        );

  return findPairPartnerId(toInterval(current), pool);
}

async function persistAppointment(input: {
  id: string | null;
  patientId: string;
  dentistId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  procedureName: string | null;
  notes: string | null;
  createdBy: string | null;
  plan: AppointmentWritePlan;
  dentistName?: string;
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_scheduled_appointment", {
    p_id: input.id,
    p_patient_id: input.patientId,
    p_dentist_id: input.dentistId,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_status: input.status,
    p_procedure_name: input.procedureName,
    p_notes: input.notes,
    p_created_by: input.createdBy,
    p_induction_minutes: input.plan.candidateInductionMinutes,
    p_partner_id: input.plan.partnerId ?? null,
    p_partner_induction: input.plan.partnerInductionMinutes ?? 0,
    p_release_partner_id: input.plan.releasePartnerId ?? null,
  });

  if (error || !data) {
    return { error: mapDatabaseError(error ?? {}, input.dentistName) };
  }

  return { id: data };
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

    if (new Date(startsAt).getTime() <= Date.now()) {
      return { error: PAST_SLOT_MESSAGE };
    }

    const evaluation = await evaluateAppointmentWrite({
      mode: "create",
      patientId: parsed.data.patientId,
      dentistId: parsed.data.dentistId,
      startsAt,
      endsAt,
      confirmation: parsed.data.pairConfirmation,
      candidateStatus: parsed.data.status,
    });

    if (evaluation.error) {
      return { error: evaluation.error };
    }

    if (evaluation.overlap || !evaluation.plan) {
      return { overlap: evaluation.overlap };
    }

    const saved = await persistAppointment({
      id: null,
      patientId: parsed.data.patientId,
      dentistId: parsed.data.dentistId,
      startsAt,
      endsAt,
      status: parsed.data.status,
      procedureName: parsed.data.procedureName || null,
      notes: parsed.data.notes || null,
      createdBy: session.userId,
      plan: evaluation.plan,
      dentistName: evaluation.dentistName,
    });

    if (saved.error || !saved.id) {
      return { error: saved.error ?? "Não foi possível criar a consulta" };
    }

    revalidateAgenda();

    return { success: true, appointmentId: saved.id };
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
    const evaluation = await evaluateAppointmentWrite({
      mode: "edit",
      appointmentId: parsed.data.id,
      patientId: parsed.data.patientId,
      dentistId: parsed.data.dentistId,
      startsAt,
      endsAt,
      confirmation: parsed.data.pairConfirmation,
      candidateStatus: parsed.data.status,
    });

    if (evaluation.error) {
      return { error: evaluation.error };
    }

    if (evaluation.overlap || !evaluation.plan) {
      return { overlap: evaluation.overlap };
    }

    const saved = await persistAppointment({
      id: parsed.data.id,
      patientId: parsed.data.patientId,
      dentistId: parsed.data.dentistId,
      startsAt,
      endsAt,
      status: parsed.data.status,
      procedureName: parsed.data.procedureName || null,
      notes: parsed.data.notes || null,
      createdBy: null,
      plan: evaluation.plan,
      dentistName: evaluation.dentistName,
    });

    if (saved.error || !saved.id) {
      return { error: saved.error ?? "Não foi possível atualizar a consulta" };
    }

    if (parsed.data.status === "completed") {
      try {
        const { enqueueReminderForAppointment } =
          await import("@/features/reminders/lib/enqueue-reminder");
        await enqueueReminderForAppointment(saved.id);
      } catch (enqueueError) {
        console.error("reminder_enqueue_failed", {
          appointmentId: saved.id,
          reason:
            enqueueError instanceof Error
              ? enqueueError.message
              : "unknown_error",
        });
      }
    }

    revalidateAgenda();

    return { success: true, appointmentId: saved.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a consulta",
    };
  }
}

export async function previewRescheduleAction(
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

    const current = await getAppointmentById(parsed.data.id);

    if (!current) {
      return { error: "Consulta inválida" };
    }

    const startsAt = toClinicIso(parsed.data.date, parsed.data.startTime);
    const endsAt = toClinicIso(parsed.data.date, parsed.data.endTime);
    const evaluation = await evaluateAppointmentWrite({
      mode: "edit",
      appointmentId: parsed.data.id,
      patientId: current.patientId,
      dentistId: parsed.data.dentistId,
      startsAt,
      endsAt,
      candidateStatus: current.status,
    });

    if (evaluation.error) {
      return { error: evaluation.error };
    }

    if (evaluation.overlap) {
      return { overlap: evaluation.overlap };
    }

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível remarcar a consulta",
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

    const current = await getAppointmentById(parsed.data.id);

    if (!current) {
      return { error: "Consulta inválida" };
    }

    const startsAt = toClinicIso(parsed.data.date, parsed.data.startTime);
    const endsAt = toClinicIso(parsed.data.date, parsed.data.endTime);

    if (new Date(startsAt).getTime() <= Date.now()) {
      return { error: PAST_SLOT_MESSAGE };
    }

    const evaluation = await evaluateAppointmentWrite({
      mode: "edit",
      appointmentId: parsed.data.id,
      patientId: current.patientId,
      dentistId: parsed.data.dentistId,
      startsAt,
      endsAt,
      confirmation: parsed.data.pairConfirmation,
      candidateStatus: current.status,
    });

    if (evaluation.error) {
      return { error: evaluation.error };
    }

    if (evaluation.overlap || !evaluation.plan) {
      return { overlap: evaluation.overlap };
    }

    const saved = await persistAppointment({
      id: parsed.data.id,
      patientId: current.patientId,
      dentistId: parsed.data.dentistId,
      startsAt,
      endsAt,
      status: current.status,
      procedureName: current.procedureName,
      notes: current.notes,
      createdBy: null,
      plan: evaluation.plan,
      dentistName: evaluation.dentistName,
    });

    if (saved.error || !saved.id) {
      return { error: saved.error ?? "Não foi possível remarcar a consulta" };
    }

    revalidateAgenda();

    return { success: true, appointmentId: saved.id };
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

    const current = await getAppointmentById(parsed.data.id);

    if (!current) {
      return { error: "Não foi possível cancelar a consulta" };
    }

    const existing = await getActiveAppointmentsForDentist(
      current.dentistId,
      current.id,
    );
    const plan = planAppointmentWrite({
      candidate: {
        ...toInterval(current),
        patientName: current.patientName,
        excludeId: current.id,
      },
      existing,
      dentistName: current.dentistName,
      mode: "edit",
      previousPartnerId: findPairPartnerId(toInterval(current), existing),
      candidateStatus: "cancelled",
      formatTime: labelTime,
    });
    const saved = await persistAppointment({
      id: current.id,
      patientId: current.patientId,
      dentistId: current.dentistId,
      startsAt: current.startsAt,
      endsAt: current.endsAt,
      status: "cancelled",
      procedureName: current.procedureName,
      notes: current.notes,
      createdBy: null,
      plan,
      dentistName: current.dentistName,
    });

    if (saved.error || !saved.id) {
      return { error: saved.error ?? "Não foi possível cancelar a consulta" };
    }

    revalidateAgenda();

    return { success: true, appointmentId: saved.id };
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
