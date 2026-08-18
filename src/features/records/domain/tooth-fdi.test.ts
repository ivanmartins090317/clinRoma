import { describe, expect, it } from "vitest";

import {
  isValidFdiToothNumber,
  isValidToothCondition,
  isValidToothSurface,
  validateToothFinding,
} from "@/features/records/domain/tooth-fdi";

describe("tooth-fdi", () => {
  it("valida dente FDI conhecido", () => {
    expect(isValidFdiToothNumber(36)).toBe(true);
    expect(isValidFdiToothNumber(99)).toBe(false);
  });

  it("valida face e condição", () => {
    expect(isValidToothSurface("oclusal")).toBe(true);
    expect(isValidToothSurface("invalida")).toBe(false);
    expect(isValidToothCondition("restoration")).toBe(true);
    expect(isValidToothCondition("xyz")).toBe(false);
  });

  it("retorna erro para combinação inválida", () => {
    expect(
      validateToothFinding({
        toothNumber: 50,
        toothSurface: "oclusal",
        conditionCode: "caries",
      }),
    ).toMatch(/Dente inválido/);

    expect(
      validateToothFinding({
        toothNumber: 11,
        toothSurface: "oclusal",
        conditionCode: "caries",
      }),
    ).toBeNull();
  });
});
