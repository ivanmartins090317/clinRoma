"use server";

import { revalidatePath } from "next/cache";

import type { SupplyQuantitySnapshot } from "@/features/stock/domain/finance-alert";
import {
  applyBulkEntry,
  applyStockEntry,
} from "@/features/stock/lib/apply-stock-entry";
import { applyWithdrawal } from "@/features/stock/lib/apply-withdrawal";
import { syncFinanceAlertForSupply } from "@/features/stock/lib/enqueue-finance-alert";
import {
  listSupplies,
  lookupPackageByQr,
  type PackageLookupResult,
  type SupplyListItem,
} from "@/features/stock/queries";
import {
  adjustSupplySchema,
  addPackageSchema,
  createSupplySchema,
  registerPurchaseSchema,
  updateSupplySchema,
  uploadSupplySheetSchema,
  withdrawPackageSchema,
} from "@/features/stock/schemas";
import { normalizeScannedQrCode } from "@/features/stock/domain/qr-code";
import { SUPPLY_UNIT_LABELS } from "@/features/stock/lib/clinic-date";
import { getModuleAccess } from "@/lib/auth/roles";
import { requireAuthSession } from "@/lib/auth/session";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/clinroma";

export interface StockActionResult {
  success?: boolean;
  error?: string;
  supplyId?: string;
  packages?: Array<{ id: string; qrCode: string; quantity: number }>;
}

export interface WithdrawActionResult {
  success?: boolean;
  error?: string;
  supplyName?: string;
  withdrawnQuantity?: number;
  currentQuantity?: number;
  unitLabel?: string;
}

function canReadStock(role: UserRole): boolean {
  return getModuleAccess(role, "stock") !== "none";
}

function canManageSupplies(role: UserRole): boolean {
  return getModuleAccess(role, "stock") === "write";
}

function canRegisterPackages(role: UserRole): boolean {
  return role === "admin" || role === "room_assistant";
}

function canScanWithdraw(role: UserRole): boolean {
  return getModuleAccess(role, "stock-scan") === "write";
}

async function readSupplySnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  supplyId: string,
): Promise<SupplyQuantitySnapshot | null> {
  const { data } = await supabase
    .from("supplies")
    .select("current_quantity, minimum_quantity")
    .eq("id", supplyId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    currentQuantity: Number(data.current_quantity),
    minimumQuantity: Number(data.minimum_quantity),
  };
}

const NEW_SUPPLY_SNAPSHOT: SupplyQuantitySnapshot = {
  currentQuantity: 0,
  minimumQuantity: 0,
};

async function assertStockRead() {
  const session = await requireAuthSession("/estoque");

  if (!canReadStock(session.profile.role)) {
    throw new Error("Sem permissão para consultar estoque");
  }

  if (!hasSupabaseConfig()) {
    throw new Error("Supabase não configurado");
  }

  return session;
}

export async function searchSuppliesAction(
  query: string,
): Promise<SupplyListItem[]> {
  await assertStockRead();
  return listSupplies(query);
}

export async function lookupPackageAction(
  rawCode: string,
): Promise<PackageLookupResult | null> {
  const session = await requireAuthSession("/estoque/scan");

  if (!canScanWithdraw(session.profile.role)) {
    throw new Error("Sem permissão para scan");
  }

  const qrCode = normalizeScannedQrCode(rawCode);
  return lookupPackageByQr(qrCode);
}

