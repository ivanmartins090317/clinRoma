import { z } from "zod";

export const waitlistPrioritySchema = z.enum(["red", "yellow", "green"]);

export const waitlistEntryStatusSchema = z.enum([
  "waiting",
  "offered",
  "scheduled",
  "cancelled",
  "expired",
]);

export const createWaitlistEntrySchema = z.object({
  patientId: z.string().uuid("Paciente inválido"),
  priority: waitlistPrioritySchema,
  reason: z
    .string()
    .trim()
    .max(500, "Motivo muito longo")
    .optional()
    .or(z.literal("")),
  preferredDentistId: z
    .string()
    .uuid("Dentista inválido")
    .optional()
    .nullable(),
});

export const updateWaitlistEntrySchema = z.object({
  id: z.string().uuid(),
  priority: waitlistPrioritySchema.optional(),
  reason: z
    .string()
    .trim()
    .max(500, "Motivo muito longo")
    .optional()
    .or(z.literal("")),
  preferredDentistId: z.string().uuid().optional().nullable(),
});

export const removeWaitlistEntrySchema = z.object({
  id: z.string().uuid(),
});

export const createSlotOfferSchema = z.object({
  entryId: z.string().uuid(),
  dentistId: z.string().uuid("Dentista inválido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
});

export const cancelSlotOfferSchema = z.object({
  entryId: z.string().uuid(),
  offerId: z.string().uuid(),
});

export const publicSlotResponseSchema = z.object({
  token: z.string().min(16, "Token inválido"),
  action: z.enum(["accept", "decline"]),
  lgpdConsent: z.literal(true, {
    error: "Consentimento LGPD é obrigatório",
  }),
});

export type CreateWaitlistEntryInput = z.infer<
  typeof createWaitlistEntrySchema
>;
export type UpdateWaitlistEntryInput = z.infer<
  typeof updateWaitlistEntrySchema
>;
export type CreateSlotOfferInput = z.infer<typeof createSlotOfferSchema>;
export type PublicSlotResponseInput = z.infer<typeof publicSlotResponseSchema>;
