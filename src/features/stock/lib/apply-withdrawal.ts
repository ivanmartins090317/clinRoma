import type { SupabaseClient } from "@supabase/supabase-js";

import { resolvePackageStatus } from "@/features/stock/domain/package-status";
import { validateWithdrawal } from "@/features/stock/domain/withdrawal";
import { getClinicTodayDate } from "@/features/stock/lib/clinic-date";
import { syncFinanceAlertForSupply } from "@/features/stock/lib/enqueue-finance-alert";
import type { Database } from "@/lib/supabase/database.types";

type AppSupabase = SupabaseClient<Database>;

export interface WithdrawalResult {
  supplyId: string;
  supplyName: string;
  withdrawnQuantity: number;
  currentQuantity: number;
  unit: Database["public"]["Enums"]["supply_unit"];
}

export async function applyWithdrawal(input: {
  supabase: AppSupabase;
  qrCode: string;
  quantity: number;
  performerId: string;
  allowOverride: boolean;
  notes?: string;
}): Promise<WithdrawalResult> {
  const { data: pkg, error: packageError } = await input.supabase
    .from("supply_packages")
    .select(
      `
      id,
      qr_code,
      quantity,
      remaining_quantity,
      expires_at,
      status,
      supply_id,
      supplies (
        id,
        name,
        unit,
        current_quantity,
        minimum_quantity
      )
    `,
    )
    .eq("qr_code", input.qrCode)
    .maybeSingle();

  if (packageError) {
    throw new Error(packageError.message);
  }

  if (!pkg || !pkg.supplies) {
    throw new Error("Pacote não encontrado");
  }

  const supply = Array.isArray(pkg.supplies) ? pkg.supplies[0] : pkg.supplies;

  if (!supply) {
    throw new Error("Pacote não encontrado");
  }

  const packageStatus = resolvePackageStatus({
    remainingQuantity: Number(pkg.remaining_quantity),
    expiresAt: pkg.expires_at,
    todayInClinicTz: getClinicTodayDate(),
  });

  const validation = validateWithdrawal({
    requestedQuantity: input.quantity,
    packageRemainingQuantity: Number(pkg.remaining_quantity),
    supplyCurrentQuantity: Number(supply.current_quantity),
    packageStatus,
    allowOverride: input.allowOverride,
  });

  if (!validation.ok) {
    throw new Error(validation.error ?? "Retirada inválida");
  }

  const { error: movementError } = await input.supabase
    .from("supply_movements")
    .insert({
      supply_id: supply.id,
      package_id: pkg.id,
      movement_type: "out",
      quantity: input.quantity,
      performed_by: input.performerId,
      notes: input.notes ?? null,
    });

  if (movementError) {
    throw new Error(movementError.message);
  }

  const { data: updatedSupply, error: supplyError } = await input.supabase
    .from("supplies")
    .select("current_quantity")
    .eq("id", supply.id)
    .single();

  if (supplyError || !updatedSupply) {
    throw new Error("Falha ao consultar saldo atualizado");
  }

  await syncFinanceAlertForSupply(supply.id, {
    currentQuantity: Number(supply.current_quantity),
    minimumQuantity: Number(supply.minimum_quantity),
  });

  return {
    supplyId: supply.id,
    supplyName: supply.name,
    withdrawnQuantity: input.quantity,
    currentQuantity: Number(updatedSupply.current_quantity),
    unit: supply.unit,
  };
}
