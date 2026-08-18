import { createAdminClient } from "@/lib/supabase/admin";
import { processReminderById } from "@/features/reminders/lib/send-reminder-email";

export async function enqueueReminderForAppointment(
  appointmentId: string,
): Promise<string | null> {
  const admin = createAdminClient();

  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .select("id, dentist_id, status")
    .eq("id", appointmentId)
    .maybeSingle();

  if (appointmentError || !appointment) {
    throw new Error("Consulta não encontrada para lembrete");
  }

  if (appointment.status !== "completed") {
    return null;
  }

  const { data: existing } = await admin
    .from("reminders")
    .select("id")
    .eq("appointment_id", appointmentId)
    .eq("channel", "email")
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  const { data: created, error: insertError } = await admin
    .from("reminders")
    .insert({
      appointment_id: appointmentId,
      dentist_id: appointment.dentist_id,
      channel: "email",
      status: "pending",
      attempt_count: 0,
      next_attempt_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !created) {
    if (insertError?.code === "23505") {
      const { data: duplicate } = await admin
        .from("reminders")
        .select("id")
        .eq("appointment_id", appointmentId)
        .eq("channel", "email")
        .maybeSingle();

      return duplicate?.id ?? null;
    }

    throw new Error("Não foi possível enfileirar lembrete");
  }

  try {
    await processReminderById(created.id);
  } catch {
    // Falha no envio imediato não reverte o enfileiramento.
  }

  return created.id;
}
