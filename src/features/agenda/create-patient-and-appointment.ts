"use server";

import { createAppointmentAction } from "@/features/agenda/actions";
import type { AgendaActionResult } from "@/features/agenda/actions";
import type { OverlapPrompt } from "@/features/agenda/domain/appointment-conflict";
import { createAppointmentSchema } from "@/features/agenda/schemas";
import { createPatientAction } from "@/features/patients/actions";
import type { PatientActionResult } from "@/features/patients/actions";
import { createPatientSchema } from "@/features/patients/schemas";

const NEW_APPOINTMENT_ORIGIN = "agenda-nova-consulta";
const VALIDATION_PATIENT_ID = "00000000-0000-4000-8000-000000000001";

export interface CreatePatientAndAppointmentResult {
  success?: boolean;
  error?: string;
  patientId?: string;
  patientName?: string;
  appointmentId?: string;
  existingPatientId?: string;
  existingPatientName?: string;
  overlap?: OverlapPrompt;
}

interface CreatePatientAndAppointmentDeps {
  createPatient: (
    input: unknown,
    origin?: string,
  ) => Promise<PatientActionResult>;
  createAppointment: (input: unknown) => Promise<AgendaActionResult>;
}

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Dados inválidos";
}

function appointmentForValidation(appointment: unknown): unknown {
  if (!appointment || typeof appointment !== "object") {
    return { patientId: VALIDATION_PATIENT_ID };
  }

  return {
    ...appointment,
    patientId: VALIDATION_PATIENT_ID,
    pairConfirmation: undefined,
  };
}

function resolveDeps(
  deps?: CreatePatientAndAppointmentDeps,
): CreatePatientAndAppointmentDeps {
  return {
    createPatient:
      typeof deps?.createPatient === "function"
        ? deps.createPatient
        : createPatientAction,
    createAppointment:
      typeof deps?.createAppointment === "function"
        ? deps.createAppointment
        : createAppointmentAction,
  };
}

export async function createPatientAndAppointmentAction(
  input: {
    patient: unknown;
    appointment: unknown;
  },
  deps?: CreatePatientAndAppointmentDeps,
): Promise<CreatePatientAndAppointmentResult> {
  const patientParsed = createPatientSchema.safeParse(input.patient);

  if (!patientParsed.success) {
    return { error: firstIssueMessage(patientParsed.error) };
  }

  const appointmentParsed = createAppointmentSchema.safeParse(
    appointmentForValidation(input.appointment),
  );

  if (!appointmentParsed.success) {
    return { error: firstIssueMessage(appointmentParsed.error) };
  }

  const { createPatient, createAppointment } = resolveDeps(deps);
  const patientResult = await createPatient(
    patientParsed.data,
    NEW_APPOINTMENT_ORIGIN,
  );

  if (patientResult.existingPatientId) {
    return {
      error: patientResult.error,
      existingPatientId: patientResult.existingPatientId,
      existingPatientName: patientResult.existingPatientName,
    };
  }

  if (patientResult.error || !patientResult.patientId) {
    return {
      error: patientResult.error ?? "Não foi possível cadastrar o paciente.",
    };
  }

  const appointmentResult = await createAppointment({
    patientId: patientResult.patientId,
    dentistId: appointmentParsed.data.dentistId,
    date: appointmentParsed.data.date,
    startTime: appointmentParsed.data.startTime,
    endTime: appointmentParsed.data.endTime,
    status: appointmentParsed.data.status,
    procedureName: appointmentParsed.data.procedureName,
    notes: appointmentParsed.data.notes,
  });

  if (appointmentResult.overlap) {
    return {
      patientId: patientResult.patientId,
      patientName: patientParsed.data.fullName,
      overlap: appointmentResult.overlap,
    };
  }

  if (appointmentResult.error || !appointmentResult.success) {
    return {
      error: appointmentResult.error ?? "Não foi possível criar a consulta",
      patientId: patientResult.patientId,
      patientName: patientParsed.data.fullName,
    };
  }

  return {
    success: true,
    patientId: patientResult.patientId,
    patientName: patientParsed.data.fullName,
    appointmentId: appointmentResult.appointmentId,
  };
}
