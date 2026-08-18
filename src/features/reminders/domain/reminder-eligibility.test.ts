import { describe, expect, it } from "vitest";

import {
  canProcessReminder,
  shouldEnqueueReminder,
} from "@/features/reminders/domain/reminder-eligibility";

describe("reminder-eligibility", () => {
  it("enfileira apenas consulta concluída", () => {
    expect(shouldEnqueueReminder("completed")).toBe(true);
    expect(shouldEnqueueReminder("confirmed")).toBe(false);
    expect(shouldEnqueueReminder("cancelled")).toBe(false);
  });

  it("não processa lembrete já enviado", () => {
    expect(
      canProcessReminder({
        status: "sent",
        attemptCount: 1,
        nextAttemptAt: new Date(0),
      }),
    ).toBe(false);
  });

  it("não processa lembrete falhou definitivo", () => {
    expect(
      canProcessReminder({
        status: "failed",
        attemptCount: 3,
        nextAttemptAt: new Date(0),
      }),
    ).toBe(false);
  });

  it("processa pendente quando chegou a hora", () => {
    expect(
      canProcessReminder({
        status: "pending",
        attemptCount: 1,
        nextAttemptAt: new Date(Date.now() - 1_000),
      }),
    ).toBe(true);
  });

  it("aguarda próxima tentativa no futuro", () => {
    expect(
      canProcessReminder({
        status: "pending",
        attemptCount: 1,
        nextAttemptAt: new Date(Date.now() + 60_000),
      }),
    ).toBe(false);
  });
});
