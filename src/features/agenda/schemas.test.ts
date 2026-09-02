import { describe, expect, it } from "vitest";

import { PAST_SLOT_MESSAGE } from "@/features/agenda/domain/appointment-time";
import {
  createAppointmentSchema,
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
