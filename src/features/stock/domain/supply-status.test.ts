import { describe, expect, it } from "vitest";

import {
  getSupplyStockStatus,
  isBelowMinimum,
  sortByStockCriticality,
} from "@/features/stock/domain/supply-status";

describe("supply-status", () => {
  it("marca zerado quando saldo é zero", () => {
    expect(
      getSupplyStockStatus({ currentQuantity: 0, minimumQuantity: 5 }),
    ).toBe("zeroed");
  });

  it("marca abaixo do mínimo", () => {
    expect(
      getSupplyStockStatus({ currentQuantity: 2, minimumQuantity: 5 }),
    ).toBe("below_minimum");
  });

  it("marca ok quando saldo atende mínimo", () => {
    expect(
      getSupplyStockStatus({ currentQuantity: 20, minimumQuantity: 5 }),
    ).toBe("ok");
  });

  it("ignora mínimo zero para alerta", () => {
    expect(isBelowMinimum({ currentQuantity: 0, minimumQuantity: 0 })).toBe(
      false,
    );
  });

  it("ordena por déficit absoluto", () => {
    const sorted = sortByStockCriticality([
      { name: "B", currentQuantity: 10, minimumQuantity: 20 },
      { name: "A", currentQuantity: 2, minimumQuantity: 5 },
    ]);

    expect(sorted.map((item) => item.name)).toEqual(["B", "A"]);
  });
});
