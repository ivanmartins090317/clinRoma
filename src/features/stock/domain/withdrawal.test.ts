import { describe, expect, it } from "vitest";

import {
  shouldIgnoreDuplicateScan,
  validateWithdrawal,
} from "@/features/stock/domain/withdrawal";

describe("withdrawal", () => {
  it("valida retirada parcial permitida", () => {
    expect(
      validateWithdrawal({
        requestedQuantity: 50,
        packageRemainingQuantity: 100,
        supplyCurrentQuantity: 300,
        packageStatus: "active",
        allowOverride: false,
      }),
    ).toEqual({ ok: true });
  });

  it("bloqueia pacote vencido para auxiliar", () => {
    expect(
      validateWithdrawal({
        requestedQuantity: 1,
        packageRemainingQuantity: 10,
        supplyCurrentQuantity: 10,
        packageStatus: "expired",
        allowOverride: false,
      }).error,
    ).toContain("vencido");
  });

  it("ignora leitura duplicada em intervalo curto", () => {
    expect(
      shouldIgnoreDuplicateScan("CR-DEV001", 1000, "CR-DEV001", 2500),
    ).toBe(true);
    expect(
      shouldIgnoreDuplicateScan("CR-DEV001", 1000, "CR-DEV001", 5000),
    ).toBe(false);
  });
});
