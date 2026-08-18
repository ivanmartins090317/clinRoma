import { buildReminderEmailContent } from "@/features/reminders/domain/email-content";
import { canProcessReminder } from "@/features/reminders/domain/reminder-eligibility";
import {
  getNextAttemptAt,
  shouldMarkReminderFailed,
} from "@/features/reminders/domain/retry-policy";
import {
  getAppBaseUrl,
  getReminderFromEmail,
  getResendClient,
} from "@/lib/email/resend-client";
import { createAdminClient } from "@/lib/supabase/admin";

const MISSING_EMAIL_ERROR = "Dentista sem e-mail cadastrado";
const PROVIDER_ERROR = "Não foi possível enviar o e-mail. Tente reenviar.";
const CONFIG_ERROR = "Serviço de e-mail não configurado";

interface ReminderRow {
  id: string;
  appointment_id: string;
  dentist_id: string;
  status: "pending" | "sent" | "failed";
  attempt_count: number;
  next_attempt_at: string;
}

interface AppointmentContext {
  patient_id: string;
  starts_at: string;
  procedure_name: string | null;
  notes: string | null;
  patient: { full_name: string } | null;
  dentist: {
    full_name: string;
    profile_id: string | null;
  } | null;
}

async function resolveDentistEmail(
  profileId: string | null,
): Promise<string | null> {
  if (!profileId) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(profileId);

  if (error || !data.user?.email) {
    return null;
  }

  return data.user.email;
}

async function loadReminder(reminderId: string): Promise<ReminderRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reminders")
    .select(
      "id, appointment_id, dentist_id, status, attempt_count, next_attempt_at",
    )
    .eq("id", reminderId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function loadAppointmentContext(
  appointmentId: string,
): Promise<AppointmentContext | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .select(
      `
      patient_id,
      starts_at,
      procedure_name,
      notes,
      patient:patients(full_name),
      dentist:dentists(full_name, profile_id)
    `,
    )
    .eq("id", appointmentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const patient = Array.isArray(data.patient) ? data.patient[0] : data.patient;
  const dentist = Array.isArray(data.dentist) ? data.dentist[0] : data.dentist;

  return {
    patient_id: data.patient_id,
    starts_at: data.starts_at,
    procedure_name: data.procedure_name,
    notes: data.notes,
    patient: patient ?? null,
    dentist: dentist ?? null,
  };
}

async function markReminderOutcome(
  reminderId: string,
  input: {
    status: "pending" | "sent" | "failed";
    attemptCount: number;
    nextAttemptAt: string | null;
    errorMessage?: string | null;
    sentAt?: string | null;
  },
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("reminders")
    .update({
      status: input.status,
      attempt_count: input.attemptCount,
      next_attempt_at: input.nextAttemptAt ?? new Date().toISOString(),
      error_message: input.errorMessage ?? null,
      sent_at: input.sentAt ?? null,
    })
    .eq("id", reminderId);

  if (error) {
    throw new Error("Não foi possível atualizar lembrete");
  }
}

export async function processReminderById(
  reminderId: string,
): Promise<"sent" | "pending" | "failed" | "skipped"> {
  const reminder = await loadReminder(reminderId);

  if (!reminder) {
    return "skipped";
  }

  if (
    !canProcessReminder({
      status: reminder.status,
      attemptCount: reminder.attempt_count,
      nextAttemptAt: new Date(reminder.next_attempt_at),
    })
  ) {
    return "skipped";
  }

  const appointment = await loadAppointmentContext(reminder.appointment_id);

  if (!appointment?.patient || !appointment.dentist) {
    await markReminderOutcome(reminder.id, {
      status: "failed",
      attemptCount: 3,
      nextAttemptAt: null,
      errorMessage: "Dados da consulta indisponíveis",
    });
    return "failed";
  }

  const dentistEmail = await resolveDentistEmail(
    appointment.dentist.profile_id,
  );

  if (!dentistEmail) {
    await markReminderOutcome(reminder.id, {
      status: "failed",
      attemptCount: 3,
      nextAttemptAt: null,
      errorMessage: MISSING_EMAIL_ERROR,
    });
    return "failed";
  }

  const resend = getResendClient();
  const fromEmail = getReminderFromEmail();

  if (!resend || !fromEmail) {
    await markReminderOutcome(reminder.id, {
      status: "pending",
      attemptCount: reminder.attempt_count,
      nextAttemptAt: reminder.next_attempt_at,
      errorMessage: CONFIG_ERROR,
    });
    return "pending";
  }

  const content = buildReminderEmailContent({
    dentistName: appointment.dentist.full_name,
    patientFullName: appointment.patient.full_name,
    startsAt: appointment.starts_at,
    procedureName: appointment.procedure_name,
    notes: appointment.notes,
    patientUrl: `${getAppBaseUrl()}/pacientes/${appointment.patient_id}`,
  });

  const nextAttemptCount = reminder.attempt_count + 1;

  const { error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: dentistEmail,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  if (sendError) {
    if (shouldMarkReminderFailed(nextAttemptCount)) {
      await markReminderOutcome(reminder.id, {
        status: "failed",
        attemptCount: nextAttemptCount,
        nextAttemptAt: null,
        errorMessage: PROVIDER_ERROR,
      });
      return "failed";
    }

    const retryAt = getNextAttemptAt(nextAttemptCount);

    await markReminderOutcome(reminder.id, {
      status: "pending",
      attemptCount: nextAttemptCount,
      nextAttemptAt: retryAt?.toISOString() ?? null,
      errorMessage: PROVIDER_ERROR,
    });
    return "pending";
  }

  await markReminderOutcome(reminder.id, {
    status: "sent",
    attemptCount: nextAttemptCount,
    nextAttemptAt: null,
    errorMessage: null,
    sentAt: new Date().toISOString(),
  });

  return "sent";
}

export async function resetReminderForManualResend(
  reminderId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("reminders")
    .update({
      status: "pending",
      attempt_count: 0,
      next_attempt_at: new Date().toISOString(),
      error_message: null,
      sent_at: null,
    })
    .eq("id", reminderId);

  if (error) {
    throw new Error("Não foi possível preparar reenvio");
  }
}
