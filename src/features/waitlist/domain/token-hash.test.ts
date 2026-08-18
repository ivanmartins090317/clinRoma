import { describe, expect, it } from "vitest";

import {
  generateSlotOfferToken,
  hashSlotOfferToken,
  isPlainTokenStored,
} from "./token-hash";

describe("token-hash", () => {
  it("gera token aleatório longo", () => {
    const token = generateSlotOfferToken();

    expect(token.length).toBeGreaterThan(20);
    expect(generateSlotOfferToken()).not.toBe(token);
  });

  it("persiste somente hash determinístico", () => {
    const token = "clinroma-dev-waitlist-offer-001";
    const hash = hashSlotOfferToken(token);

    expect(hash).toBe(
      "98bd0a212868e9bad042b4141f4aa9db9aa029e79c6c5cd7fc039a409059383b",
    );
    expect(isPlainTokenStored(hash, token)).toBe(false);
  });
});
