import { getModuleAccess } from "@/lib/auth/roles";
import type { UserRole } from "@/types/clinroma";

export const MANAGEABLE_ROLES: readonly UserRole[] = [
  "admin",
  "dentist",
  "reception",
  "room_assistant",
  "viewer",
];

export interface CollaboratorState {
  id: string;
  role: UserRole;
  active: boolean;
}

export interface RoleChangeIntent {
  actorId: string;
  targetId: string;
  nextRole?: UserRole;
  nextActive?: boolean;
}

export const TEAM_COPY = {
  noPermission: "Sem permissão para gerenciar a equipe.",
  selfMutation: "Você não pode alterar seu próprio papel ou acesso.",
  lastAdmin: "A clínica precisa de pelo menos um administrador ativo.",
  targetNotFound: "Colaborador não encontrado.",
  invalidRole: "Papel inválido.",
  emailInUse: "Este e-mail já tem acesso ao sistema.",
  emailServiceOff:
    "Serviço de e-mail não configurado. Gere uma senha temporária.",
  inviteFailed: "Não foi possível criar o acesso. Tente de novo.",
  inviteSent: "Convite enviado. O colaborador define a senha pelo link.",
  tempPasswordReady: "Acesso criado. Copie a senha e entregue ao colaborador.",
  roleChanged: "Papel atualizado.",
  deactivated: "Acesso desativado.",
  reactivated: "Acesso reativado.",
  writeDenied: "Sem permissão no banco para alterar acessos.",
  writeFailed: "Não foi possível salvar a alteração.",
} as const;

/** Traduz a recusa que veio do banco (trigger ou permissão) para copy de tela. */
export function describeWriteFailure(message?: string | null): string {
  if (!message) {
    return TEAM_COPY.writeFailed;
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("administrador ativo")) {
    return TEAM_COPY.lastAdmin;
  }

  if (normalized.includes("próprio papel")) {
    return TEAM_COPY.selfMutation;
  }

  if (
    normalized.includes("permission denied") ||
    normalized.includes("row-level security")
  ) {
    return TEAM_COPY.writeDenied;
  }

  return TEAM_COPY.writeFailed;
}

export function canManageTeam(role: UserRole): boolean {
  return getModuleAccess(role, "team") === "write";
}

export function isManageableRole(value: string): value is UserRole {
  return MANAGEABLE_ROLES.includes(value as UserRole);
}

export function isSelfMutation(actorId: string, targetId: string): boolean {
  return actorId === targetId;
}

/**
 * Uma clínica sem admin ativo fica sem quem gerencie acessos, e o único caminho
 * de volta seria o painel do Supabase.
 */
export function wouldRemoveLastAdmin(
  collaborators: readonly CollaboratorState[],
  intent: RoleChangeIntent,
): boolean {
  const target = collaborators.find((item) => item.id === intent.targetId);

  if (!target || target.role !== "admin" || !target.active) {
    return false;
  }

  const keepsAdminRole = (intent.nextRole ?? target.role) === "admin";
  const keepsActive = intent.nextActive ?? target.active;

  if (keepsAdminRole && keepsActive) {
    return false;
  }

  const otherActiveAdmins = collaborators.filter(
    (item) =>
      item.id !== intent.targetId && item.role === "admin" && item.active,
  );

  return otherActiveAdmins.length === 0;
}

export function refuseTeamMutation(
  role: UserRole,
  collaborators: readonly CollaboratorState[],
  intent: RoleChangeIntent,
): string | null {
  if (!canManageTeam(role)) {
    return TEAM_COPY.noPermission;
  }

  if (isSelfMutation(intent.actorId, intent.targetId)) {
    return TEAM_COPY.selfMutation;
  }

  if (!collaborators.some((item) => item.id === intent.targetId)) {
    return TEAM_COPY.targetNotFound;
  }

  if (wouldRemoveLastAdmin(collaborators, intent)) {
    return TEAM_COPY.lastAdmin;
  }

  return null;
}
