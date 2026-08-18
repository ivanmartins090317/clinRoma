import {
  getSupplyStockStatus,
  getSupplyStockStatusLabel,
  isBelowMinimum,
  sortByStockCriticality,
} from "@/features/stock/domain/supply-status";
import {
  getPackageStatusLabel,
  resolvePackageStatus,
} from "@/features/stock/domain/package-status";
import {
  getClinicTodayDate,
  SUPPLY_UNIT_LABELS,
} from "@/features/stock/lib/clinic-date";
import { createClient } from "@/lib/supabase/server";
import type { SupplyType } from "@/types/clinroma";

export interface SupplyListItem {
  id: string;
  name: string;
  unit: SupplyType;
  unitLabel: string;
  currentQuantity: number;
  minimumQuantity: number;
  status: ReturnType<typeof getSupplyStockStatus>;
  statusLabel: string;
}

export interface SupplyPackageItem {
  id: string;
  qrCode: string;
  quantity: number;
  remainingQuantity: number;
  lotNumber: string | null;
  expiresAt: string | null;
  status: "active" | "depleted" | "expired";
  statusLabel: string;
}

export interface SupplyMovementItem {
  id: string;
  movementType: "in" | "out" | "adjustment";
  quantity: number;
  notes: string | null;
  createdAt: string;
  performerName: string | null;
  packageQrCode: string | null;
}

export interface SupplyDetail extends SupplyListItem {
  packages: SupplyPackageItem[];
  movements: SupplyMovementItem[];
}

export interface StockAlertItem {
  id: string;
  name: string;
  currentQuantity: number;
  minimumQuantity: number;
  unit: SupplyType;
  unitLabel: string;
}

function mapSupplyRow(row: {
  id: string;
  name: string;
  unit: SupplyType;
  current_quantity: number;
  minimum_quantity: number;
}): SupplyListItem {
  const status = getSupplyStockStatus({
    currentQuantity: Number(row.current_quantity),
    minimumQuantity: Number(row.minimum_quantity),
  });

  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    unitLabel: SUPPLY_UNIT_LABELS[row.unit],
    currentQuantity: Number(row.current_quantity),
    minimumQuantity: Number(row.minimum_quantity),
    status,
    statusLabel: getSupplyStockStatusLabel(status),
  };
}

export async function listSupplies(search = ""): Promise<SupplyListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("supplies")
    .select("id, name, unit, current_quantity, minimum_quantity")
    .order("name");

  const sanitized = search.trim();
  if (sanitized) {
    query = query.ilike("name", `%${sanitized}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapSupplyRow);
}

export async function getSupplyDetail(
  supplyId: string,
): Promise<SupplyDetail | null> {
  const supabase = await createClient();
  const today = getClinicTodayDate();

  const { data: supply, error } = await supabase
    .from("supplies")
    .select("id, name, unit, current_quantity, minimum_quantity")
    .eq("id", supplyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!supply) {
    return null;
  }

  const { data: packages } = await supabase
    .from("supply_packages")
    .select(
      "id, qr_code, quantity, remaining_quantity, lot_number, expires_at, status",
    )
    .eq("supply_id", supplyId)
    .order("created_at", { ascending: false });

  const { data: movements } = await supabase
    .from("supply_movements")
    .select(
      `
      id,
      movement_type,
      quantity,
      notes,
      created_at,
      profiles (display_name),
      supply_packages (qr_code)
    `,
    )
    .eq("supply_id", supplyId)
    .order("created_at", { ascending: false })
    .limit(20);

  const mappedPackages = (packages ?? []).map((row) => {
    const status = resolvePackageStatus({
      remainingQuantity: Number(row.remaining_quantity),
      expiresAt: row.expires_at,
      todayInClinicTz: today,
    });

    return {
      id: row.id,
      qrCode: row.qr_code,
      quantity: Number(row.quantity),
      remainingQuantity: Number(row.remaining_quantity),
      lotNumber: row.lot_number,
      expiresAt: row.expires_at,
      status,
      statusLabel: getPackageStatusLabel(status),
    };
  });

  const mappedMovements = (movements ?? []).map((row) => {
    const performer = Array.isArray(row.profiles)
      ? row.profiles[0]
      : row.profiles;
    const pkg = Array.isArray(row.supply_packages)
      ? row.supply_packages[0]
      : row.supply_packages;

    return {
      id: row.id,
      movementType: row.movement_type,
      quantity: Number(row.quantity),
      notes: row.notes,
      createdAt: row.created_at,
      performerName: performer?.display_name ?? null,
      packageQrCode: pkg?.qr_code ?? null,
    };
  });

  return {
    ...mapSupplyRow(supply),
    packages: mappedPackages,
    movements: mappedMovements,
  };
}

export async function getStockAlerts(): Promise<StockAlertItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplies")
    .select("id, name, unit, current_quantity, minimum_quantity")
    .gt("minimum_quantity", 0);

  if (error) {
    throw new Error(error.message);
  }

  const alerts = (data ?? [])
    .filter((row) =>
      isBelowMinimum({
        currentQuantity: Number(row.current_quantity),
        minimumQuantity: Number(row.minimum_quantity),
      }),
    )
    .map((row) => ({
      id: row.id,
      name: row.name,
      currentQuantity: Number(row.current_quantity),
      minimumQuantity: Number(row.minimum_quantity),
      unit: row.unit as SupplyType,
      unitLabel: SUPPLY_UNIT_LABELS[row.unit as SupplyType],
    }));

  return sortByStockCriticality(alerts);
}

export interface PackageLookupResult {
  packageId: string;
  qrCode: string;
  supplyId: string;
  supplyName: string;
  unit: SupplyType;
  unitLabel: string;
  remainingQuantity: number;
  lotNumber: string | null;
  expiresAt: string | null;
  status: "active" | "depleted" | "expired";
  statusLabel: string;
  supplyCurrentQuantity: number;
}

export async function lookupPackageByQr(
  qrCode: string,
): Promise<PackageLookupResult | null> {
  const supabase = await createClient();
  const today = getClinicTodayDate();

  const { data, error } = await supabase
    .from("supply_packages")
    .select(
      `
      id,
      qr_code,
      remaining_quantity,
      lot_number,
      expires_at,
      status,
      supplies (
        id,
        name,
        unit,
        current_quantity
      )
    `,
    )
    .eq("qr_code", qrCode)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.supplies) {
    return null;
  }

  const supply = Array.isArray(data.supplies)
    ? data.supplies[0]
    : data.supplies;

  if (!supply) {
    return null;
  }

  const status = resolvePackageStatus({
    remainingQuantity: Number(data.remaining_quantity),
    expiresAt: data.expires_at,
    todayInClinicTz: today,
  });

  return {
    packageId: data.id,
    qrCode: data.qr_code,
    supplyId: supply.id,
    supplyName: supply.name,
    unit: supply.unit as SupplyType,
    unitLabel: SUPPLY_UNIT_LABELS[supply.unit as SupplyType],
    remainingQuantity: Number(data.remaining_quantity),
    lotNumber: data.lot_number,
    expiresAt: data.expires_at,
    status,
    statusLabel: getPackageStatusLabel(status),
    supplyCurrentQuantity: Number(supply.current_quantity),
  };
}

export async function listSuppliesForSelect(): Promise<
  Array<{ id: string; name: string; unit: SupplyType }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplies")
    .select("id, name, unit")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    unit: row.unit as SupplyType,
  }));
}
