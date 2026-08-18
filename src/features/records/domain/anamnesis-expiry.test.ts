import { describe, expect, it } from "vitest";

import { evaluateAnamnesisExpiry } from "@/features/records/domain/anamnesis-expiry";

describe("evaluateAnamnesisExpiry", () => {
  it("marca anamnese ausente como expirada", () => {
    const result = evaluateAnamnesisExpiry({ signedAt: null });

    expect(result.isMissing).toBe(true);
    expect(result.isExpired).toBe(true);
  });

  it("considera vigente dentro de 12 meses", () => {
    const referenceDate = new Date("2026-08-18T12:00:00-03:00");
    const signedAt = new Date("2025-09-01T12:00:00-03:00");

    const result = evaluateAnamnesisExpiry({ signedAt, referenceDate });

    expect(result.isExpired).toBe(false);
    expect(result.isMissing).toBe(false);
  });

  it("expira após 12 meses da assinatura", () => {
    const referenceDate = new Date("2026-08-18T12:00:00-03:00");
    const signedAt = new Date("2024-08-01T12:00:00-03:00");

    const result = evaluateAnamnesisExpiry({ signedAt, referenceDate });

    expect(result.isExpired).toBe(true);
  });
});
