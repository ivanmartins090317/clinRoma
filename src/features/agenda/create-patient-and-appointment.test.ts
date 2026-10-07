import { describe, expect, it, vi } from "vitest";

import { createPatientAndAppointmentAction } from "@/features/agenda/create-patient-and-appointment";
import { nextAvailableClinicSlot } from "@/features/agenda/domain/appointment-time";
import { resolveNewConsultationSubmit } from "@/features/agenda/components/appointment-new-patient-panel";
import type { OverlapPrompt } from "@/features/agenda/domain/appointment-conflict";

vi.mock("@/features/patients/actions", () => ({
  createPatientAction: vi.fn(),
}));

vi.mock("@/features/agenda/actions", () => ({
  createAppointmentAction: vi.fn(),
}));

const PATIENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const EXISTING_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const APPOINTMENT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const DENTIST_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const PARTNER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function patientInput(overrides?: Record<string, unknown>) {
  return {
    fullName: "Liliane Romero",
    birthDate: "",
    cpf: "",
    contactPhone: "",
    contactEmail: "",
    secondaryPhone: "",
    secondaryPhoneNote: "",
    lgpdConsent: true,
    signatureName: "Liliane",
    ...overrides,
  };
}

function appointmentInput(overrides?: Record<string, unknown>) {
  const slot = nextAvailableClinicSlot(60);

  return {
    dentistId: DENTIST_ID,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: "scheduled",
    procedureName: "Avaliação",
    notes: "",
    ...overrides,
  };
}

function overlapPrompt(): OverlapPrompt {
  return {
    partnerId: PARTNER_ID,
    existingPatientName: "Ana Cirurgia",
    dentistName: "Dr. Felipe",
    existingStartLabel: "19:00",
    existingEndLabel: "21:00",
    incomingPatientName: "Liliane Romero",
    incomingStartLabel: "19:00",
    incomingEndLabel: "19:30",
  };
}

