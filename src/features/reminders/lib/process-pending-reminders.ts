import { canProcessReminder } from "@/features/reminders/domain/reminder-eligibility";
import { processReminderById } from "@/features/reminders/lib/send-reminder-email";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ProcessPendingRemindersResult {
  processed: number;
  sent: number;
  pending: number;
  failed: number;
  skipped: number;
}

export async function processPendingReminders(): Promise<ProcessPendingRemindersResult> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: reminders, error } = await admin
    .from("reminders")
    .select("id, status, attempt_count, next_attempt_at")
    .eq("channel", "email")
    .eq("status", "pending")
    .lte("next_attempt_at", nowIso)
    .lt("attempt_count", 3)
    .order("next_attempt_at", { ascending: true })
    .limit(25);

  if (error) {
    throw new Error("Não foi possível buscar lembretes pendentes");
  }

  const result: ProcessPendingRemindersResult = {
    processed: 0,
    sent: 0,
    pending: 0,
    failed: 0,
    skipped: 0,
  };

  for (const reminder of reminders ?? []) {
    if (
      !canProcessReminder({
        status: reminder.status,
        attemptCount: reminder.attempt_count,
        nextAttemptAt: new Date(reminder.next_attempt_at),
      })
    ) {
      result.skipped += 1;
      continue;
    }

    result.processed += 1;
    const outcome = await processReminderById(reminder.id);

    if (outcome === "sent") {
      result.sent += 1;
    } else if (outcome === "failed") {
      result.failed += 1;
    } else if (outcome === "pending") {
      result.pending += 1;
    } else {
      result.skipped += 1;
    }
  }

  return result;
}
