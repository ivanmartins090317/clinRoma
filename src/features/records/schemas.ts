import { z } from "zod";

import { ANAMNESIS_COPY } from "@/features/records/domain/anamnesis-form-v2";
import { TRANSCRIPTION_TEXT_MAX_LENGTH } from "@/features/records/domain/transcription-edit";

const paperAnswerSchema = z.object({
  answer: z.enum(["yes", "no"]).nullable(),
  complement: z.string().default(""),
});

export const saveAnamnesisSchema = z.object({
  patientId: z.string().uuid(),
  answers: z.record(z.string(), paperAnswerSchema),
  diseases: z.array(z.string()).default([]),
  otherDisease: z.string().optional(),
  signatureConfirmed: z.literal(true, {
    error: ANAMNESIS_COPY.missingDeclaration,
  }),
  signatureName: z.string().trim().min(2, ANAMNESIS_COPY.missingDeclaration),
});

export const generateAnamnesisInviteSchema = z.object({
  patientId: z.string().uuid(),
  purpose: z.enum(["pre_consult", "office"]),
});

export const submitAnamnesisInviteSchema = saveAnamnesisSchema
  .omit({ patientId: true })
  .extend({
    token: z.string().min(16, ANAMNESIS_COPY.genericInvite),
    consentConfirmed: z.literal(true, {
      error: ANAMNESIS_COPY.missingConsent,
    }),
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

export const updateTranscriptionSchema = z.object({
  attachmentId: z.string().uuid(),
  transcription: z
    .string()
    .trim()
    .min(1, "Informe o texto da transcrição.")
    .max(TRANSCRIPTION_TEXT_MAX_LENGTH, "Texto muito longo"),
});

export const readChartAuditSchema = z.object({
  patientId: z.string().uuid(),
  origin: z.enum(["agenda", "lista-pacientes"]).default("lista-pacientes"),
});

export type SaveAnamnesisInput = z.infer<typeof saveAnamnesisSchema>;
export type CreateEvolutionInput = z.infer<typeof createEvolutionSchema>;
export type GenerateAnamnesisInviteInput = z.infer<
  typeof generateAnamnesisInviteSchema
>;
export type SubmitAnamnesisInviteInput = z.infer<
  typeof submitAnamnesisInviteSchema
>;