export async function createSupplyAction(
  input: unknown,
): Promise<StockActionResult> {
  try {
    const session = await requireAuthSession("/estoque");

    if (!canManageSupplies(session.profile.role)) {
      return { error: "Sem permissão para cadastrar insumo" };
    }

    const parsed = createSupplySchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("supplies")
      .insert({
        name: parsed.data.name,
        unit: parsed.data.unit,
        minimum_quantity: parsed.data.minimumQuantity,
        current_quantity: 0,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "Falha ao cadastrar insumo" };
    }

    if (parsed.data.initialQuantity > 0) {
      const { error: movementError } = await supabase
        .from("supply_movements")
        .insert({
          supply_id: data.id,
          movement_type: "in",
          quantity: parsed.data.initialQuantity,
          performed_by: session.profile.id,
          notes: "Saldo inicial",
        });

      if (movementError) {
        return { error: movementError.message };
      }
    }

    revalidatePath("/estoque");
    revalidatePath("/hoje");
    await syncFinanceAlertForSupply(data.id, NEW_SUPPLY_SNAPSHOT);
    return { success: true, supplyId: data.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function updateSupplyAction(
  input: unknown,
): Promise<StockActionResult> {
  try {
    const session = await requireAuthSession("/estoque");

    if (!canManageSupplies(session.profile.role)) {
      return { error: "Sem permissão para editar insumo" };
    }

    const parsed = updateSupplySchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const supabase = await createClient();
    const before = await readSupplySnapshot(supabase, parsed.data.id);
    const { error } = await supabase
      .from("supplies")
      .update({
        name: parsed.data.name,
        unit: parsed.data.unit,
        minimum_quantity: parsed.data.minimumQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/estoque");
    revalidatePath("/hoje");
    if (before) {
      await syncFinanceAlertForSupply(parsed.data.id, before);
    }
    return { success: true, supplyId: parsed.data.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function registerPurchaseAction(
  input: unknown,
): Promise<StockActionResult> {
  try {
    const session = await requireAuthSession("/estoque");

    if (!canRegisterPackages(session.profile.role)) {
      return { error: "Sem permissão para registrar compra" };
    }

    const parsed = registerPurchaseSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const supabase = await createClient();

    if (
      parsed.data.sheetStoragePath &&
      parsed.data.sheetMimeType &&
      parsed.data.sheetFileSizeBytes
    ) {
      const { error: sheetError } = await supabase
        .from("supply_sheets")
        .insert({
          storage_path: parsed.data.sheetStoragePath,
          mime_type: parsed.data.sheetMimeType,
          file_size_bytes: parsed.data.sheetFileSizeBytes,
          uploaded_by: session.profile.id,
        });

      if (sheetError) {
        return { error: sheetError.message };
      }
    }

    const createdPackages: Array<{
      id: string;
      qrCode: string;
      quantity: number;
    }> = [];

    for (const item of parsed.data.items) {
      let supplyId = item.supplyId;
      const before = supplyId
        ? ((await readSupplySnapshot(supabase, supplyId)) ??
          NEW_SUPPLY_SNAPSHOT)
        : NEW_SUPPLY_SNAPSHOT;

      if (!supplyId && item.newSupply) {
        const { data: created, error: createError } = await supabase
          .from("supplies")
          .insert({
            name: item.newSupply.name,
            unit: item.newSupply.unit,
            minimum_quantity: item.newSupply.minimumQuantity,
            current_quantity: 0,
          })
          .select("id")
          .single();

        if (createError || !created) {
          return { error: createError?.message ?? "Falha ao criar insumo" };
        }

        supplyId = created.id;
      }

      if (!supplyId) {
        return { error: "Selecione ou crie um insumo" };
      }

      for (let index = 0; index < item.packageCount; index += 1) {
        const created = await applyStockEntry({
          supabase,
          supplyId,
          performerId: session.profile.id,
          quantity: item.quantityPerPackage,
          lotNumber: item.lotNumber,
          expiresAt: item.expiresAt,
          notes: "Entrada via planilha",
        });
        createdPackages.push(created);
      }

      if (item.bulkQuantity && item.bulkQuantity > 0) {
        await applyBulkEntry({
          supabase,
          supplyId,
          performerId: session.profile.id,
          quantity: item.bulkQuantity,
          notes: "Entrada a granel via planilha",
        });
      }

      await syncFinanceAlertForSupply(supplyId, before);
    }

    revalidatePath("/estoque");
    revalidatePath("/hoje");
    return { success: true, packages: createdPackages };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function addPackageAction(
  input: unknown,
): Promise<StockActionResult> {
  try {
    const session = await requireAuthSession("/estoque");

    if (!canRegisterPackages(session.profile.role)) {
      return { error: "Sem permissão para adicionar pacote" };
    }

    const parsed = addPackageSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const supabase = await createClient();
    const created = await applyStockEntry({
      supabase,
      supplyId: parsed.data.supplyId,
      performerId: session.profile.id,
      quantity: parsed.data.quantity,
      lotNumber: parsed.data.lotNumber,
      expiresAt: parsed.data.expiresAt,
      notes: "Pacote avulso",
    });

    revalidatePath("/estoque");
    revalidatePath("/hoje");
    return {
      success: true,
      supplyId: parsed.data.supplyId,
      packages: [created],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function withdrawPackageAction(
  input: unknown,
): Promise<WithdrawActionResult> {
  try {
    const session = await requireAuthSession("/estoque/scan");

    if (!canScanWithdraw(session.profile.role)) {
      return { error: "Sem permissão para retirada" };
    }

    const parsed = withdrawPackageSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const allowOverride =
      parsed.data.allowOverride && session.profile.role === "admin";

    const supabase = await createClient();
    const result = await applyWithdrawal({
      supabase,
      qrCode: normalizeScannedQrCode(parsed.data.qrCode),
      quantity: parsed.data.quantity,
      performerId: session.profile.id,
      allowOverride,
      notes: parsed.data.notes,
    });

    revalidatePath("/estoque");
    revalidatePath("/hoje");

    return {
      success: true,
      supplyName: result.supplyName,
      withdrawnQuantity: result.withdrawnQuantity,
      currentQuantity: result.currentQuantity,
      unitLabel: SUPPLY_UNIT_LABELS[result.unit],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function adjustSupplyAction(
  input: unknown,
): Promise<StockActionResult> {
  try {
    const session = await requireAuthSession("/estoque");

    if (!canManageSupplies(session.profile.role)) {
      return { error: "Sem permissão para ajustar saldo" };
    }

    const parsed = adjustSupplySchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const supabase = await createClient();
    const before = await readSupplySnapshot(supabase, parsed.data.supplyId);
    const { error } = await supabase.from("supply_movements").insert({
      supply_id: parsed.data.supplyId,
      package_id: null,
      movement_type: "adjustment",
      quantity: parsed.data.quantity,
      adjustment_direction: parsed.data.direction,
      performed_by: session.profile.id,
      notes: parsed.data.notes,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/estoque");
    revalidatePath("/hoje");
    if (before) {
      await syncFinanceAlertForSupply(parsed.data.supplyId, before);
    }
    return { success: true, supplyId: parsed.data.supplyId };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function uploadSupplySheetAction(
  formData: FormData,
): Promise<StockActionResult & { storagePath?: string }> {
  try {
    const session = await requireAuthSession("/estoque");

    if (!canManageSupplies(session.profile.role)) {
      return { error: "Sem permissão para enviar planilha" };
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return { error: "Selecione um arquivo" };
    }

    const parsed = uploadSupplySheetSchema.safeParse({
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Arquivo inválido" };
    }

    const extension = parsed.data.mimeType.split("/")[1] ?? "jpg";
    const storagePath = `${session.profile.id}/${Date.now()}.${extension}`;
    const supabase = await createClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("supply-sheets")
      .upload(storagePath, buffer, {
        contentType: parsed.data.mimeType,
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    return { success: true, storagePath };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function adminOverrideWithdrawAction(
  input: unknown,
): Promise<WithdrawActionResult> {
  const payload =
    typeof input === "object" && input !== null
      ? { ...(input as Record<string, unknown>), allowOverride: true }
      : input;

  return withdrawPackageAction(payload);
}
