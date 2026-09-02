import { z } from "zod";

import {
  isClinicDateTimeInThePast,
  PAST_SLOT_MESSAGE,
} from "@/features/agenda/domain/appointment-time";
import type { AppointmentStatus } from "@/types/clinroma";

const appointmentStatusSchema = z.enum([
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "no_show",
  "cancelled",
  "rescheduled",
] satisfies [AppointmentStatus, ...AppointmentStatus[]]);

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido (HH:MM)");

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida (AAAA-MM-DD)");

function validateEndAfterStart(
  data: { date: string; startTime: string; endTime: string },
  ctx: z.RefinementCtx,
) {
  const startsAt = new Date(`${data.date}T${data.startTime}:00`);
  const endsAt = new Date(`${data.date}T${data.endTime}:00`);

  if (endsAt <= startsAt) {
    ctx.addIssue({
      code: "custom",
      message: "O horário de fim deve ser posterior ao início",
      path: ["endTime"],
    });
  }
}

function validateNotInThePast(
  data: { date: string; startTime: string },
  ctx: z.RefinementCtx,
) {
  if (isClinicDateTimeInThePast(data.date, data.startTime)) {
    ctx.addIssue({
      code: "custom",
      message: PAST_SLOT_MESSAGE,
      path: ["startTime"],
    });
  }
}

export const appointmentFormSchema = z
  .object({
    patientId: z.string().uuid("Selecione um paciente"),
    dentistId: z.string().uuid("Selecione um dentista"),
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    status: appointmentStatusSchema,
    procedureName: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .superRefine(validateEndAfterStart);

export const createAppointmentSchema = appointmentFormSchema.superRefine(
  validateNotInThePast,
);

export const updateAppointmentSchema = appointmentFormSchema.extend({
  id: z.string().uuid("Consulta inválida"),
});

export const rescheduleAppointmentSchema = z
  .object({
    id: z.string().uuid("Consulta inválida"),
    dentistId: z.string().uuid("Selecione um dentista"),
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .superRefine(validateEndAfterStart)
  .superRefine(validateNotInThePast);

export const cancelAppointmentSchema = z.object({
  id: z.string().uuid("Consulta inválida"),
});

export const patientSearchSchema = z.object({
  query: z.string().trim().min(1, "Digite ao menos 1 caractere").max(100),
});

export type AppointmentFormInput = z.infer<typeof appointmentFormSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<
  typeof rescheduleAppointmentSchema
>;

export function buildAppointmentTimestamps(input: {
  date: string;
  startTime: string;
  endTime: string;
}): { startsAt: string; endsAt: string } {
  return {
    startsAt: `${input.date}T${input.startTime}:00`,
    endsAt: `${input.date}T${input.endTime}:00`,
  };
}
