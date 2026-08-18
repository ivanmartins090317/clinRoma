export type SupplyStockStatus = "ok" | "below_minimum" | "zeroed";

export interface SupplyQuantityInput {
  currentQuantity: number;
  minimumQuantity: number;
}

export function getSupplyStockStatus(
  input: SupplyQuantityInput,
): SupplyStockStatus {
  if (input.currentQuantity <= 0) {
    return "zeroed";
  }

  if (
    input.minimumQuantity > 0 &&
    input.currentQuantity < input.minimumQuantity
  ) {
    return "below_minimum";
  }

  return "ok";
}

export function getSupplyStockStatusLabel(status: SupplyStockStatus): string {
  const labels: Record<SupplyStockStatus, string> = {
    ok: "OK",
    below_minimum: "Abaixo do mínimo",
    zeroed: "Zerado",
  };

  return labels[status];
}

export function isBelowMinimum(input: SupplyQuantityInput): boolean {
  return getSupplyStockStatus(input) === "below_minimum";
}

export function sortByStockCriticality<
  T extends SupplyQuantityInput & { name: string },
>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftDeficit = Math.max(
      0,
      left.minimumQuantity - left.currentQuantity,
    );
    const rightDeficit = Math.max(
      0,
      right.minimumQuantity - right.currentQuantity,
    );

    if (rightDeficit !== leftDeficit) {
      return rightDeficit - leftDeficit;
    }

    const leftRatio =
      left.minimumQuantity > 0
        ? left.currentQuantity / left.minimumQuantity
        : Number.POSITIVE_INFINITY;
    const rightRatio =
      right.minimumQuantity > 0
        ? right.currentQuantity / right.minimumQuantity
        : Number.POSITIVE_INFINITY;

    if (leftRatio !== rightRatio) {
      return leftRatio - rightRatio;
    }

    return left.name.localeCompare(right.name, "pt-BR");
  });
}
