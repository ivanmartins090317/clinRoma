export type PackageStatus = "active" | "depleted" | "expired";

export interface PackageStatusInput {
  remainingQuantity: number;
  expiresAt: string | null;
  todayInClinicTz: string;
}

export function resolvePackageStatus(input: PackageStatusInput): PackageStatus {
  if (input.expiresAt && input.expiresAt < input.todayInClinicTz) {
    return "expired";
  }

  if (input.remainingQuantity <= 0) {
    return "depleted";
  }

  return "active";
}

export function getPackageStatusLabel(status: PackageStatus): string {
  const labels: Record<PackageStatus, string> = {
    active: "Ativo",
    depleted: "Esgotado",
    expired: "Vencido",
  };

  return labels[status];
}

export function canWithdrawPackage(
  status: PackageStatus,
  options: { allowOverride: boolean },
): boolean {
  if (status === "active") {
    return true;
  }

  return options.allowOverride;
}
