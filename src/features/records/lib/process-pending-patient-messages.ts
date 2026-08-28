import { revalidatePath } from "next/cache";

import {
  PATIENT_MESSAGE_COPY,
  PATIENT_MESSAGE_PURPOSE,
  PATIENT_MESSAGE_STATUS,
} from "@/features/records/domain/patient-message";
import {
  POST_SURGERY_MAX_ATTEMPTS,
  isDueScheduledMessage,
  nextStatusAfterSendAttempt,
} from "@/features/records/domain/post-surgery-schedule";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isWhatsAppChannelConfigured,
  sendWhatsApp,
} from "@/lib/whatsapp/send-whatsapp";

export interface ProcessPendingPatientMessagesResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}

export async function processPendingPatientMessages(): Promise<ProcessPendingPatientMessagesResult> {
  const result: ProcessPendingPatientMessagesResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  if (!isWhatsAppChannelConfigured()) {
    return result;
  }

  const admin = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: rows, error } = await admin
    .from("patient_messages")
    .select(
      "id, patient_id, destination_digits, body, status, purpose, scheduled_at, attempt_count",
    )
    .eq("purpose", PATIENT_MESSAGE_PURPOSE.postSurgery)
    .eq("status", PATIENT_MESSAGE_STATUS.pending)
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", nowIso)
    .lt("attempt_count", POST_SURGERY_MAX_ATTEMPTS)
    .order("scheduled_at", { ascending: true })
    .limit(25);

  if (error) {
    throw new Error("Não foi possível buscar mensagens pós-cirurgia pendentes");
  }

  const patientIds = new Set<string>();

  for (const row of rows ?? []) {
    if (
      !isDueScheduledMessage({
        purpose: row.purpose,
        status: row.status,
        scheduledAt: row.scheduled_at,
        attemptCount: row.attempt_count,
        now,
      })
    ) {
      result.skipped += 1;
      continue;
    }

    const nextAttempt = row.attempt_count + 1;
    const { data: claimed } = await admin
      .from("patient_messages")
      .update({ attempt_count: nextAttempt })
      .eq("id", row.id)
      .eq("status", PATIENT_MESSAGE_STATUS.pending)
      .eq("attempt_count", row.attempt_count)
      .select("id")
      .maybeSingle();

    if (!claimed) {
      result.skipped += 1;
      continue;
    }

    result.processed += 1;

    const sendResult = await sendWhatsApp({
      destino: row.destination_digits,
      texto: row.body,
    });

    const sent = sendResult.ok;
    const status = nextStatusAfterSendAttempt({
      sent,
      attemptCount: nextAttempt,
    });

    await admin
      .from("patient_messages")
      .update({
        status,
        sent_at: sent ? nowIso : null,
        error_message:
          status === PATIENT_MESSAGE_STATUS.failed
            ? PATIENT_MESSAGE_COPY.failure
            : null,
      })
      .eq("id", row.id)
      .eq("status", PATIENT_MESSAGE_STATUS.pending);

    patientIds.add(row.patient_id);

    if (sent) result.sent += 1;
    else if (status === PATIENT_MESSAGE_STATUS.failed) result.failed += 1;
  }

  for (const patientId of patientIds) {
    revalidatePath(`/pacientes/${patientId}`);
  }

  return result;
}
