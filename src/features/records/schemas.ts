import { z } from "zod";

import { ANAMNESIS_FORM_VERSION } from "@/features/records/domain/anamnesis-form-v1";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const saveAnamnesisSchema = z.object({
  patientId: z.string().uuid(),
  generalHealth: optionalText,
  lastDentalVisit: optionalText,
  allergies: optionalText,
  medications: optionalText,
  systemicConditions: optionalText,
  pregnancy: optionalText,
  habits: optionalText,
  chiefComplaint: optionalText,
  signatureConfirmed: z.literal(true, {
    error: "Confirme a assinatura da anamnese",
  }),
  signatureName: z.string().trim().min(2, "Informe o nome para assinatura"),
});

export const upsertToothFindingSchema = z.object({
  patientId: z.string().uuid(),
  toothNumber: z.number().int(),
  toothSurface: z.string().trim().min(1),
  conditionCode: z.string().trim().min(1),
});

export const createEvolutionSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  text: z
    .string()
    .trim()
    .min(3, "Descreva a evolução clínica")
    .max(10000, "Texto muito longo"),
});

export const uploadPhotoSchema = z.object({
  patientId: z.string().uuid(),
  evolutionId: z.string().uuid(),
  mimeType: z.string().trim().min(1),
  fileSizeBytes: z.number().int().positive(),
  storagePath: z.string().trim().min(1),
});

export const finalizeAudioSchema = z.object({
  patientId: z.string().uuid(),
  evolutionId: z.string().uuid(),
  sessionId: z.string().uuid(),
  mimeType: z.string().trim().min(1),
  totalBytes: z.number().int().positive(),
});

export const retryTranscriptionSchema = z.object({
  attachmentId: z.string().uuid(),
});

export const readChartAuditSchema = z.object({
  patientId: z.string().uuid(),
  origin: z.enum(["agenda", "lista-pacientes"]).default("lista-pacientes"),
});

export type SaveAnamnesisInput = z.infer<typeof saveAnamnesisSchema>;
export type CreateEvolutionInput = z.infer<typeof createEvolutionSchema>;

export function buildAnamnesisContent(
  input: SaveAnamnesisInput,
): Record<string, unknown> {
  return {
    formVersion: ANAMNESIS_FORM_VERSION,
    signedAt: new Date().toISOString(),
    signatureName: input.signatureName,
    signatureConfirmed: true,
    generalHealth: input.generalHealth,
    lastDentalVisit: input.lastDentalVisit,
    allergies: input.allergies,
    medications: input.medications,
    systemicConditions: input.systemicConditions,
    pregnancy: input.pregnancy,
    habits: input.habits,
    chiefComplaint: input.chiefComplaint,
  };
}
