import type { SupabaseClient } from "@supabase/supabase-js";

import type { SupplyQuantitySnapshot } from "@/features/stock/domain/finance-alert";
import { generateSupplyQrCode } from "@/features/stock/domain/qr-code";
import { syncFinanceAlertForSupply } from "@/features/stock/lib/enqueue-finance-alert";
import type { Database } from "@/lib/supabase/database.types";

type AppSupabase = SupabaseClient<Database>;

export interface CreatedPackageResult {
  id: string;
  qrCode: string;
  quantity: number;
}

function randomQrEntropy(length: number): number[] {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values);
}

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

export async function generateUniqueQrCode(
  supabase: AppSupabase,
): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateSupplyQrCode(randomQrEntropy(12));
    const { data } = await supabase
      .from("supply_packages")
      .select("id")
      .eq("qr_code", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  throw new Error("Não foi possível gerar QR único");
}

export async function applyStockEntry(input: {
  supabase: AppSupabase;
  supplyId: string;
  performerId: string;
  quantity: number;
  lotNumber?: string;
  expiresAt?: string;
  notes?: string;
}): Promise<CreatedPackageResult> {
  const before = await readSupplySnapshot(input.supabase, input.supplyId);
  const qrCode = await generateUniqueQrCode(input.supabase);

  const { data: pkg, error: packageError } = await input.supabase
    .from("supply_packages")
    .insert({
      supply_id: input.supplyId,
      qr_code: qrCode,
      quantity: input.quantity,
      remaining_quantity: 0,
      lot_number: input.lotNumber ?? null,
      expires_at: input.expiresAt ?? null,
      status: "active",
    })
    .select("id, qr_code, quantity")
    .single();

  if (packageError || !pkg) {
    throw new Error(packageError?.message ?? "Falha ao criar pacote");
  }

  const { error: movementError } = await input.supabase
    .from("supply_movements")
    .insert({
      supply_id: input.supplyId,
      package_id: pkg.id,
      movement_type: "in",
      quantity: input.quantity,
      performed_by: input.performerId,
      notes: input.notes ?? null,
    });

  if (movementError) {
    throw new Error(movementError.message);
  }

  await syncFinanceAlertForSupply(input.supplyId, before);

  return {
    id: pkg.id,
    qrCode: pkg.qr_code,
    quantity: Number(pkg.quantity),
  };
}

export async function applyBulkEntry(input: {
  supabase: AppSupabase;
  supplyId: string;
  performerId: string;
  quantity: number;
  notes?: string;
}): Promise<void> {
  const before = await readSupplySnapshot(input.supabase, input.supplyId);
  const { error } = await input.supabase.from("supply_movements").insert({
    supply_id: input.supplyId,
    package_id: null,
    movement_type: "in",
    quantity: input.quantity,
    performed_by: input.performerId,
    notes: input.notes ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  await syncFinanceAlertForSupply(input.supplyId, before);
}
