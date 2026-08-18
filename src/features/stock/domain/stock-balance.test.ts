import { describe, expect, it } from "vitest";

import {
  computeAdjustmentBalance,
  computeEntryBalances,
  computeWithdrawalBalances,
} from "@/features/stock/domain/stock-balance";

describe("stock-balance", () => {
  it("calcula saldos após retirada", () => {
    expect(
      computeWithdrawalBalances({
        supplyCurrentQuantity: 300,
        packageRemainingQuantity: 100,
        withdrawQuantity: 40,
      }),
    ).toEqual({
      nextSupplyQuantity: 260,
      nextPackageRemaining: 60,
    });
  });

  it("rejeita retirada acima do pacote", () => {
    expect(() =>
      computeWithdrawalBalances({
        supplyCurrentQuantity: 300,
        packageRemainingQuantity: 10,
        withdrawQuantity: 20,
      }),
    ).toThrow("Quantidade indisponível no pacote");
  });

  it("calcula entrada de pacote", () => {
    expect(
      computeEntryBalances({
        supplyCurrentQuantity: 0,
        packageRemainingQuantity: 0,
        entryQuantity: 100,
      }),
    ).toEqual({
      nextSupplyQuantity: 100,
      nextPackageRemaining: 100,
    });
  });

  it("impede ajuste negativo abaixo de zero", () => {
    expect(() =>
      computeAdjustmentBalance({
        currentQuantity: 2,
        quantity: 5,
        direction: "decrease",
      }),
    ).toThrow("Saldo insuficiente");
  });
});
