import { describe, expect, it } from "vitest";

import {
  classifyAppointmentPlacement,
  findConflictingAppointments,
  formatOverlapBody,
  hasAppointmentConflict,
  hasPatientVisitConflict,
  OVERLAP_SUPPORT,
  OVERLAP_TITLE,
  planAppointmentWrite,
  THIRD_APPOINTMENT_MESSAGE,
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

function clock(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

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

describe("classifyAppointmentPlacement", () => {
  const surgery = slot({
    id: "surgery",
    patientName: "Ana Cirurgia",
    startsAt: at("19:00"),
    endsAt: at("21:00"),
  });

  it("pede confirmação quando o curto começa junto e termina antes", () => {
    const decision = classifyAppointmentPlacement(
      {
        dentistId: "dentist-a",
        startsAt: at("19:00"),
        endsAt: at("19:30"),
      },
      [surgery],
    );

    expect(decision.kind).toBe("confirm");
    expect(decision.candidateInductionMinutes).toBe(0);
    expect(decision.partnerInductionMinutes).toBe(30);
    expect(decision.partnerInductionMinutes).toBeLessThan(
      120,
    );
  });

  it("pede confirmação quando a mais longa é marcada depois", () => {
    const short = slot({
      id: "short",
      startsAt: at("19:00"),
      endsAt: at("19:30"),
    });

    const decision = classifyAppointmentPlacement(
      {
        dentistId: "dentist-a",
        startsAt: at("19:00"),
        endsAt: at("21:00"),
      },
      [short],
    );

    expect(decision.kind).toBe("confirm");
    expect(decision.candidateInductionMinutes).toBe(30);
    expect(decision.partnerInductionMinutes).toBe(0);
  });

  it.each([
    ["19:20", 20],
    ["19:40", 40],
  ])("usa o fim digitado %s como minutos da mais longa", (end, minutes) => {
    const decision = classifyAppointmentPlacement(
      {
        dentistId: "dentist-a",
        startsAt: at("19:00"),
        endsAt: at(end),
      },
      [surgery],
    );

    expect(decision.kind).toBe("confirm");
    expect(decision.partnerInductionMinutes).toBe(minutes);
    expect(decision.candidateInductionMinutes).toBe(0);
  });

  it("bloqueia início diferente que invade o trecho exclusivo", () => {
    const decision = classifyAppointmentPlacement(
      {
        dentistId: "dentist-a",
        startsAt: at("19:40"),
        endsAt: at("20:10"),
      },
      [surgery],
    );

    expect(decision.kind).toBe("blocked");
    expect(hasAppointmentConflict(
      {
        dentistId: "dentist-a",
        startsAt: at("19:40"),
        endsAt: at("20:10"),
      },
      [surgery],
    )).toBe(true);
  });

  it("bloqueia horários iguais no mesmo início", () => {
    const decision = classifyAppointmentPlacement(
      {
        dentistId: "dentist-a",
        startsAt: at("19:00"),
        endsAt: at("21:00"),
      },
      [surgery],
    );

    expect(decision.kind).toBe("blocked");
  });

  it("bloqueia a terceira consulta no mesmo início", () => {
    const short = slot({
      id: "short",
      startsAt: at("19:00"),
      endsAt: at("19:30"),
    });
    const decision = classifyAppointmentPlacement(
      {
        dentistId: "dentist-a",
        startsAt: at("19:00"),
        endsAt: at("19:15"),
      },
      [surgery, short],
    );

    expect(decision.kind).toBe("third");
  });

  it("bloqueia quem começa junto e ainda cruza outra consulta", () => {
    const later = slot({
      id: "later",
      startsAt: at("20:00"),
      endsAt: at("21:00"),
    });
    const decision = classifyAppointmentPlacement(
      {
        dentistId: "dentist-a",
        startsAt: at("19:00"),
        endsAt: at("19:30"),
      },
      [surgery, later],
    );

    expect(decision.kind).toBe("blocked");
  });

  it("encostar no minuto em que o exclusivo começa passa sem aviso", () => {
    const withInduction = slot({
      id: "surgery",
      startsAt: at("19:00"),
      endsAt: at("21:00"),
      inductionMinutes: 30,
    });
    const decision = classifyAppointmentPlacement(
      {
        dentistId: "dentist-a",
        startsAt: at("18:00"),
        endsAt: at("19:30"),
      },
      [withInduction],
    );

    expect(decision.kind).toBe("clear");
    expect(hasAppointmentConflict(
      {
        dentistId: "dentist-a",
        startsAt: at("18:00"),
        endsAt: at("19:30"),
      },
      [withInduction],
    )).toBe(false);
  });

  it("bloqueia visita que cruza fora do par e fora do encoste", () => {
    const withInduction = slot({
      id: "surgery",
      startsAt: at("19:00"),
      endsAt: at("21:00"),
      inductionMinutes: 30,
    });
    const decision = classifyAppointmentPlacement(
      {
        dentistId: "dentist-a",
        startsAt: at("19:10"),
        endsAt: at("19:20"),
      },
      [withInduction],
    );

    expect(decision.kind).toBe("blocked");
  });

  it("ignora cancelada no mesmo início e confirma o par com a ativa", () => {
    const cancelled = slot({
      id: "cancelled",
      startsAt: at("19:00"),
      endsAt: at("19:20"),
      status: "cancelled",
    });
    const decision = classifyAppointmentPlacement(
      {
        dentistId: "dentist-a",
        startsAt: at("19:00"),
        endsAt: at("19:30"),
      },
      [surgery, cancelled],
    );

    expect(decision.kind).toBe("confirm");
  });

  it("não mistura dentistas no par", () => {
    const otherDentist = slot({
      id: "other",
      dentistId: "dentist-b",
      startsAt: at("19:00"),
      endsAt: at("21:00"),
    });
    const decision = classifyAppointmentPlacement(
      {
        dentistId: "dentist-a",
        startsAt: at("19:00"),
        endsAt: at("19:30"),
      },
      [otherDentist],
    );

    expect(decision.kind).toBe("clear");
  });
});

describe("hasPatientVisitConflict", () => {
  const surgery = slot({
    id: "surgery",
    startsAt: at("19:00"),
    endsAt: at("21:00"),
    inductionMinutes: 30,
  });

  it("ocupa a visita inteira, inclusive a janela da medicação", () => {
    expect(
      hasPatientVisitConflict(
        {
          dentistId: "dentist-a",
          startsAt: at("19:00"),
          endsAt: at("19:30"),
        },
        [surgery],
      ),
    ).toBe(true);
    expect(
      hasPatientVisitConflict(
        {
          dentistId: "dentist-a",
          startsAt: at("19:30"),
          endsAt: at("20:00"),
        },
        [surgery],
      ),
    ).toBe(true);
  });

  it("libera o horário que só encosta no fim da visita", () => {
    expect(
      hasPatientVisitConflict(
        {
          dentistId: "dentist-a",
          startsAt: at("21:00"),
          endsAt: at("21:30"),
        },
        [surgery],
      ),
    ).toBe(false);
  });
});

describe("formatOverlapBody", () => {
  it("monta o aviso da criação e troca os nomes na edição", () => {
    const surgery = slot({
      id: "surgery",
      patientName: "Ana Cirurgia",
      startsAt: at("19:00"),
      endsAt: at("21:00"),
    });
    const base = {
      candidate: {
        dentistId: "dentist-a",
        patientName: "Bia Curta",
        startsAt: at("19:00"),
        endsAt: at("19:30"),
      },
      existing: [surgery],
      dentistName: "Dr. Felipe",
      confirmation: null,
      formatTime: (date: Date) => clock(date),
    };

    const created = planAppointmentWrite({ ...base, mode: "create" });
    const edited = planAppointmentWrite({ ...base, mode: "edit" });

    expect(OVERLAP_TITLE).toBe("Já existe uma consulta nesse horário");
    expect(OVERLAP_SUPPORT).toContain("medicação faz efeito");
    expect(created.overlap && formatOverlapBody(created.overlap)).toBe(
      "Ana Cirurgia já está marcado com Dr. Felipe das 22:00 às 00:00. Deseja marcar Bia Curta também, das 22:00 às 22:30?",
    );
    expect(edited.overlap?.existingPatientName).toBe("Bia Curta");
    expect(edited.overlap?.incomingPatientName).toBe("Ana Cirurgia");
  });
});

describe("planAppointmentWrite", () => {
  it("sem confirmação não grava o par", () => {
    const plan = planAppointmentWrite({
      candidate: {
        dentistId: "dentist-a",
        patientName: "Bia Curta",
        startsAt: at("19:00"),
        endsAt: at("19:30"),
      },
      existing: [
        slot({
          id: "surgery",
          patientName: "Ana Cirurgia",
          startsAt: at("19:00"),
          endsAt: at("21:00"),
        }),
      ],
      dentistName: "Dr. Felipe",
      mode: "create",
      formatTime: (date) => clock(date),
    });

    expect(plan.outcome).toBe("confirm");
    expect(plan.candidateInductionMinutes).toBe(0);
    expect(plan.partnerInductionMinutes).toBe(30);
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
          endsAt: at("19:40"),
        }),
      ],
      dentistName: "Dr. Felipe",
      mode: "create",
      confirmation: { partnerId: "short" },
      formatTime: (date) => clock(date),
    });

    expect(plan.outcome).toBe("save");
    expect(plan.candidateInductionMinutes).toBe(40);
    expect(plan.partnerInductionMinutes).toBe(0);
    expect(plan.partnerId).toBe("short");
  });

  it("a terceira não confirma mesmo com a flag", () => {
    const plan = planAppointmentWrite({
      candidate: {
        dentistId: "dentist-a",
        patientName: "Carla",
        startsAt: at("19:00"),
        endsAt: at("19:20"),
      },
      existing: [
        slot({
          id: "surgery",
          startsAt: at("19:00"),
          endsAt: at("21:00"),
        }),
        slot({
          id: "short",
          startsAt: at("19:00"),
          endsAt: at("19:30"),
        }),
      ],
      dentistName: "Dr. Felipe",
      mode: "create",
      confirmation: { partnerId: "surgery" },
      formatTime: (date) => clock(date),
    });

    expect(plan.outcome).toBe("reject");
    expect(plan.error).toBe(THIRD_APPOINTMENT_MESSAGE);
    expect(plan.partnerId).toBeUndefined();
  });

  it("grava como consulta comum se a outra foi cancelada antes de salvar", () => {
    const plan = planAppointmentWrite({
      candidate: {
        dentistId: "dentist-a",
        patientName: "Bia Curta",
        startsAt: at("19:00"),
        endsAt: at("19:30"),
      },
      existing: [],
      dentistName: "Dr. Felipe",
      mode: "create",
      confirmation: { partnerId: "surgery" },
      formatTime: (date) => clock(date),
    });

    expect(plan.outcome).toBe("save");
    expect(plan.candidateInductionMinutes).toBe(0);
    expect(plan.partnerId).toBeUndefined();
  });

  it("afastar o par zera a consulta que permanece", () => {
    const plan = planAppointmentWrite({
      candidate: {
        dentistId: "dentist-a",
        patientName: "Bia Curta",
        startsAt: at("15:00"),
        endsAt: at("15:30"),
        excludeId: "short",
      },
      existing: [
        slot({
          id: "surgery",
          startsAt: at("19:00"),
          endsAt: at("21:00"),
          inductionMinutes: 30,
        }),
      ],
      dentistName: "Dr. Felipe",
      mode: "edit",
      previousPartnerId: "surgery",
      formatTime: (date) => clock(date),
    });

    expect(plan.outcome).toBe("save");
    expect(plan.candidateInductionMinutes).toBe(0);
    expect(plan.releasePartnerId).toBe("surgery");
  });
});
