import { describe, expect, it } from "vitest";

import { clinicDayBounds, parseClinicDateParam } from "@/features/agenda/types";
import type { AgendaAppointment, AgendaDentist } from "@/features/agenda/types";

import {
  AGENDA_RANGE_MAX_DAYS,
  clinicRangeBounds,
  formatAgendaDayLabel,
  groupAppointmentsByClinicDay,
  resolveAgendaDateRange,
} from "./agenda-range";

const dentists: AgendaDentist[] = [
  {
    id: "dentist-1",
    fullName: "Dr. Felipe Roma",
    calendarColor: "#5c1a2e",
  },
];

function appointment(id: string, startsAt: string): AgendaAppointment {
  return {
    id,
    patientId: "patient-1",
    patientName: "Maria Silva",
    dentistId: "dentist-1",
    dentistName: "Dr. Felipe Roma",
    dentistColor: "#5c1a2e",
    startsAt,
    endsAt: startsAt,
    status: "scheduled",
    procedureName: null,
    notes: null,
  };
}

describe("resolveAgendaDateRange", () => {
  it("usa o dia atual quando o período não vem na URL", () => {
    expect(resolveAgendaDateRange(undefined, undefined, "2026-09-29")).toEqual({
      from: "2026-09-29",
      to: "2026-09-29",
      isExplicit: false,
      wasClamped: false,
    });
  });

  it("ignora data inválida e inverte quando o fim vem antes do início", () => {
    expect(resolveAgendaDateRange("2026-02-31", "nope", "2026-09-29")).toEqual({
      from: "2026-09-29",
      to: "2026-09-29",
      isExplicit: false,
      wasClamped: false,
    });
    expect(
      resolveAgendaDateRange("2026-10-03", "2026-02-31", "2026-09-29"),
    ).toEqual({
      from: "2026-10-03",
      to: "2026-10-03",
      isExplicit: true,
      wasClamped: false,
    });
    expect(
      resolveAgendaDateRange("2026-10-03", "2026-09-29", "2026-09-01"),
    ).toEqual({
      from: "2026-09-29",
      to: "2026-10-03",
      isExplicit: true,
      wasClamped: false,
    });
  });

  it("limita o período a 31 dias", () => {
    const range = resolveAgendaDateRange(
      "2026-09-29",
      "2026-12-01",
      "2026-09-29",
    );

    expect(range.wasClamped).toBe(true);
    expect(range.to).toBe("2026-10-29");
    expect(AGENDA_RANGE_MAX_DAYS).toBe(31);
  });
});

describe("clinicRangeBounds", () => {
  it("cobre do início do primeiro dia ao fim do último no fuso da clínica", () => {
    const bounds = clinicRangeBounds("2026-09-29", "2026-10-01");

    expect(bounds.start).toBe(
      clinicDayBounds(parseClinicDateParam("2026-09-29")).start,
    );
    expect(bounds.end).toBe(
      clinicDayBounds(parseClinicDateParam("2026-10-01")).end,
    );
  });
});

describe("groupAppointmentsByClinicDay", () => {
  it("separa os dias pelo horário de São Paulo, não pelo UTC", () => {
    const days = groupAppointmentsByClinicDay(
      [
        appointment("late", "2026-09-30T02:30:00.000Z"),
        appointment("morning", "2026-09-30T13:00:00.000Z"),
      ],
      dentists,
    );

    expect(days.map((day) => day.date)).toEqual(["2026-09-29", "2026-09-30"]);
    expect(days[0]?.label).toBe(formatAgendaDayLabel("2026-09-29"));
    expect(days[0]?.label).toBe("Terça-feira, 29 de setembro");
    expect(days[0]?.groups[0]?.appointments.map((item) => item.id)).toEqual([
      "late",
    ]);
    expect(days[1]?.groups[0]?.appointments.map((item) => item.id)).toEqual([
      "morning",
    ]);
  });
});
