import { z } from "zod";

import {
  MANAGEABLE_ROLES,
  TEAM_COPY,
} from "@/features/team/domain/team-guards";
import type { UserRole } from "@/types/clinroma";

const roleSchema = z.enum(MANAGEABLE_ROLES as [UserRole, ...UserRole[]], {
  message: "Papel inválido",
});

export const PROVISION_MODES = ["invite_email", "temp_password"] as const;

export const CALENDAR_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const calendarColorSchema = z
  .string()
  .trim()
  .regex(CALENDAR_COLOR_REGEX, TEAM_COPY.invalidColor);

export const inviteCollaboratorSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(3, "Informe o nome do colaborador")
    .max(80, "Nome muito longo"),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
  role: roleSchema,
  mode: z.enum(PROVISION_MODES, { message: "Escolha como entregar o acesso" }),
});

export const changeRoleSchema = z.object({
  collaboratorId: z.string().uuid("Colaborador inválido"),
  role: roleSchema,
});

export const setActiveSchema = z.object({
  collaboratorId: z.string().uuid("Colaborador inválido"),
  active: z.boolean(),
});

export const resendInviteSchema = z.object({
  collaboratorId: z.string().uuid("Colaborador inválido"),
});

export const updateCollaboratorProfileSchema = z.object({
  collaboratorId: z.string().uuid("Colaborador inválido"),
  displayName: z
    .string()
    .trim()
    .min(3, "Informe o nome do colaborador")
    .max(80, "Nome muito longo"),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
});

export const updateDentistCardSchema = z.object({
  collaboratorId: z.string().uuid("Colaborador inválido"),
  fullName: z
    .string()
    .trim()
    .min(3, "Informe o nome clínico")
    .max(80, "Nome clínico muito longo"),
  cro: z
    .string()
    .trim()
    .max(40, "CRO muito longo")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  calendarColor: calendarColorSchema,
  active: z.boolean(),
});

export type InviteCollaboratorInput = z.infer<typeof inviteCollaboratorSchema>;
export type ProvisionMode = (typeof PROVISION_MODES)[number];
export type UpdateCollaboratorProfileInput = z.infer<
  typeof updateCollaboratorProfileSchema
>;
export type UpdateDentistCardInput = z.infer<typeof updateDentistCardSchema>;
