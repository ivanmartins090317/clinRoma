import {
  didEnterReplenishment,
  didLeaveReplenishment,
  hasOpenEpisodeAlert,
  isValidFinanceAlertDestination,
  needsReplenishment,
  shouldCreateAlertOnScan,
  shouldEnqueueFinanceAlert,
  type FinanceAlertStatus,
  type SupplyQuantitySnapshot,
} from "@/features/stock/domain/finance-alert";
import { processFinanceAlertById } from "@/features/stock/lib/send-finance-alert-email";
import { getFinanceAlertEmail } from "@/lib/email/resend-client";
import { createAdminClient } from "@/lib/supabase/admin";

function isDestinationValid(): boolean {
  return isValidFinanceAlertDestination(getFinanceAlertEmail());
}

async function loadSupplyQuantities(
  supplyId: string,
): Promise<SupplyQuantitySnapshot | null> {
  const admin = createAdminClient();
  const { data: supply, error } = await admin
    .from("supplies")
    .select("current_quantity, minimum_quantity")
    .eq("id", supplyId)
    .maybeSingle();

  if (error || !supply) {
    return null;
  }

  return {
    currentQuantity: Number(supply.current_quantity),
    minimumQuantity: Number(supply.minimum_quantity),
  };
}

async function loadOpenEpisode(supplyId: string): Promise<{
  id: string;
  status: FinanceAlertStatus;
  episodeClosedAt: string | null;
} | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("stock_finance_alerts")
    .select("id, status, episode_closed_at")
    .eq("supply_id", supplyId)
    .is("episode_closed_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    status: data.status,
    episodeClosedAt: data.episode_closed_at,
  };
}

export async function cancelOpenFinanceAlerts(
  supplyId: string,
): Promise<number> {
  const admin = createAdminClient();
  const closedAt = new Date().toISOString();

  const { data: pending, error: pendingError } = await admin
    .from("stock_finance_alerts")
    .update({
      status: "cancelled",
      episode_closed_at: closedAt,
    })
    .eq("supply_id", supplyId)
    .eq("status", "pending")
    .is("episode_closed_at", null)
    .select("id");

  if (pendingError) {
    throw new Error("Não foi possível cancelar aviso pendente");
  }

  const { error: closeError } = await admin
    .from("stock_finance_alerts")
    .update({ episode_closed_at: closedAt })
    .eq("supply_id", supplyId)
    .is("episode_closed_at", null)
    .in("status", ["sent", "failed"]);

  if (closeError) {
    throw new Error("Não foi possível encerrar episódio de aviso");
  }

  return pending?.length ?? 0;
}

export interface EnqueueFinanceAlertResult {
  id: string | null;
  created: boolean;
  outcome?: "sent" | "pending" | "failed" | "skipped" | "cancelled";
}

export async function enqueueFinanceAlertForSupply(
  supplyId: string,
  snapshot: SupplyQuantitySnapshot,
): Promise<EnqueueFinanceAlertResult> {
  if (!isDestinationValid()) {
    return { id: null, created: false };
  }

  const open = await loadOpenEpisode(supplyId);

  if (
    open &&
    hasOpenEpisodeAlert({
      status: open.status,
      episodeClosedAt: open.episodeClosedAt,
    })
  ) {
    return { id: open.id, created: false };
  }

  const admin = createAdminClient();
  const { data: created, error: insertError } = await admin
    .from("stock_finance_alerts")
    .insert({
      supply_id: supplyId,
      current_quantity: snapshot.currentQuantity,
      minimum_quantity: snapshot.minimumQuantity,
      status: "pending",
      attempt_count: 0,
      next_attempt_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !created) {
    if (insertError?.code === "23505") {
      const existing = await loadOpenEpisode(supplyId);
      return { id: existing?.id ?? null, created: false };
    }

    throw new Error("Não foi possível enfileirar aviso financeiro");
  }

  let outcome: EnqueueFinanceAlertResult["outcome"] = "pending";

  try {
    outcome = await processFinanceAlertById(created.id);
  } catch {
    // Falha no envio imediato não reverte o enfileiramento.
  }

  return { id: created.id, created: true, outcome };
}

export async function syncFinanceAlertForSupply(
  supplyId: string,
  before: SupplyQuantitySnapshot,
): Promise<void> {
  try {
    const after = await loadSupplyQuantities(supplyId);

    if (!after) {
      return;
    }

    const open = await loadOpenEpisode(supplyId);
    const hasOpen = Boolean(
      open &&
      hasOpenEpisodeAlert({
        status: open.status,
        episodeClosedAt: open.episodeClosedAt,
      }),
    );

    if (didLeaveReplenishment(before, after) && hasOpen) {
      await cancelOpenFinanceAlerts(supplyId);
      return;
    }

    if (
      !shouldEnqueueFinanceAlert({
        enteredReplenishment: didEnterReplenishment(before, after),
        destinationValid: isDestinationValid(),
        hasOpenEpisode: hasOpen,
      })
    ) {
      return;
    }

    await enqueueFinanceAlertForSupply(supplyId, after);
  } catch {
    // Falha do aviso não reverte movimentação de estoque.
  }
}

export async function createMissingFinanceAlerts(): Promise<{
  created: number;
  sent: number;
  failed: number;
}> {
  const tally = { created: 0, sent: 0, failed: 0 };

  if (!isDestinationValid()) {
    return tally;
  }

  const admin = createAdminClient();
  const { data: supplies, error } = await admin
    .from("supplies")
    .select("id, current_quantity, minimum_quantity")
    .gt("minimum_quantity", 0);

  if (error) {
    throw new Error("Não foi possível varrer insumos em reposição");
  }

  for (const supply of supplies ?? []) {
    const snapshot: SupplyQuantitySnapshot = {
      currentQuantity: Number(supply.current_quantity),
      minimumQuantity: Number(supply.minimum_quantity),
    };
    const open = await loadOpenEpisode(supply.id);
    const hasOpen = Boolean(
      open &&
      hasOpenEpisodeAlert({
        status: open.status,
        episodeClosedAt: open.episodeClosedAt,
      }),
    );

    if (
      !shouldCreateAlertOnScan({
        needsReplenishment: needsReplenishment(snapshot),
        destinationValid: true,
        hasOpenEpisode: hasOpen,
      })
    ) {
      continue;
    }

    const enqueued = await enqueueFinanceAlertForSupply(supply.id, snapshot);

    if (!enqueued.created) {
      continue;
    }

    tally.created += 1;

    if (enqueued.outcome === "sent") {
      tally.sent += 1;
    } else if (enqueued.outcome === "failed") {
      tally.failed += 1;
    }
  }

  return tally;
}
