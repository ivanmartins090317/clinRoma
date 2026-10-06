import { describe, expect, it } from "vitest";

import { PAST_SLOT_MESSAGE } from "@/features/agenda/domain/appointment-time";
import {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentSchema,
} from "@/features/agenda/schemas";
import { createSlotOfferSchema } from "@/features/waitlist/schemas";

const futureDate = "2099-01-15";
const pastDate = "2020-01-15";

describe("createAppointmentSchema", () => {
  it("recusa horário no passado", () => {
    const parsed = createAppointmentSchema.safeParse({
      patientId: "11111111-1111-4111-8111-111111111111",
      dentistId: "22222222-2222-4222-8222-222222222222",
      date: pastDate,
      startTime: "09:00",
      endTime: "09:30",
      status: "scheduled",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe(PAST_SLOT_MESSAGE);
    }
  });

  it("aceita horário futuro", () => {
    const parsed = createAppointmentSchema.safeParse({
      patientId: "11111111-1111-4111-8111-111111111111",
      dentistId: "22222222-2222-4222-8222-222222222222",
      date: futureDate,
      startTime: "09:00",
      endTime: "09:30",
      status: "scheduled",
    });

    expect(parsed.success).toBe(true);
  });

  it("aceita gravação sem confirmação do par", () => {
    const parsed = createAppointmentSchema.safeParse({
      patientId: "11111111-1111-4111-8111-111111111111",
      dentistId: "22222222-2222-4222-8222-222222222222",
      date: futureDate,
      startTime: "19:00",
      endTime: "19:30",
      status: "scheduled",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.pairConfirmation).toBeUndefined();
    }
  });

  it("aceita a confirmação do par e recusa id inválido", () => {
    const confirmed = createAppointmentSchema.safeParse({
      patientId: "11111111-1111-4111-8111-111111111111",
      dentistId: "22222222-2222-4222-8222-222222222222",
      date: futureDate,
      startTime: "19:00",
      endTime: "19:30",
      status: "scheduled",
      pairConfirmation: {
        partnerId: "33333333-3333-4333-8333-333333333333",
      },
    });
    const invalid = createAppointmentSchema.safeParse({
      patientId: "11111111-1111-4111-8111-111111111111",
      dentistId: "22222222-2222-4222-8222-222222222222",
      date: futureDate,
      startTime: "19:00",
      endTime: "19:30",
      status: "scheduled",
      pairConfirmation: { partnerId: "consulta" },
    });

    expect(confirmed.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});

describe("updateAppointmentSchema", () => {
  it("permite atualizar consulta já ocorrida", () => {
    const parsed = updateAppointmentSchema.safeParse({
      id: "33333333-3333-4333-8333-333333333333",
      patientId: "11111111-1111-4111-8111-111111111111",
      dentistId: "22222222-2222-4222-8222-222222222222",
      date: pastDate,
      startTime: "09:00",
      endTime: "09:30",
      status: "completed",
    });

    expect(parsed.success).toBe(true);
  });

  it("aceita edição com e sem confirmação do par", () => {
    const base = {
      id: "33333333-3333-4333-8333-333333333333",
      patientId: "11111111-1111-4111-8111-111111111111",
      dentistId: "22222222-2222-4222-8222-222222222222",
      date: futureDate,
      startTime: "19:00",
      endTime: "19:40",
      status: "scheduled" as const,
    };

    expect(updateAppointmentSchema.safeParse(base).success).toBe(true);
    expect(
      updateAppointmentSchema.safeParse({
        ...base,
        pairConfirmation: {
          partnerId: "44444444-4444-4444-8444-444444444444",
        },
      }).success,
    ).toBe(true);
    expect(
      rescheduleAppointmentSchema.safeParse({
        id: base.id,
        dentistId: base.dentistId,
        date: base.date,
        startTime: base.startTime,
        endTime: base.endTime,
        pairConfirmation: {
          partnerId: "44444444-4444-4444-8444-444444444444",
        },
      }).success,
    ).toBe(true);
  });
});

describe("createSlotOfferSchema", () => {
  it("recusa oferta no passado", () => {
    const parsed = createSlotOfferSchema.safeParse({
      entryId: "44444444-4444-4444-8444-444444444444",
      dentistId: "22222222-2222-4222-8222-222222222222",
      date: pastDate,
      startTime: "09:00",
      endTime: "09:30",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe(PAST_SLOT_MESSAGE);
    }
  });

  it("aceita oferta futura", () => {
    const parsed = createSlotOfferSchema.safeParse({
      entryId: "44444444-4444-4444-8444-444444444444",
      dentistId: "22222222-2222-4222-8222-222222222222",
      date: futureDate,
      startTime: "14:00",
      endTime: "14:30",
    });

    expect(parsed.success).toBe(true);
  });
});
