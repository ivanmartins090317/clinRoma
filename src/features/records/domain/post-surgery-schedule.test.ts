import { describe, expect, it } from "vitest";

import {
  PATIENT_MESSAGE_COPY,
  PATIENT_MESSAGE_PURPOSE,
  PATIENT_MESSAGE_STATUS,
} from "@/features/records/domain/patient-message";
import {
  POST_SURGERY_MAX_ATTEMPTS,
  canCancelScheduledMessage,
  isDueScheduledMessage,
  nextStatusAfterSendAttempt,
  parseClinicDateTimeLocal,
  validateScheduleInput,
  validateScheduledAt,
} from "@/features/records/domain/post-surgery-schedule";

describe("horário de agendamento (America/Sao_Paulo)", () => {
  it("converte 08:00 de São Paulo para UTC", () => {
    const utc = parseClinicDateTimeLocal("2026-08-29T08:00");
    expect(utc?.toISOString()).toBe("2026-08-29T11:00:00.000Z");
    expect(parseClinicDateTimeLocal("2026-08-29T08:00:00")?.toISOString()).toBe(
      "2026-08-29T11:00:00.000Z",
    );
  });

  it("recusa formato inválido e calendário impossível", () => {
    expect(parseClinicDateTimeLocal("")).toBeNull();
    expect(parseClinicDateTimeLocal("29/08/2026 08:00")).toBeNull();
    expect(parseClinicDateTimeLocal("2026-13-01T08:00")).toBeNull();
    expect(parseClinicDateTimeLocal("2026-08-29T24:00")).toBeNull();
  });

  it("recusa horário no passado e aceita o futuro", () => {
    const now = new Date("2026-08-28T14:00:00.000Z");
    const past = parseClinicDateTimeLocal("2026-08-28T10:00");
    const future = parseClinicDateTimeLocal("2026-08-29T08:00");

    expect(past).not.toBeNull();
    expect(future).not.toBeNull();
    expect(validateScheduledAt(past!, now)).toBe(
      PATIENT_MESSAGE_COPY.pastSchedule,
    );
    expect(validateScheduledAt(future!, now)).toBeNull();
  });

  it("validateScheduleInput cobre vazio, inválido e futuro", () => {
    const now = new Date("2026-08-28T14:00:00.000Z");
    expect(validateScheduleInput("", now)).toEqual({
      error: PATIENT_MESSAGE_COPY.missingSchedule,
    });
    expect(validateScheduleInput("amanha", now)).toEqual({
      error: PATIENT_MESSAGE_COPY.invalidSchedule,
    });
    const ok = validateScheduleInput("2026-08-29T08:00", now);
    expect("scheduledAt" in ok).toBe(true);
  });
});

describe("vencimento para o cron", () => {
  const now = new Date("2026-08-29T11:00:00.000Z");

  it("processa pós-cirurgia ou oferta da fila pendente com horário vencido", () => {
    expect(
      isDueScheduledMessage({
        purpose: PATIENT_MESSAGE_PURPOSE.postSurgery,
        status: PATIENT_MESSAGE_STATUS.pending,
        scheduledAt: "2026-08-29T11:00:00.000Z",
        attemptCount: 0,
        now,
      }),
    ).toBe(true);
    expect(
      isDueScheduledMessage({
        purpose: PATIENT_MESSAGE_PURPOSE.slotOffer,
        status: PATIENT_MESSAGE_STATUS.pending,
        scheduledAt: "2026-08-29T11:00:00.000Z",
        attemptCount: 0,
        now,
      }),
    ).toBe(true);
    expect(
      isDueScheduledMessage({
        purpose: PATIENT_MESSAGE_PURPOSE.postSurgery,
        status: PATIENT_MESSAGE_STATUS.pending,
        scheduledAt: "2026-08-29T12:00:00.000Z",
        attemptCount: 0,
        now,
      }),
    ).toBe(false);
  });

  it("não processa convite, cancelado, enviado ou teto de tentativas", () => {
    const due = {
      scheduledAt: "2026-08-29T10:00:00.000Z",
      attemptCount: 0,
      now,
    };

    expect(
      isDueScheduledMessage({
        ...due,
        purpose: PATIENT_MESSAGE_PURPOSE.anamnesisInvite,
        status: PATIENT_MESSAGE_STATUS.pending,
      }),
    ).toBe(false);
    expect(
      isDueScheduledMessage({
        ...due,
        purpose: PATIENT_MESSAGE_PURPOSE.postSurgery,
        status: PATIENT_MESSAGE_STATUS.cancelled,
      }),
    ).toBe(false);
    expect(
      isDueScheduledMessage({
        ...due,
        purpose: PATIENT_MESSAGE_PURPOSE.postSurgery,
        status: PATIENT_MESSAGE_STATUS.sent,
      }),
    ).toBe(false);
    expect(
      isDueScheduledMessage({
        ...due,
        purpose: PATIENT_MESSAGE_PURPOSE.postSurgery,
        status: PATIENT_MESSAGE_STATUS.pending,
        attemptCount: POST_SURGERY_MAX_ATTEMPTS,
      }),
    ).toBe(false);
  });
});

describe("retentativa e cancelamento", () => {
  it("mantém pending até a terceira falha", () => {
    expect(nextStatusAfterSendAttempt({ sent: true, attemptCount: 1 })).toBe(
      PATIENT_MESSAGE_STATUS.sent,
    );
    expect(nextStatusAfterSendAttempt({ sent: false, attemptCount: 1 })).toBe(
      PATIENT_MESSAGE_STATUS.pending,
    );
    expect(nextStatusAfterSendAttempt({ sent: false, attemptCount: 2 })).toBe(
      PATIENT_MESSAGE_STATUS.pending,
    );
    expect(
      nextStatusAfterSendAttempt({
        sent: false,
        attemptCount: POST_SURGERY_MAX_ATTEMPTS,
      }),
    ).toBe(PATIENT_MESSAGE_STATUS.failed);
  });

  it("só cancela o que ainda está agendado", () => {
    expect(canCancelScheduledMessage(PATIENT_MESSAGE_STATUS.pending)).toBe(
      true,
    );
    expect(canCancelScheduledMessage(PATIENT_MESSAGE_STATUS.sent)).toBe(false);
    expect(canCancelScheduledMessage(PATIENT_MESSAGE_STATUS.failed)).toBe(
      false,
    );
    expect(canCancelScheduledMessage(PATIENT_MESSAGE_STATUS.cancelled)).toBe(
      false,
    );
  });
});
