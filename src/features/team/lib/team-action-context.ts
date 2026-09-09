import {
  canAccessTeam,
  canManageAccess,
  TEAM_COPY,
} from "@/features/team/domain/team-guards";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireAuthSession, type AuthSession } from "@/lib/auth/session";
import { hasSupabaseConfig } from "@/lib/env";

export const TEAM_PATH = "/equipe";

export interface TeamActionResult {
  success?: boolean;
  error?: string;
  message?: string;
  /** Só no modo senha temporária: exibida uma única vez, nunca persistida. */
  tempPassword?: string;
}

async function requireTeamSession(): Promise<AuthSession> {
  const session = await requireAuthSession(TEAM_PATH);

  if (!hasSupabaseConfig()) {
    throw new Error("Supabase não configurado");
  }

  return session;
}

/** Quem pode ver Equipe e operar dados (admin + recepção). */
export async function requireTeamAccess(): Promise<AuthSession> {
  const session = await requireTeamSession();

  if (!canAccessTeam(session.profile.role)) {
    throw new Error(TEAM_COPY.noPermission);
  }

  return session;
}

/** Quem pode trocar papel e ativar/desativar (só admin). */
export async function requireTeamAccessManager(): Promise<AuthSession> {
  const session = await requireTeamSession();

  if (!canManageAccess(session.profile.role)) {
    throw new Error(TEAM_COPY.noPermission);
  }

  return session;
}

/** Alias histórico: gestão de acesso (papel / ativo). */
export async function requireTeamManager(): Promise<AuthSession> {
  return requireTeamAccessManager();
}

export async function logTeamAudit(
  action: string,
  collaboratorId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const result = await writeAuditLog({
    action,
    entityType: "profiles",
    entityId: collaboratorId,
    metadata,
  });

  if (!result.ok) {
    console.error("[audit] Falha ao registrar acesso:", result.error);
  }
}

export function toActionError(
  error: unknown,
  fallback: string,
): TeamActionResult {
  return {
    error: error instanceof Error ? error.message : fallback,
  };
}
