import { describe, expect, it } from "vitest";

import {
  filterModulesByAccess,
  getMobileNavModules,
  getMobileSecondaryModules,
} from "@/components/app-shell";
import { CLINROMA_MODULES } from "@/types/clinroma";

describe("getMobileNavModules", () => {
  it("retorna 5 módulos sem Scan QR e sem WhatsApp", () => {
    const modules = getMobileNavModules(CLINROMA_MODULES);

    expect(modules).toHaveLength(5);
    expect(modules.map((module) => module.id)).toEqual([
      "today",
      "agenda",
      "patients",
      "waitlist",
      "stock",
    ]);
  });

  it("não inclui o módulo stock-scan", () => {
    const modules = getMobileNavModules(CLINROMA_MODULES);

    expect(modules.some((module) => module.id === "stock-scan")).toBe(false);
  });

  it("não inclui WhatsApp na barra inferior", () => {
    const modules = getMobileNavModules(CLINROMA_MODULES);

    expect(modules.some((module) => module.id === "whatsapp")).toBe(false);
  });

  it("não inclui Equipe na barra inferior", () => {
    const modules = getMobileNavModules(CLINROMA_MODULES);

    expect(modules.some((module) => module.id === "team")).toBe(false);
  });
});

describe("getMobileSecondaryModules", () => {
  it("recolhe o que a dock deixou de fora", () => {
    const modules = getMobileSecondaryModules(CLINROMA_MODULES);

    expect(modules.map((module) => module.id)).toEqual([
      "stock-scan",
      "whatsapp",
      "team",
    ]);
  });

  it("nenhum módulo permitido fica sem caminho no celular", () => {
    const allowed = filterModulesByAccess(CLINROMA_MODULES, [
      "today",
      "stock",
      "stock-scan",
      "team",
    ]);

    const reachable = [
      ...getMobileNavModules(allowed),
      ...getMobileSecondaryModules(allowed),
    ].map((module) => module.id);

    expect(reachable.sort()).toEqual(
      allowed.map((module) => module.id).sort(),
    );
  });

  it("papel sem módulos extras não recebe itens no menu de conta", () => {
    const allowed = filterModulesByAccess(CLINROMA_MODULES, [
      "today",
      "agenda",
      "patients",
    ]);

    expect(getMobileSecondaryModules(allowed)).toHaveLength(0);
  });
});

describe("filterModulesByAccess", () => {
  it("filtra módulos pelo papel da sessão", () => {
    const modules = filterModulesByAccess(CLINROMA_MODULES, [
      "stock",
      "stock-scan",
    ]);

    expect(modules.map((module) => module.id)).toEqual(["stock", "stock-scan"]);
  });

  it("inclui Scan QR quando permitido pelo papel", () => {
    const modules = filterModulesByAccess(CLINROMA_MODULES, [
      "today",
      "agenda",
      "patients",
      "waitlist",
      "stock",
      "stock-scan",
    ]);

    expect(modules.map((module) => module.id)).toContain("stock-scan");
  });

  it("inclui WhatsApp no menu desktop quando o papel tem o módulo", () => {
    const modules = filterModulesByAccess(CLINROMA_MODULES, [
      "today",
      "whatsapp",
    ]);

    expect(modules.map((module) => module.id)).toEqual(["today", "whatsapp"]);
    expect(getMobileNavModules(modules).map((module) => module.id)).toEqual([
      "today",
    ]);
  });
});
