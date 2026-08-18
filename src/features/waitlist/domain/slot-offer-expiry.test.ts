import { describe, expect, it } from "vitest";

import {
  SLOT_OFFER_VALIDITY_MINUTES,
  computeSlotOfferExpiresAt,
  getSlotOfferRemainingMs,
  isSlotOfferExpired,
} from "./slot-offer-expiry";

describe("slot-offer-expiry", () => {
  it("calcula expiração em 40 minutos", () => {
    const createdAt = new Date("2026-08-18T10:00:00.000Z");
    const expiresAt = computeSlotOfferExpiresAt(createdAt);

    expect(expiresAt.toISOString()).toBe("2026-08-18T10:40:00.000Z");
    expect(SLOT_OFFER_VALIDITY_MINUTES).toBe(40);
  });

  it("detecta oferta expirada", () => {
    const expiresAt = new Date("2026-08-18T10:40:00.000Z");
    const before = new Date("2026-08-18T10:39:59.000Z");
    const after = new Date("2026-08-18T10:40:00.000Z");

    expect(isSlotOfferExpired(expiresAt, before)).toBe(false);
    expect(isSlotOfferExpired(expiresAt, after)).toBe(true);
  });

  it("retorna ms restantes sem valor negativo", () => {
    const expiresAt = new Date("2026-08-18T10:40:00.000Z");
    const now = new Date("2026-08-18T10:50:00.000Z");

    expect(getSlotOfferRemainingMs(expiresAt, now)).toBe(0);
  });
});
