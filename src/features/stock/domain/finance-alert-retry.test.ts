import { describe, expect, it } from "vitest";

import {
  getFinanceAlertBackoffMinutesAfterAttempt,
  getFinanceAlertNextAttemptAt,
  shouldMarkFinanceAlertFailed,
} from "@/features/stock/domain/finance-alert-retry";

describe("finance-alert-retry", () => {
  it("aplica backoff de 5 min após tentativa 1", () => {
    expect(getFinanceAlertBackoffMinutesAfterAttempt(1)).toBe(5);
  });

  it("aplica backoff de 15 min após tentativa 2", () => {
    expect(getFinanceAlertBackoffMinutesAfterAttempt(2)).toBe(15);
  });

  it("encerra após 3 tentativas", () => {
    expect(getFinanceAlertBackoffMinutesAfterAttempt(3)).toBeNull();
    expect(shouldMarkFinanceAlertFailed(3)).toBe(true);
  });

  it("primeira tentativa é imediata", () => {
    const from = new Date("2026-08-26T12:00:00.000Z");
    const next = getFinanceAlertNextAttemptAt(0, from);

    expect(next?.toISOString()).toBe(from.toISOString());
  });
});
