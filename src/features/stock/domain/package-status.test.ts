import { describe, expect, it } from "vitest";

import {
  canWithdrawPackage,
  resolvePackageStatus,
} from "@/features/stock/domain/package-status";

describe("package-status", () => {
  it("marca vencido quando validade passou", () => {
    expect(
      resolvePackageStatus({
        remainingQuantity: 10,
        expiresAt: "2026-01-01",
        todayInClinicTz: "2026-08-18",
      }),
    ).toBe("expired");
  });

  it("marca esgotado quando restante é zero", () => {
    expect(
      resolvePackageStatus({
        remainingQuantity: 0,
        expiresAt: null,
        todayInClinicTz: "2026-08-18",
      }),
    ).toBe("depleted");
  });

  it("bloqueia retirada de pacote vencido sem override", () => {
    expect(canWithdrawPackage("expired", { allowOverride: false })).toBe(false);
    expect(canWithdrawPackage("expired", { allowOverride: true })).toBe(true);
  });
});
