import { describe, expect, it } from "vitest";

import { getDeniedModuleLabel, getLoginRedirectPath } from "@/lib/auth/guard";

describe("guard helpers", () => {
  it("retorna label amigável do módulo negado", () => {
    expect(getDeniedModuleLabel("/agenda")).toBe("Agenda");
    expect(getDeniedModuleLabel("/estoque/scan")).toBe("Scan QR");
  });

  it("normaliza redirect pós-login", () => {
    expect(getLoginRedirectPath(undefined)).toBe("/hoje");
    expect(getLoginRedirectPath("/pacientes")).toBe("/pacientes");
    expect(getLoginRedirectPath("https://evil.com")).toBe("/hoje");
  });
});
