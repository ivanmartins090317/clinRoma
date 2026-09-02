import { describe, expect, it } from "vitest";

import { toClinicIso } from "@/features/agenda/types";
import {
  isClinicDateTimeInThePast,
  nextAvailableClinicSlot,
  PAST_SLOT_MESSAGE,
} from "./appointment-time";

describe("appointment-time", () => {
  it("bloqueia data/hora no passado no fuso da clínica", () => {
    const now = new Date(toClinicIso("2026-09-02", "19:50"));

    expect(isClinicDateTimeInThePast("2026-09-01", "09:00", now)).toBe(true);
    expect(isClinicDateTimeInThePast("2026-09-02", "09:00", now)).toBe(true);
    expect(isClinicDateTimeInThePast("2026-09-02", "19:50", now)).toBe(true);
    expect(isClinicDateTimeInThePast("2026-09-02", "20:00", now)).toBe(false);
    expect(isClinicDateTimeInThePast("2026-09-03", "09:00", now)).toBe(false);
  });

  it("sugere o próximo bloco de 30 minutos", () => {
    const now = new Date(toClinicIso("2026-09-02", "19:17"));
    const slot = nextAvailableClinicSlot(30, now);

    expect(slot).toEqual({
      date: "2026-09-02",
      startTime: "19:30",
      endTime: "20:00",
    });
    expect(PAST_SLOT_MESSAGE).toContain("passado");
  });
});
