import {
  canProcessFinanceAlert,
  isValidFinanceAlertDestination,
  needsReplenishment,
} from "@/features/stock/domain/finance-alert";
import {
  buildFinanceAlertEmailContent,
  getFinanceAlertConfigError,
  getFinanceAlertProviderError,
} from "@/features/stock/domain/finance-alert-email";
import {
  getFinanceAlertNextAttemptAt,
  shouldMarkFinanceAlertFailed,
} from "@/features/stock/domain/finance-alert-retry";
import {
  getAppBaseUrl,
  getFinanceAlertEmail,
  getReminderFromEmail,
  getResendClient,
} from "@/lib/email/resend-client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type FinanceAlertRow = {
  id: string;
  supply_id: string;
  status: Database["public"]["Enums"]["stock_finance_alert_status"];
  attempt_count: number;
  next_attempt_at: string;
};

type SupplyContext = {
  name: string;
  unit: Database["public"]["Enums"]["supply_unit"];
  currentQuantity: number;
  minimumQuantity: number;
};

async function loadAlert(alertId: string): Promise<FinanceAlertRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("stock_finance_alerts")
    .select("id, supply_id, status, attempt_count, next_attempt_at")
    .eq("id", alertId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function loadSupplyContext(
  supplyId: string,
): Promise<SupplyContext | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("supplies")
    .select("name, unit, current_quantity, minimum_quantity")
    .eq("id", supplyId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    name: data.name,
    unit: data.unit,
    currentQuantity: Number(data.current_quantity),
    minimumQuantity: Number(data.minimum_quantity),
  };
}

async function markAlertOutcome(
  alertId: string,
  input: {
    status: Database["public"]["Enums"]["stock_finance_alert_status"];
    attemptCount: number;
    nextAttemptAt: string | null;
    errorMessage?: string | null;
    sentAt?: string | null;
    currentQuantity?: number;
    minimumQuantity?: number;
  },
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("stock_finance_alerts")
    .update({
      status: input.status,
      attempt_count: input.attemptCount,
      next_attempt_at: input.nextAttemptAt ?? new Date().toISOString(),
      error_message: input.errorMessage ?? null,
      sent_at: input.sentAt ?? null,
      ...(input.currentQuantity !== undefined
        ? { current_quantity: input.currentQuantity }
        : {}),
      ...(input.minimumQuantity !== undefined
        ? { minimum_quantity: input.minimumQuantity }
        : {}),
    })
    .eq("id", alertId)
    .eq("status", "pending");

  if (error) {
    throw new Error("Não foi possível atualizar aviso financeiro");
  }
}

export async function processFinanceAlertById(
  alertId: string,
): Promise<"sent" | "pending" | "failed" | "skipped" | "cancelled"> {
  const alert = await loadAlert(alertId);

  if (!alert) {
    return "skipped";
  }

  if (
    !canProcessFinanceAlert({
      status: alert.status,
      attemptCount: alert.attempt_count,
      nextAttemptAt: new Date(alert.next_attempt_at),
    })
  ) {
    return "skipped";
  }

  const destination = getFinanceAlertEmail();

  if (!isValidFinanceAlertDestination(destination)) {
    return "skipped";
  }

  const supply = await loadSupplyContext(alert.supply_id);

  if (!supply) {
    await markAlertOutcome(alert.id, {
      status: "failed",
      attemptCount: 3,
      nextAttemptAt: null,
      errorMessage: getFinanceAlertProviderError(),
    });
    return "failed";
  }

  if (
    !needsReplenishment({
      currentQuantity: supply.currentQuantity,
      minimumQuantity: supply.minimumQuantity,
    })
  ) {
    const admin = createAdminClient();
    const closedAt = new Date().toISOString();
    await admin
      .from("stock_finance_alerts")
      .update({
        status: "cancelled",
        episode_closed_at: closedAt,
      })
      .eq("id", alert.id)
      .eq("status", "pending");
    return "cancelled";
  }

  const resend = getResendClient();
  const fromEmail = getReminderFromEmail();

  if (!resend || !fromEmail) {
    const nextAttemptCount = alert.attempt_count + 1;

    if (shouldMarkFinanceAlertFailed(nextAttemptCount)) {
      await markAlertOutcome(alert.id, {
        status: "failed",
        attemptCount: nextAttemptCount,
        nextAttemptAt: null,
        errorMessage: getFinanceAlertConfigError(),
      });
      return "failed";
    }

    const retryAt = getFinanceAlertNextAttemptAt(nextAttemptCount);

    await markAlertOutcome(alert.id, {
      status: "pending",
      attemptCount: nextAttemptCount,
      nextAttemptAt: retryAt?.toISOString() ?? null,
      errorMessage: getFinanceAlertConfigError(),
    });
    return "pending";
  }

  const content = buildFinanceAlertEmailContent({
    supplyName: supply.name,
    currentQuantity: supply.currentQuantity,
    minimumQuantity: supply.minimumQuantity,
    unit: supply.unit,
    alertedAt: new Date(),
    stockUrl: `${getAppBaseUrl()}/estoque`,
  });

  const nextAttemptCount = alert.attempt_count + 1;

  const { error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: destination,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  if (sendError) {
    if (shouldMarkFinanceAlertFailed(nextAttemptCount)) {
      await markAlertOutcome(alert.id, {
        status: "failed",
        attemptCount: nextAttemptCount,
        nextAttemptAt: null,
        errorMessage: getFinanceAlertProviderError(),
      });
      return "failed";
    }

    const retryAt = getFinanceAlertNextAttemptAt(nextAttemptCount);

    await markAlertOutcome(alert.id, {
      status: "pending",
      attemptCount: nextAttemptCount,
      nextAttemptAt: retryAt?.toISOString() ?? null,
      errorMessage: getFinanceAlertProviderError(),
    });
    return "pending";
  }

  await markAlertOutcome(alert.id, {
    status: "sent",
    attemptCount: nextAttemptCount,
    nextAttemptAt: null,
    errorMessage: null,
    sentAt: new Date().toISOString(),
    currentQuantity: supply.currentQuantity,
    minimumQuantity: supply.minimumQuantity,
  });

  return "sent";
}
