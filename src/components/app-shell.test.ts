import { describe, expect, it } from "vitest";

import {
  filterModulesByAccess,
  getMobileNavModules,
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
