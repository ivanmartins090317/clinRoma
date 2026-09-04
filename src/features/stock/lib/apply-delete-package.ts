import type { SupabaseClient } from "@supabase/supabase-js";

import type { SupplyQuantitySnapshot } from "@/features/stock/domain/finance-alert";
import { syncFinanceAlertForSupply } from "@/features/stock/lib/enqueue-finance-alert";
import type { Database } from "@/lib/supabase/database.types";

type AppSupabase = SupabaseClient<Database>;

async function readSupplySnapshot(
  supabase: AppSupabase,
  supplyId: string,
): Promise<SupplyQuantitySnapshot> {
  const { data } = await supabase
    .from("supplies")
    .select("current_quantity, minimum_quantity")
    .eq("id", supplyId)
    .maybeSingle();

  return {
    currentQuantity: Number(data?.current_quantity ?? 0),
    minimumQuantity: Number(data?.minimum_quantity ?? 0),
  };
}

export async function applyDeletePackage(input: {
  supabase: AppSupabase;
  packageId: string;
  performerId: string;
}): Promise<{ supplyId: string }> {
  const { data: pkg, error: packageError } = await input.supabase
    .from("supply_packages")
    .select("id, supply_id, qr_code, remaining_quantity")
    .eq("id", input.packageId)
    .maybeSingle();

  if (packageError) {
    throw new Error(packageError.message);
  }

  if (!pkg) {
    throw new Error("Pacote não encontrado");
  }

  const remaining = Number(pkg.remaining_quantity);
  const before = await readSupplySnapshot(input.supabase, pkg.supply_id);

  if (remaining > 0) {
    if (before.currentQuantity < remaining) {
      throw new Error(
        "Saldo do produto é menor que o restante do pacote. Ajuste o saldo antes de deletar.",
      );
    }

    const { error: adjustmentError } = await input.supabase
      .from("supply_movements")
      .insert({
        supply_id: pkg.supply_id,
        package_id: null,
        movement_type: "adjustment",
        quantity: remaining,
        adjustment_direction: "decrease",
        performed_by: input.performerId,
        notes: `Exclusão do pacote ${pkg.qr_code}`,
      });

    if (adjustmentError) {
      throw new Error(adjustmentError.message);
    }
  }

  const { error: deleteError } = await input.supabase
    .from("supply_packages")
    .delete()
    .eq("id", pkg.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  await syncFinanceAlertForSupply(pkg.supply_id, before);

  return { supplyId: pkg.supply_id };
}
