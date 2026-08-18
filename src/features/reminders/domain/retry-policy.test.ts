import { describe, expect, it } from "vitest";

import {
  getBackoffMinutesAfterAttempt,
  getNextAttemptAt,
  shouldMarkReminderFailed,
} from "@/features/reminders/domain/retry-policy";

describe("retry-policy", () => {
  it("aplica backoff de 5 min após tentativa 1", () => {
    expect(getBackoffMinutesAfterAttempt(1)).toBe(5);
  });

  it("aplica backoff de 15 min após tentativa 2", () => {
    expect(getBackoffMinutesAfterAttempt(2)).toBe(15);
  });

  it("encerra após 3 tentativas", () => {
    expect(getBackoffMinutesAfterAttempt(3)).toBeNull();
    expect(shouldMarkReminderFailed(3)).toBe(true);
  });

  it("primeira tentativa é imediata", () => {
    const from = new Date("2026-08-18T12:00:00.000Z");
    const next = getNextAttemptAt(0, from);

    expect(next?.toISOString()).toBe(from.toISOString());
  });
});
