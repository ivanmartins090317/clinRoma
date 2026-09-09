import { describe, expect, it } from "vitest";

import {
  canAccessTeam,
  canManageAccess,
  canManageTeam,
} from "@/features/team/domain/team-guards";
import {
  canWriteWhatsAppSession,
  refuseWhatsAppWrite,
} from "@/features/whatsapp/permissions";
import {
  canAccessModule,
  canAccessPath,
  getAllowedModuleIds,
  getDefaultAppPath,
  getModuleAccess,
  isAuthenticatedRoute,
  isPublicRoute,
  resolveModuleForPath,
  resolvePostLoginPath,
  sanitizeReturnTo,
} from "@/lib/auth/roles";
import type { UserRole } from "@/types/clinroma";

const ROLES: UserRole[] = [
  "admin",
  "dentist",
  "reception",
  "room_assistant",
  "viewer",
];

describe("roles matrix", () => {
  it("admin acessa todos os módulos com escrita", () => {
    expect(getAllowedModuleIds("admin")).toHaveLength(8);
    expect(getModuleAccess("admin", "stock-scan")).toBe("write");
    expect(getModuleAccess("admin", "whatsapp")).toBe("write");
    expect(getModuleAccess("admin", "team")).toBe("write");
  });

  it("Equipe: admin e recepção; controle de acesso só admin", () => {
    expect(canAccessTeam("admin")).toBe(true);
    expect(canAccessTeam("reception")).toBe(true);
    expect(canManageTeam("admin")).toBe(true);
    expect(canManageTeam("reception")).toBe(true);
    expect(canManageAccess("admin")).toBe(true);
    expect(canManageAccess("reception")).toBe(false);
    expect(getModuleAccess("reception", "team")).toBe("write");
    expect(canAccessPath("admin", "/equipe")).toBe(true);
    expect(canAccessPath("reception", "/equipe")).toBe(true);

    for (const role of ROLES.filter(
      (item) => item !== "admin" && item !== "reception",
    )) {
      expect(getModuleAccess(role, "team")).toBe("none");
      expect(canAccessTeam(role)).toBe(false);
      expect(canAccessPath(role, "/equipe")).toBe(false);
    }
  });

  it("recepção escreve no WhatsApp; dentista, auxiliar e visualizador não", () => {
    expect(getModuleAccess("reception", "whatsapp")).toBe("write");
    expect(canWriteWhatsAppSession("reception")).toBe(true);
    expect(canWriteWhatsAppSession("admin")).toBe(true);
    expect(canWriteWhatsAppSession("dentist")).toBe(false);
    expect(canWriteWhatsAppSession("room_assistant")).toBe(false);
    expect(canWriteWhatsAppSession("viewer")).toBe(false);
    expect(canAccessPath("reception", "/whatsapp")).toBe(true);
    expect(canAccessPath("admin", "/whatsapp")).toBe(true);
    expect(canAccessPath("dentist", "/whatsapp")).toBe(false);
    expect(canAccessPath("room_assistant", "/whatsapp")).toBe(false);
    expect(canAccessPath("viewer", "/whatsapp")).toBe(false);
    expect(refuseWhatsAppWrite("dentist")).toBe(
      "Sem permissão para gerenciar o WhatsApp da clínica.",
    );
    expect(refuseWhatsAppWrite("room_assistant")).toBe(
      "Sem permissão para gerenciar o WhatsApp da clínica.",
    );
    expect(refuseWhatsAppWrite("viewer")).toBe(
      "Sem permissão para gerenciar o WhatsApp da clínica.",
    );
    expect(refuseWhatsAppWrite("admin")).toBeNull();
    expect(refuseWhatsAppWrite("reception")).toBeNull();
  });

  it("auxiliar de sala só acessa estoque e scan", () => {
    expect(getAllowedModuleIds("room_assistant")).toEqual([
      "stock",
      "stock-scan",
    ]);
    expect(canAccessPath("room_assistant", "/agenda")).toBe(false);
    expect(canAccessPath("room_assistant", "/estoque/scan")).toBe(true);
    expect(canAccessPath("room_assistant", "/hoje")).toBe(false);
    expect(getDefaultAppPath("room_assistant")).toBe("/estoque");
  });

  it("recepção não acessa scan QR", () => {
    expect(canAccessModule("reception", "stock-scan")).toBe(false);
    expect(canAccessModule("reception", "waitlist")).toBe(true);
  });

  it("viewer não acessa fila nem estoque", () => {
    expect(canAccessModule("viewer", "waitlist")).toBe(false);
    expect(canAccessModule("viewer", "stock")).toBe(false);
    expect(canAccessModule("viewer", "patients")).toBe(true);
  });

  it.each(ROLES)("papel %s tem pelo menos um módulo permitido", (role) => {
    expect(getAllowedModuleIds(role).length).toBeGreaterThan(0);
  });
});

describe("route helpers", () => {
  it("resolve módulo correto para paths aninhados", () => {
    expect(resolveModuleForPath("/estoque/scan")).toBe("stock-scan");
    expect(resolveModuleForPath("/estoque")).toBe("stock");
    expect(resolveModuleForPath("/whatsapp")).toBe("whatsapp");
    expect(resolveModuleForPath("/equipe")).toBe("team");
    expect(resolveModuleForPath("/fila/resposta/token")).toBeNull();
  });

  it("identifica rotas públicas e autenticadas", () => {
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/fila/resposta/abc")).toBe(true);
    expect(isAuthenticatedRoute("/fila/resposta/abc")).toBe(false);
    expect(isAuthenticatedRoute("/agenda")).toBe(true);
    expect(isAuthenticatedRoute("/whatsapp")).toBe(true);
    expect(isAuthenticatedRoute("/equipe")).toBe(true);
  });

  it("sanitizeReturnTo bloqueia redirect aberto", () => {
    expect(sanitizeReturnTo("//evil.com")).toBe("/hoje");
    expect(sanitizeReturnTo("/login")).toBe("/hoje");
    expect(sanitizeReturnTo("/agenda?tab=week")).toBe("/agenda?tab=week");
  });

  it("resolvePostLoginPath manda auxiliar para estoque em vez de Hoje", () => {
    expect(resolvePostLoginPath("room_assistant", "/hoje")).toBe("/estoque");
    expect(resolvePostLoginPath("room_assistant", undefined)).toBe("/estoque");
    expect(resolvePostLoginPath("room_assistant", "/estoque/scan")).toBe(
      "/estoque/scan",
    );
    expect(resolvePostLoginPath("admin", "/hoje")).toBe("/hoje");
  });
});
