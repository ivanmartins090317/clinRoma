import { describe, expect, it } from "vitest";

import { planSupplyBalanceAdjustment } from "@/features/stock/domain/supply-balance-edit";

describe("planSupplyBalanceAdjustment", () => {
  it("não cria ajuste quando o saldo do formulário não mudou", () => {
    expect(
      planSupplyBalanceAdjustment({
        liveQuantity: 45,
        baselineQuantity: 50,
        desiredQuantity: 50,
      }),
    ).toBeNull();
  });

  it("aumenta até o saldo informado", () => {
    expect(
      planSupplyBalanceAdjustment({
        liveQuantity: 50,
        baselineQuantity: 50,
        desiredQuantity: 60,
      }),
    ).toEqual({ direction: "increase", quantity: 10 });
  });

  it("reduz até o saldo informado", () => {
    expect(
      planSupplyBalanceAdjustment({
        liveQuantity: 50,
        baselineQuantity: 50,
        desiredQuantity: 12.5,
      }),
    ).toEqual({ direction: "decrease", quantity: 37.5 });
  });

  it("não cria ajuste quando o saldo ao vivo já é o desejado", () => {
    expect(
      planSupplyBalanceAdjustment({
        liveQuantity: 40,
        baselineQuantity: 50,
        desiredQuantity: 40,
      }),
    ).toBeNull();
  });
});
