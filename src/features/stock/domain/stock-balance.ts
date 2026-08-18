export function applyBalanceDelta(
  currentQuantity: number,
  delta: number,
): number {
  return currentQuantity + delta;
}

export function assertNonNegativeBalance(nextQuantity: number): void {
  if (nextQuantity < 0) {
    throw new Error("Saldo insuficiente");
  }
}

export function computeWithdrawalBalances(input: {
  supplyCurrentQuantity: number;
  packageRemainingQuantity: number;
  withdrawQuantity: number;
}): {
  nextSupplyQuantity: number;
  nextPackageRemaining: number;
} {
  if (input.withdrawQuantity <= 0) {
    throw new Error("Quantidade inválida");
  }

  if (input.withdrawQuantity > input.packageRemainingQuantity) {
    throw new Error("Quantidade indisponível no pacote");
  }

  const nextSupplyQuantity = applyBalanceDelta(
    input.supplyCurrentQuantity,
    -input.withdrawQuantity,
  );
  const nextPackageRemaining = applyBalanceDelta(
    input.packageRemainingQuantity,
    -input.withdrawQuantity,
  );

  assertNonNegativeBalance(nextSupplyQuantity);
  assertNonNegativeBalance(nextPackageRemaining);

  return {
    nextSupplyQuantity,
    nextPackageRemaining,
  };
}

export function computeEntryBalances(input: {
  supplyCurrentQuantity: number;
  packageRemainingQuantity: number;
  entryQuantity: number;
}): {
  nextSupplyQuantity: number;
  nextPackageRemaining: number;
} {
  if (input.entryQuantity <= 0) {
    throw new Error("Quantidade inválida");
  }

  return {
    nextSupplyQuantity: applyBalanceDelta(
      input.supplyCurrentQuantity,
      input.entryQuantity,
    ),
    nextPackageRemaining: applyBalanceDelta(
      input.packageRemainingQuantity,
      input.entryQuantity,
    ),
  };
}

export function computeAdjustmentBalance(input: {
  currentQuantity: number;
  quantity: number;
  direction: "increase" | "decrease";
}): number {
  const delta =
    input.direction === "increase" ? input.quantity : -input.quantity;
  const nextQuantity = applyBalanceDelta(input.currentQuantity, delta);
  assertNonNegativeBalance(nextQuantity);
  return nextQuantity;
}
