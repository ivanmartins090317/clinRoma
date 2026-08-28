import { revalidatePath } from "next/cache";

import {
  PATIENT_MESSAGE_COPY,
  PATIENT_MESSAGE_PURPOSE,
  PATIENT_MESSAGE_STATUS,
  trimMessageBody,
  validatePostSurgeryBody,
} from "@/features/records/domain/patient-message";
import {
  canCancelScheduledMessage,
  validateScheduleInput,
} from "@/features/records/domain/post-surgery-schedule";
import { canSendPatientWhatsApp } from "@/features/records/permissions";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { maskWhatsAppDestination } from "@/lib/whatsapp/send-whatsapp";
import type { UserRole } from "@/types/clinroma";
import type { PatientWhatsAppResult } from "@/features/records/lib/send-patient-whatsapp";
import {
  resolveWhatsAppDestination,
  type ResolvedWhatsAppDestination,
} from "@/features/records/domain/whatsapp-destination";

async function loadDestination(
  patientId: string,
): Promise<ResolvedWhatsAppDestination | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("contact_phone, secondary_phone, secondary_phone_note")
    .eq("id", patientId)
    .maybeSingle();

  if (!data) return null;

  return resolveWhatsAppDestination({
    contactPhone: data.contact_phone,
    secondaryPhone: data.secondary_phone,
    secondaryPhoneNote: data.secondary_phone_note,
  });
}

async function auditSchedule(input: {
  action: "create" | "update";
  messageId: string;
  patientId: string;
  destination: string;
  status: string;
}) {
  const result = await writeAuditLog({
    action: input.action,
    entityType: "patient_messages",
    entityId: input.messageId,
    metadata: {
      purpose: PATIENT_MESSAGE_PURPOSE.postSurgery,
      patientId: input.patientId,
      destination: maskWhatsAppDestination(input.destination),
      status: input.status,
    },
  });

  if (!result.ok) {
    console.error("[audit] Falha ao registrar WhatsApp:", result.error);
  }
}

export async function schedulePostSurgeryWhatsApp(input: {
  patientId: string;
  appointmentId?: string;
  body: string;
  datetimeLocal: string;
  actorId: string;
  role: UserRole;
  now?: Date;
}): Promise<PatientWhatsAppResult> {
  if (!canSendPatientWhatsApp(input.role)) {
    return { error: PATIENT_MESSAGE_COPY.forbidden };
  }

  if (!hasSupabaseConfig()) {
    return { error: "Supabase não configurado" };
  }

  const bodyError = validatePostSurgeryBody(input.body);
  if (bodyError) return { error: bodyError };

  const schedule = validateScheduleInput(input.datetimeLocal, input.now);
  if ("error" in schedule) return { error: schedule.error };

  const destination = await loadDestination(input.patientId);
  if (!destination) {
    return { error: PATIENT_MESSAGE_COPY.noDestination };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_messages")
    .insert({
      patient_id: input.patientId,
      appointment_id: input.appointmentId ?? null,
      purpose: PATIENT_MESSAGE_PURPOSE.postSurgery,
      destination_digits: destination.digits,
      contact_source: destination.contactSource,
      body: trimMessageBody(input.body),
      status: PATIENT_MESSAGE_STATUS.pending,
      scheduled_at: schedule.scheduledAt.toISOString(),
      attempt_count: 0,
      created_by: input.actorId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: PATIENT_MESSAGE_COPY.failure };
  }

  await auditSchedule({
    action: "create",
    messageId: data.id,
    patientId: input.patientId,
    destination: destination.digits,
    status: PATIENT_MESSAGE_STATUS.pending,
  });

  revalidatePath(`/pacientes/${input.patientId}`);
  return { success: true, messageId: data.id };
}

export async function cancelPostSurgeryWhatsApp(input: {
  messageId: string;
  patientId: string;
  actorId: string;
  role: UserRole;
}): Promise<PatientWhatsAppResult> {
  if (!canSendPatientWhatsApp(input.role)) {
    return { error: PATIENT_MESSAGE_COPY.forbidden };
  }

  if (!hasSupabaseConfig()) {
    return { error: "Supabase não configurado" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("patient_messages")
    .select("id, status, destination_digits, purpose")
    .eq("id", input.messageId)
    .eq("patient_id", input.patientId)
    .maybeSingle();

  if (
    !existing ||
    existing.purpose !== PATIENT_MESSAGE_PURPOSE.postSurgery ||
    !canCancelScheduledMessage(existing.status)
  ) {
    return { error: PATIENT_MESSAGE_COPY.failure };
  }

  const { data, error } = await supabase
    .from("patient_messages")
    .update({ status: PATIENT_MESSAGE_STATUS.cancelled })
    .eq("id", existing.id)
    .eq("status", PATIENT_MESSAGE_STATUS.pending)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { error: PATIENT_MESSAGE_COPY.failure };
  }

  await auditSchedule({
    action: "update",
    messageId: data.id,
    patientId: input.patientId,
    destination: existing.destination_digits,
    status: PATIENT_MESSAGE_STATUS.cancelled,
  });

  revalidatePath(`/pacientes/${input.patientId}`);
  return { success: true, messageId: data.id };
}
