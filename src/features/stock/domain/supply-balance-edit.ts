export type SupplyBalanceDirection = "increase" | "decrease";

export interface SupplyBalanceAdjustment {
  direction: SupplyBalanceDirection;
  quantity: number;
}

export interface SupplyBalanceEditInput {
  liveQuantity: number;
  baselineQuantity: number;
  desiredQuantity: number;
}

function toCents(value: number): number {
  return Math.round(value * 100);
}

export function planSupplyBalanceAdjustment(
  input: SupplyBalanceEditInput,
): SupplyBalanceAdjustment | null {
  const baseline = toCents(input.baselineQuantity);
  const desired = toCents(input.desiredQuantity);
  const live = toCents(input.liveQuantity);

  if (desired === baseline) {
    return null;
  }

  const delta = desired - live;

  if (delta === 0) {
    return null;
  }

  return {
    direction: delta > 0 ? "increase" : "decrease",
    quantity: Math.abs(delta) / 100,
  };
}

export const SUPPLY_BALANCE_EDIT_NOTE = "Correção pelo cadastro do insumo";
