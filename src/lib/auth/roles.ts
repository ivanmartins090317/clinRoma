import type { UserRole } from "@/types/clinroma";

export type ModuleAccess = "read" | "write" | "none";

export interface ModulePermission {
  access: ModuleAccess;
}

const MODULE_IDS = [
  "today",
  "agenda",
  "patients",
  "waitlist",
  "stock",
  "stock-scan",
  "whatsapp",
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

const ROLE_MODULE_MATRIX: Record<UserRole, Record<ModuleId, ModuleAccess>> = {
  admin: {
    today: "write",
    agenda: "write",
    patients: "write",
    waitlist: "write",
    stock: "write",
    "stock-scan": "write",
    whatsapp: "write",
  },
  dentist: {
    today: "read",
    agenda: "read",
    patients: "write",
    waitlist: "read",
    stock: "read",
    "stock-scan": "none",
    whatsapp: "none",
  },
  reception: {
    today: "read",
    agenda: "write",
    patients: "write",
    waitlist: "write",
    stock: "read",
    "stock-scan": "none",
    whatsapp: "write",
  },
  room_assistant: {
    today: "none",
    agenda: "none",
    patients: "none",
    waitlist: "none",
    stock: "read",
    "stock-scan": "write",
    whatsapp: "none",
  },
  viewer: {
    today: "read",
    agenda: "read",
    patients: "read",
    waitlist: "none",
    stock: "none",
    "stock-scan": "none",
    whatsapp: "none",
  },
};

const PATH_MODULE_MAP: Array<{ prefix: string; moduleId: ModuleId }> = [
  { prefix: "/hoje", moduleId: "today" },
  { prefix: "/agenda", moduleId: "agenda" },
  { prefix: "/pacientes", moduleId: "patients" },
  { prefix: "/fila", moduleId: "waitlist" },
  { prefix: "/estoque/scan", moduleId: "stock-scan" },
  { prefix: "/estoque", moduleId: "stock" },
  { prefix: "/whatsapp", moduleId: "whatsapp" },
];

export const AUTHENTICATED_ROUTE_PREFIXES = [
  "/hoje",
  "/agenda",
  "/pacientes",
  "/fila",
  "/estoque",
  "/whatsapp",
  "/acesso-negado",
] as const;

export function getModuleAccess(
  role: UserRole,
  moduleId: ModuleId,
): ModuleAccess {
  return ROLE_MODULE_MATRIX[role][moduleId];
}

export function canAccessModule(role: UserRole, moduleId: ModuleId): boolean {
  return getModuleAccess(role, moduleId) !== "none";
}

export function getAllowedModuleIds(role: UserRole): ModuleId[] {
  return MODULE_IDS.filter((moduleId) => canAccessModule(role, moduleId));
}

export function resolveModuleForPath(pathname: string): ModuleId | null {
  if (pathname === "/acesso-negado" || pathname.startsWith("/fila/resposta")) {
    return null;
  }

  for (const entry of PATH_MODULE_MAP) {
    if (pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)) {
      return entry.moduleId;
    }
  }

  return null;
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  const moduleId = resolveModuleForPath(pathname);

  if (!moduleId) {
    return true;
  }

  return canAccessModule(role, moduleId);
}

export function isAuthenticatedRoute(pathname: string): boolean {
  if (pathname.startsWith("/fila/resposta")) {
    return false;
  }

  return AUTHENTICATED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isPublicRoute(pathname: string): boolean {
  if (pathname === "/login") {
    return true;
  }

  return pathname.startsWith("/fila/resposta");
}

export function sanitizeReturnTo(returnTo: string | null | undefined): string {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/hoje";
  }

  const path = returnTo.split("?")[0] ?? "/hoje";

  if (path === "/login" || path.startsWith("/fila/resposta")) {
    return "/hoje";
  }

  if (!isAuthenticatedRoute(path)) {
    return "/hoje";
  }

  return returnTo;
}
