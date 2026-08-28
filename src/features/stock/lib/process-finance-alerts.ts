import {
  canProcessFinanceAlert,
  isValidFinanceAlertDestination,
} from "@/features/stock/domain/finance-alert";
import { createMissingFinanceAlerts } from "@/features/stock/lib/enqueue-finance-alert";
import { processFinanceAlertById } from "@/features/stock/lib/send-finance-alert-email";
import { getFinanceAlertEmail } from "@/lib/email/resend-client";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ProcessFinanceAlertsResult {
  processed: number;
  sent: number;
  failed: number;
  cancelled: number;
  created: number;
}

export async function processFinanceAlerts(): Promise<ProcessFinanceAlertsResult> {
  const result: ProcessFinanceAlertsResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
    created: 0,
  };

  if (!isValidFinanceAlertDestination(getFinanceAlertEmail())) {
    return result;
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: alerts, error } = await admin
    .from("stock_finance_alerts")
    .select("id, status, attempt_count, next_attempt_at")
    .eq("status", "pending")
    .is("episode_closed_at", null)
    .lte("next_attempt_at", nowIso)
    .lt("attempt_count", 3)
    .order("next_attempt_at", { ascending: true })
    .limit(25);

  if (error) {
    throw new Error("Não foi possível buscar avisos financeiros pendentes");
  }

  for (const alert of alerts ?? []) {
    if (
      !canProcessFinanceAlert({
        status: alert.status,
        attemptCount: alert.attempt_count,
        nextAttemptAt: new Date(alert.next_attempt_at),
      })
    ) {
      continue;
    }

    result.processed += 1;
    const outcome = await processFinanceAlertById(alert.id);

    if (outcome === "sent") {
      result.sent += 1;
    } else if (outcome === "failed") {
      result.failed += 1;
    } else if (outcome === "cancelled") {
      result.cancelled += 1;
    }
  }

  const scanned = await createMissingFinanceAlerts();
  result.created = scanned.created;
  result.sent += scanned.sent;
  result.failed += scanned.failed;

  return result;
}
