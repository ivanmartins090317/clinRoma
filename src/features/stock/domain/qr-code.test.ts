import { describe, expect, it } from "vitest";

import {
  generateSupplyQrCode,
  isValidSupplyQrCode,
  normalizeScannedQrCode,
} from "@/features/stock/domain/qr-code";

describe("qr-code", () => {
  it("valida formato CR- com 12 caracteres", () => {
    expect(isValidSupplyQrCode("CR-ABCDEFGHJKLM")).toBe(true);
    expect(isValidSupplyQrCode("CR-DEV001")).toBe(false);
    expect(isValidSupplyQrCode("XX-ABCDEFGHJKLM")).toBe(false);
  });

  it("gera código prefixado", () => {
    const code = generateSupplyQrCode(Array.from({ length: 12 }, () => 3));
    expect(code.startsWith("CR-")).toBe(true);
    expect(isValidSupplyQrCode(code)).toBe(true);
  });

  it("normaliza leitura", () => {
    expect(normalizeScannedQrCode(" cr-dev001 ")).toBe("CR-DEV001");
  });
});
