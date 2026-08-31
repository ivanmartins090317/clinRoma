import { redirect } from "next/navigation";

import type { AuthSession } from "@/lib/auth/session";
import {
  canAccessPath,
  resolveModuleForPath,
  sanitizeReturnTo,
} from "@/lib/auth/roles";

export function assertRouteAccess(
  session: AuthSession,
  pathname: string,
): void {
  if (pathname === "/acesso-negado") {
    return;
  }

  if (!canAccessPath(session.profile.role, pathname)) {
    redirect("/acesso-negado");
  }
}

export function getLoginRedirectPath(
  returnTo: string | null | undefined,
): string {
  return sanitizeReturnTo(returnTo);
}

export function getDeniedModuleLabel(pathname: string): string | null {
  const moduleId = resolveModuleForPath(pathname);

  const labels: Record<string, string> = {
    today: "Hoje",
    agenda: "Agenda",
    patients: "Pacientes",
    waitlist: "Fila Kanban",
    stock: "Estoque",
    "stock-scan": "Scan QR",
    whatsapp: "WhatsApp",
    team: "Equipe",
  };

  if (!moduleId) {
    return null;
  }

  return labels[moduleId] ?? null;
}
