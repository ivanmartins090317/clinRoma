import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/env";

export type ReminderStatus = "pending" | "sent" | "failed";

export interface ReminderSummary {
  id: string;
  appointmentId: string;
  status: ReminderStatus;
  sentAt: string | null;
  errorMessage: string | null;
  attemptCount: number;
}

export interface FailedReminderItem {
  id: string;
  appointmentId: string;
  patientName: string;
  dentistName: string;
  startsAt: string;
  errorMessage: string | null;
  createdAt: string;
}

function mapReminderRow(row: {
  id: string;
  appointment_id: string;
  status: ReminderStatus;
  sent_at: string | null;
  error_message: string | null;
  attempt_count: number;
}): ReminderSummary {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    status: row.status,
    sentAt: row.sent_at,
    errorMessage: row.error_message,
    attemptCount: row.attempt_count,
  };
}

export async function getReminderByAppointmentId(
  appointmentId: string,
): Promise<ReminderSummary | null> {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("id, appointment_id, status, sent_at, error_message, attempt_count")
    .eq("appointment_id", appointmentId)
    .eq("channel", "email")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapReminderRow(data);
}

export async function getRemindersByAppointmentIds(
  appointmentIds: string[],
): Promise<Record<string, ReminderSummary>> {
  if (!hasSupabaseConfig() || appointmentIds.length === 0) {
    return {};
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("id, appointment_id, status, sent_at, error_message, attempt_count")
    .eq("channel", "email")
    .in("appointment_id", appointmentIds);

  if (error || !data) {
    return {};
  }

  return Object.fromEntries(
    data.map((row) => [row.appointment_id, mapReminderRow(row)]),
  );
}

export async function getRecentFailedReminders(): Promise<
  FailedReminderItem[]
> {
  if (!hasSupabaseConfig()) {
    return [];
  }

  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("reminders")
    .select(
      `
      id,
      appointment_id,
      error_message,
      created_at,
      appointment:appointments(
        starts_at,
        patient:patients(full_name),
        dentist:dentists(full_name)
      )
    `,
    )
    .eq("channel", "email")
    .eq("status", "failed")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) {
    return [];
  }

  return data.flatMap((row) => {
    const appointment = Array.isArray(row.appointment)
      ? row.appointment[0]
      : row.appointment;

    if (!appointment) {
      return [];
    }

    const patient = Array.isArray(appointment.patient)
      ? appointment.patient[0]
      : appointment.patient;
    const dentist = Array.isArray(appointment.dentist)
      ? appointment.dentist[0]
      : appointment.dentist;

    return [
      {
        id: row.id,
        appointmentId: row.appointment_id,
        patientName: patient?.full_name ?? "Paciente",
        dentistName: dentist?.full_name ?? "Dentista",
        startsAt: appointment.starts_at,
        errorMessage: row.error_message,
        createdAt: row.created_at,
      },
    ];
  });
}
