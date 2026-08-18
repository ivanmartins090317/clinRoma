import { z } from "zod";

import { isValidCpf, normalizeCpf } from "@/features/patients/domain/cpf";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const patientSearchSchema = z.object({
  query: z.string().trim().max(120).default(""),
  limit: z.number().int().min(1).max(50).default(20),
});

export const createPatientSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Informe o nome completo")
      .max(200, "Nome muito longo"),
    birthDate: optionalText,
    cpf: optionalText,
    contactPhone: optionalText,
    contactEmail: z
      .string()
      .trim()
      .email("E-mail inválido")
      .or(z.literal(""))
      .transform((value) => (value === "" ? undefined : value))
      .optional(),
    lgpdConsent: z.literal(true, {
      error: "Consentimento LGPD é obrigatório",
    }),
    signatureName: z
      .string()
      .trim()
      .min(2, "Informe o nome para assinatura do consentimento"),
  })
  .superRefine((data, ctx) => {
    if (!data.cpf) {
      return;
    }

    const normalized = normalizeCpf(data.cpf);

    if (!normalized || !isValidCpf(normalized)) {
      ctx.addIssue({
        code: "custom",
        message: "CPF inválido",
        path: ["cpf"],
      });
    }
  });

export const updatePatientSchema = z
  .object({
    id: z.string().uuid(),
    fullName: z
      .string()
      .trim()
      .min(3, "Informe o nome completo")
      .max(200, "Nome muito longo"),
    birthDate: optionalText,
    cpf: optionalText,
    contactPhone: optionalText,
    contactEmail: z
      .string()
      .trim()
      .email("E-mail inválido")
      .or(z.literal(""))
      .transform((value) => (value === "" ? undefined : value))
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.cpf) {
      return;
    }

    const normalized = normalizeCpf(data.cpf);

    if (!normalized || !isValidCpf(normalized)) {
      ctx.addIssue({
        code: "custom",
        message: "CPF inválido",
        path: ["cpf"],
      });
    }
  });

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
