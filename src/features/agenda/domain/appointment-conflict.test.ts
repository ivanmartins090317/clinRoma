import { describe, expect, it } from "vitest";

import {
  findConflictingAppointments,
  hasAppointmentConflict,
} from "@/features/agenda/domain/appointment-conflict";
import type { AppointmentInterval } from "@/features/agenda/domain/appointment-conflict";

const baseAppointments: AppointmentInterval[] = [
  {
    id: "appt-1",
    dentistId: "dentist-a",
    startsAt: new Date("2026-08-18T10:00:00-03:00"),
    endsAt: new Date("2026-08-18T11:00:00-03:00"),
    status: "scheduled",
  },
  {
    id: "appt-2",
    dentistId: "dentist-b",
    startsAt: new Date("2026-08-18T10:00:00-03:00"),
    endsAt: new Date("2026-08-18T11:00:00-03:00"),
    status: "scheduled",
  },
  {
    id: "appt-3",
    dentistId: "dentist-a",
    startsAt: new Date("2026-08-18T14:00:00-03:00"),
    endsAt: new Date("2026-08-18T15:00:00-03:00"),
    status: "cancelled",
  },
];

describe("hasAppointmentConflict", () => {
  it("detecta sobreposição parcial no mesmo dentista", () => {
    const candidate = {
      dentistId: "dentist-a",
      startsAt: new Date("2026-08-18T10:30:00-03:00"),
      endsAt: new Date("2026-08-18T11:30:00-03:00"),
    };

    expect(hasAppointmentConflict(candidate, baseAppointments)).toBe(true);
  });

  it("permite horário adjacente sem sobreposição", () => {
    const candidate = {
      dentistId: "dentist-a",
      startsAt: new Date("2026-08-18T11:00:00-03:00"),
      endsAt: new Date("2026-08-18T12:00:00-03:00"),
    };

    expect(hasAppointmentConflict(candidate, baseAppointments)).toBe(false);
  });

  it("ignora consultas canceladas e remarcadas", () => {
    const candidate = {
      dentistId: "dentist-a",
      startsAt: new Date("2026-08-18T14:30:00-03:00"),
      endsAt: new Date("2026-08-18T15:30:00-03:00"),
    };

    expect(hasAppointmentConflict(candidate, baseAppointments)).toBe(false);
  });

  it("ignora consulta rescheduled", () => {
    const appointments: AppointmentInterval[] = [
      {
        id: "appt-rescheduled",
        dentistId: "dentist-a",
        startsAt: new Date("2026-08-18T09:00:00-03:00"),
        endsAt: new Date("2026-08-18T10:00:00-03:00"),
        status: "rescheduled",
      },
    ];

    const candidate = {
      dentistId: "dentist-a",
      startsAt: new Date("2026-08-18T09:30:00-03:00"),
      endsAt: new Date("2026-08-18T10:30:00-03:00"),
    };

    expect(hasAppointmentConflict(candidate, appointments)).toBe(false);
  });

  it("não conflita entre dentistas diferentes", () => {
    const candidate = {
      dentistId: "dentist-b",
      startsAt: new Date("2026-08-18T10:30:00-03:00"),
      endsAt: new Date("2026-08-18T11:30:00-03:00"),
    };

    expect(hasAppointmentConflict(candidate, baseAppointments)).toBe(true);
    expect(
      hasAppointmentConflict(
        { ...candidate, dentistId: "dentist-c" },
        baseAppointments,
      ),
    ).toBe(false);
  });

  it("exclui a própria consulta na edição", () => {
    const candidate = {
      dentistId: "dentist-a",
      startsAt: new Date("2026-08-18T10:15:00-03:00"),
      endsAt: new Date("2026-08-18T10:45:00-03:00"),
      excludeId: "appt-1",
    };

    expect(hasAppointmentConflict(candidate, baseAppointments)).toBe(false);
  });
});

describe("findConflictingAppointments", () => {
  it("retorna todas as consultas em conflito", () => {
    const conflicts = findConflictingAppointments(
      {
        dentistId: "dentist-a",
        startsAt: new Date("2026-08-18T09:45:00-03:00"),
        endsAt: new Date("2026-08-18T10:15:00-03:00"),
      },
      baseAppointments,
    );

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.id).toBe("appt-1");
  });
});
