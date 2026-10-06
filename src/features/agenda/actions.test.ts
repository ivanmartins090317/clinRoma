import { describe, expect, it } from "vitest";

import {
  planAppointmentWrite,
  THIRD_APPOINTMENT_MESSAGE,
} from "@/features/agenda/domain/appointment-conflict";
import type { AppointmentInterval } from "@/features/agenda/domain/appointment-conflict";
import { getModuleAccess } from "@/lib/auth/roles";
import type { UserRole } from "@/types/clinroma";

function at(time: string): Date {
  return new Date(`2026-10-06T${time}:00-03:00`);
}

function slot(
  partial: Partial<AppointmentInterval> &
    Pick<AppointmentInterval, "id" | "startsAt" | "endsAt">,
): AppointmentInterval {
  return {
    dentistId: "dentist-a",
    status: "scheduled",
    inductionMinutes: 0,
    patientName: "Paciente",
    ...partial,
  };
}

function canWriteAgenda(role: UserRole): boolean {
  return getModuleAccess(role, "agenda") === "write";
}

describe("canWriteAgenda", () => {
  it("permite escrita para admin e recepção", () => {
    expect(canWriteAgenda("admin")).toBe(true);
    expect(canWriteAgenda("reception")).toBe(true);
  });

  it("bloqueia escrita para dentista, viewer e auxiliar", () => {
    expect(canWriteAgenda("dentist")).toBe(false);
    expect(canWriteAgenda("viewer")).toBe(false);
    expect(canWriteAgenda("room_assistant")).toBe(false);
  });
});

describe("gravação do par", () => {
  const surgery = slot({
    id: "surgery",
    patientName: "Ana Cirurgia",
    startsAt: at("19:00"),
    endsAt: at("21:00"),
  });

  it("sem confirmação não grava", () => {
    const plan = planAppointmentWrite({
      candidate: {
        dentistId: "dentist-a",
        patientName: "Bia Curta",
        startsAt: at("19:00"),
        endsAt: at("19:30"),
      },
      existing: [surgery],
      dentistName: "Dr. Felipe",
      mode: "create",
      formatTime: () => "19:00",
    });

    expect(plan.outcome).not.toBe("save");
    expect(plan.overlap?.partnerId).toBe("surgery");
  });

  it("com confirmação os minutos ficam só na mais longa", () => {
    const plan = planAppointmentWrite({
      candidate: {
        dentistId: "dentist-a",
        patientName: "Ana Cirurgia",
        startsAt: at("19:00"),
        endsAt: at("21:00"),
      },
      existing: [
        slot({
          id: "short",
          patientName: "Bia Curta",
          startsAt: at("19:00"),
          endsAt: at("19:30"),
        }),
      ],
      dentistName: "Dr. Felipe",
      mode: "create",
      confirmation: { partnerId: "short" },
      formatTime: () => "19:00",
    });

    expect(plan.outcome).toBe("save");
    expect(plan.candidateInductionMinutes).toBe(30);
    expect(plan.partnerInductionMinutes).toBe(0);
  });

  it("a terceira não confirma", () => {
    const plan = planAppointmentWrite({
      candidate: {
        dentistId: "dentist-a",
        patientName: "Carla",
        startsAt: at("19:00"),
        endsAt: at("19:10"),
      },
      existing: [
        surgery,
        slot({
          id: "short",
          startsAt: at("19:00"),
          endsAt: at("19:30"),
        }),
      ],
      dentistName: "Dr. Felipe",
      mode: "create",
      confirmation: { partnerId: "surgery" },
      formatTime: () => "19:00",
    });

    expect(plan.outcome).toBe("reject");
    expect(plan.error).toBe(THIRD_APPOINTMENT_MESSAGE);
  });
});
