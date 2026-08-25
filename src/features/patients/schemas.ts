import { z } from "zod";

import { isValidCpf, normalizeCpf } from "@/features/patients/domain/cpf";
import {
  SECONDARY_PHONE_ERRORS,
  validateSecondaryContact,
  type SecondaryContactInput,
} from "@/features/patients/domain/secondary-phone";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

const secondaryContactFields = {
  secondaryPhone: z.string().optional(),
  secondaryPhoneNote: z.string().optional(),
};

function refineSecondaryContact(
  data: SecondaryContactInput,
  ctx: z.RefinementCtx,
) {
  const error = validateSecondaryContact(data);

  if (!error) {
    return;
  }

  const path =
    error === SECONDARY_PHONE_ERRORS.noteTooLong ||
    error === SECONDARY_PHONE_ERRORS.noteWithoutPhone
      ? ["secondaryPhoneNote"]
      : ["secondaryPhone"];

  ctx.addIssue({
    code: "custom",
    message: error,
    path,
  });
}

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
    ...secondaryContactFields,
  })
  .superRefine((data, ctx) => {
    refineSecondaryContact(data, ctx);

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
    ...secondaryContactFields,
  })
  .superRefine((data, ctx) => {
    refineSecondaryContact(data, ctx);

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
