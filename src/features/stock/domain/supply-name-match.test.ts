import { describe, expect, it } from "vitest";

import {
  matchSupplyName,
  normalizeSupplyName,
  supplyNameSimilarity,
} from "@/features/stock/domain/supply-name-match";

const catalog = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Luva nitrílica M" },
  { id: "22222222-2222-2222-2222-222222222222", name: "Gaze estéril" },
  { id: "33333333-3333-3333-3333-333333333333", name: "Anestésico" },
];

describe("normalizeSupplyName", () => {
  it("ignora maiúsculas, acentos e espaços repetidos", () => {
    expect(normalizeSupplyName("  Lúva   NITRÍLICA  M ")).toBe(
      "luva nitrilica m",
    );
  });
});

describe("matchSupplyName", () => {
  it("confiança alta quando o nome normalizado é igual", () => {
    expect(matchSupplyName("LUVA NITRÍLICA M", catalog)).toEqual({
      confidence: "high",
      mode: "existing",
      supplyId: catalog[0]?.id,
    });
  });

  it("confiança alta com um único candidato claramente melhor", () => {
    expect(matchSupplyName("Luva nitrilica", catalog)).toEqual({
      confidence: "high",
      mode: "existing",
      supplyId: catalog[0]?.id,
    });
  });

  it("confiança baixa em empate entre dois insumos parecidos", () => {
    const tied = [
      { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Luva nitrílica M" },
      { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "Luva nitrílica G" },
    ];

    const result = matchSupplyName("Luva nitrílica", tied);

    expect(result.confidence).toBe("low");
    expect(result.mode).toBe("new");
    expect(result.supplyId).toBeNull();
  });

  it("confiança baixa sem candidato", () => {
    expect(matchSupplyName("Broca diamantada", catalog)).toEqual({
      confidence: "low",
      mode: "new",
      supplyId: null,
    });
  });

  it("confiança baixa com semelhança fraca", () => {
    expect(matchSupplyName("xyz", catalog).confidence).toBe("low");
  });

  it("semelhança máxima para strings iguais após normalizar", () => {
    expect(supplyNameSimilarity("Anestésico", "anestesico")).toBe(1);
  });
});
