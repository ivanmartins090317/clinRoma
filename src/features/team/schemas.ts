import { z } from "zod";

import { MANAGEABLE_ROLES } from "@/features/team/domain/team-guards";
import type { UserRole } from "@/types/clinroma";

const roleSchema = z.enum(MANAGEABLE_ROLES as [UserRole, ...UserRole[]], {
  message: "Papel inválido",
});

export const PROVISION_MODES = ["invite_email", "temp_password"] as const;

export const inviteCollaboratorSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(3, "Informe o nome do colaborador")
    .max(80, "Nome muito longo"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido"),
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

export type InviteCollaboratorInput = z.infer<typeof inviteCollaboratorSchema>;
export type ProvisionMode = (typeof PROVISION_MODES)[number];
