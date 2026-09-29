import { describe, expect, it } from "vitest";

import {
  chipWhatsAppPronto,
  contagemPronta,
} from "@/components/layout/menu-chips-ao-vivo";

describe("contagemPronta", () => {
  it("não trata ausência de leitura como zero", () => {
    expect(contagemPronta(null)).toBe(false);
  });

  it("aceita o número real, inclusive zero dentistas", () => {
    expect(contagemPronta(0)).toBe(true);
    expect(contagemPronta(5)).toBe(true);
  });
});

describe("chipWhatsAppPronto", () => {
  it("esconde o chip enquanto o estado não voltou", () => {
    expect(chipWhatsAppPronto("admin", undefined)).toBe(false);
    expect(chipWhatsAppPronto("reception", undefined)).toBe(false);
  });

  it("mostra ligado ou desligado só para admin e recepção", () => {
    expect(chipWhatsAppPronto("admin", "WORKING")).toBe(true);
    expect(chipWhatsAppPronto("admin", null)).toBe(true);
    expect(chipWhatsAppPronto("reception", "STOPPED")).toBe(true);
  });

  it("não mostra o chip para dentista, visualizador e auxiliar", () => {
    expect(chipWhatsAppPronto("dentist", "WORKING")).toBe(false);
    expect(chipWhatsAppPronto("viewer", null)).toBe(false);
    expect(chipWhatsAppPronto("room_assistant", "WORKING")).toBe(false);
  });
});
