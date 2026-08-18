import {
  canWithdrawPackage,
  resolvePackageStatus,
  type PackageStatus,
} from "@/features/stock/domain/package-status";

export interface WithdrawalValidationInput {
  requestedQuantity: number;
  packageRemainingQuantity: number;
  supplyCurrentQuantity: number;
  packageStatus: PackageStatus;
  allowOverride: boolean;
}

export interface WithdrawalValidationResult {
  ok: boolean;
  error?: string;
}

export function validateWithdrawalQuantity(
  requestedQuantity: number,
  packageRemainingQuantity: number,
): WithdrawalValidationResult {
  if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
    return { ok: false, error: "Informe uma quantidade válida" };
  }

  if (requestedQuantity > packageRemainingQuantity) {
    return {
      ok: false,
      error: "Quantidade maior que o restante do pacote",
    };
  }

  return { ok: true };
}

export function validateWithdrawal(
  input: WithdrawalValidationInput,
): WithdrawalValidationResult {
  const quantityResult = validateWithdrawalQuantity(
    input.requestedQuantity,
    input.packageRemainingQuantity,
  );

  if (!quantityResult.ok) {
    return quantityResult;
  }

  if (input.requestedQuantity > input.supplyCurrentQuantity) {
    return { ok: false, error: "Saldo insuficiente" };
  }

  if (
    !canWithdrawPackage(input.packageStatus, {
      allowOverride: input.allowOverride,
    })
  ) {
    if (input.packageStatus === "expired") {
      return { ok: false, error: "Pacote vencido. Retirada bloqueada." };
    }

    return { ok: false, error: "Pacote esgotado. Retirada bloqueada." };
  }

  return { ok: true };
}

export function shouldIgnoreDuplicateScan(
  lastScannedCode: string | null,
  lastScannedAtMs: number | null,
  nextCode: string,
  nowMs: number,
  debounceMs = 3000,
): boolean {
  if (!lastScannedCode || lastScannedAtMs === null) {
    return false;
  }

  return lastScannedCode === nextCode && nowMs - lastScannedAtMs < debounceMs;
}

export function resolveWithdrawalPackageStatus(input: {
  remainingQuantity: number;
  expiresAt: string | null;
  todayInClinicTz: string;
}): PackageStatus {
  return resolvePackageStatus({
    remainingQuantity: input.remainingQuantity,
    expiresAt: input.expiresAt,
    todayInClinicTz: input.todayInClinicTz,
  });
}