describe("createPatientAndAppointmentAction", () => {
  it("grava a pessoa e a consulta, com origem da nova consulta", async () => {
    const calls: string[] = [];
    const createPatient = vi.fn(async (input: unknown, origin?: string) => {
      calls.push("patient");
      expect(origin).toBe("agenda-nova-consulta");
      expect(input).toMatchObject({ fullName: "Liliane Romero" });
      return { success: true, patientId: PATIENT_ID };
    });
    const createAppointment = vi.fn(async (input: unknown) => {
      calls.push("appointment");
      expect(input).toMatchObject({
        patientId: PATIENT_ID,
        dentistId: DENTIST_ID,
      });
      return { success: true, appointmentId: APPOINTMENT_ID };
    });

    const result = await createPatientAndAppointmentAction(
      {
        patient: patientInput({ fullName: "  Liliane Romero  " }),
        appointment: appointmentInput(),
      },
      { createPatient, createAppointment },
    );

    expect(calls).toEqual(["patient", "appointment"]);
    expect(result).toMatchObject({
      success: true,
      patientId: PATIENT_ID,
      patientName: "Liliane Romero",
      appointmentId: APPOINTMENT_ID,
    });
  });

  it("não grava nada quando a pessoa ou a consulta não passam antes", async () => {
    const createPatient = vi.fn();
    const createAppointment = vi.fn();

    const invalidName = await createPatientAndAppointmentAction(
      {
        patient: patientInput({ fullName: "Li" }),
        appointment: appointmentInput(),
      },
      { createPatient, createAppointment },
    );
    const invalidSlot = await createPatientAndAppointmentAction(
      {
        patient: patientInput(),
        appointment: appointmentInput({ startTime: "10:00", endTime: "09:00" }),
      },
      { createPatient, createAppointment },
    );

    expect(invalidName.error).toBe("Informe o nome completo");
    expect(invalidSlot.error).toBe(
      "O horário de fim deve ser posterior ao início",
    );
    expect(createPatient).not.toHaveBeenCalled();
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it("CPF duplicado não cria outra pessoa e devolve quem já existe", async () => {
    const createPatient = vi.fn(async () => ({
      error: "CPF já cadastrado para Ana Silva.",
      existingPatientId: EXISTING_ID,
      existingPatientName: "Ana Silva",
    }));
    const createAppointment = vi.fn();

    const result = await createPatientAndAppointmentAction(
      {
        patient: patientInput({ cpf: "529.982.247-25" }),
        appointment: appointmentInput(),
      },
      { createPatient, createAppointment },
    );

    expect(result).toEqual({
      error: "CPF já cadastrado para Ana Silva.",
      existingPatientId: EXISTING_ID,
      existingPatientName: "Ana Silva",
    });
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it("falha de horário mantém a pessoa e não grava a consulta", async () => {
    const createPatient = vi.fn(async () => ({
      success: true,
      patientId: PATIENT_ID,
    }));
    const createAppointment = vi.fn(async () => ({
      error: "Horário indisponível para Dr. Felipe",
    }));

    const result = await createPatientAndAppointmentAction(
      { patient: patientInput(), appointment: appointmentInput() },
      { createPatient, createAppointment },
    );

    expect(createPatient).toHaveBeenCalledTimes(1);
    expect(createAppointment).toHaveBeenCalledTimes(1);
    expect(result.patientId).toBe(PATIENT_ID);
    expect(result.appointmentId).toBeUndefined();
    expect(result.success).toBeUndefined();
    expect(result.error).toBe("Horário indisponível para Dr. Felipe");
  });

  it("aviso de medicação devolve a pessoa sem gravar a consulta", async () => {
    const createPatient = vi.fn(async () => ({
      success: true,
      patientId: PATIENT_ID,
    }));
    const createAppointment = vi.fn(async (input: unknown) => {
      expect(
        input && typeof input === "object" && "pairConfirmation" in input
          ? input.pairConfirmation
          : undefined,
      ).toBeUndefined();
      return { overlap: overlapPrompt() };
    });

    const result = await createPatientAndAppointmentAction(
      { patient: patientInput(), appointment: appointmentInput() },
      { createPatient, createAppointment },
    );

    expect(createPatient).toHaveBeenCalledTimes(1);
    expect(result.patientId).toBe(PATIENT_ID);
    expect(result.appointmentId).toBeUndefined();
    expect(result.overlap?.partnerId).toBe(PARTNER_ID);
  });

  it("a confirmação da medicação não cadastra de novo", async () => {
    const prompt = overlapPrompt();
    const createPatient = vi.fn(async () => ({
      success: true,
      patientId: PATIENT_ID,
    }));
    const createAppointment = vi.fn(async (input: unknown) => {
      const confirmsPair =
        input &&
        typeof input === "object" &&
        "pairConfirmation" in input &&
        Boolean(input.pairConfirmation);

      if (confirmsPair) {
        return { success: true, appointmentId: APPOINTMENT_ID };
      }

      return { overlap: prompt };
    });

    const created = await createPatientAndAppointmentAction(
      { patient: patientInput(), appointment: appointmentInput() },
      { createPatient, createAppointment },
    );
    const kind = resolveNewConsultationSubmit({
      isEditing: false,
      panelOpen: false,
      patientId: created.patientId ?? "",
    });

    expect(kind).toBe("appointment-only");

    const confirmed =
      kind === "appointment-only"
        ? await createAppointment({
            ...appointmentInput(),
            patientId: created.patientId,
            pairConfirmation: { partnerId: prompt.partnerId },
          })
        : null;

    expect(confirmed).toMatchObject({
      success: true,
      appointmentId: APPOINTMENT_ID,
    });
    expect(createPatient).toHaveBeenCalledTimes(1);
    expect(createAppointment).toHaveBeenCalledTimes(2);
    expect(createAppointment.mock.calls[1]?.[0]).toMatchObject({
      patientId: PATIENT_ID,
      pairConfirmation: { partnerId: PARTNER_ID },
    });
  });
});

describe("resolveNewConsultationSubmit", () => {
  it("paciente já escolhido não passa pelo cadastro junto", () => {
    expect(
      resolveNewConsultationSubmit({
        isEditing: false,
        panelOpen: false,
        patientId: PATIENT_ID,
      }),
    ).toBe("appointment-only");

    expect(
      resolveNewConsultationSubmit({
        isEditing: false,
        panelOpen: true,
        patientId: PATIENT_ID,
      }),
    ).toBe("appointment-only");
  });

  it("edição não abre o cadastro junto", () => {
    expect(
      resolveNewConsultationSubmit({
        isEditing: true,
        panelOpen: true,
        patientId: "",
      }),
    ).toBe("appointment-only");
  });

  it("painel aberto sem pessoa escolhida cadastra e marca", () => {
    expect(
      resolveNewConsultationSubmit({
        isEditing: false,
        panelOpen: true,
        patientId: "",
      }),
    ).toBe("patient-and-appointment");
  });
});
