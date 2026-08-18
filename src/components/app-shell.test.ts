import { describe, expect, it } from "vitest";

import { getMobileNavModules } from "@/components/app-shell";
import { CLINROMA_MODULES } from "@/types/clinroma";

describe("getMobileNavModules", () => {
  it("retorna 5 módulos sem Scan QR", () => {
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
});
