import { describe, expect, it } from "vitest";

import {
  canWriteWhatsAppSession,
  refuseWhatsAppWrite,
} from "@/features/whatsapp/permissions";
import {
  canAccessModule,
  canAccessPath,
  getAllowedModuleIds,
  getModuleAccess,
  isAuthenticatedRoute,
  isPublicRoute,
  resolveModuleForPath,
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
    expect(getAllowedModuleIds("admin")).toHaveLength(7);
    expect(getModuleAccess("admin", "stock-scan")).toBe("write");
    expect(getModuleAccess("admin", "whatsapp")).toBe("write");
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
    expect(resolveModuleForPath("/fila/resposta/token")).toBeNull();
  });

  it("identifica rotas públicas e autenticadas", () => {
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/fila/resposta/abc")).toBe(true);
    expect(isAuthenticatedRoute("/fila/resposta/abc")).toBe(false);
    expect(isAuthenticatedRoute("/agenda")).toBe(true);
    expect(isAuthenticatedRoute("/whatsapp")).toBe(true);
  });

  it("sanitizeReturnTo bloqueia redirect aberto", () => {
    expect(sanitizeReturnTo("//evil.com")).toBe("/hoje");
    expect(sanitizeReturnTo("/login")).toBe("/hoje");
    expect(sanitizeReturnTo("/agenda?tab=week")).toBe("/agenda?tab=week");
  });
});
