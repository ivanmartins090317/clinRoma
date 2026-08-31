import { canManageTeam, TEAM_COPY } from "@/features/team/domain/team-guards";
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

export async function requireTeamManager(): Promise<AuthSession> {
  const session = await requireAuthSession(TEAM_PATH);

  if (!canManageTeam(session.profile.role)) {
    throw new Error(TEAM_COPY.noPermission);
  }

  if (!hasSupabaseConfig()) {
    throw new Error("Supabase não configurado");
  }

  return session;
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
