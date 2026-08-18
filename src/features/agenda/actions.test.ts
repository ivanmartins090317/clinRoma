import { describe, expect, it } from "vitest";

import { getModuleAccess } from "@/lib/auth/roles";
import type { UserRole } from "@/types/clinroma";

function canWriteAgenda(role: UserRole): boolean {
  return getModuleAccess(role, "agenda") === "write";
}

describe("canWriteAgenda", () => {
  it("permite escrita para admin e recepção", () => {
    expect(canWriteAgenda("admin")).toBe(true);
    expect(canWriteAgenda("reception")).toBe(true);
  });

  it("bloqueia escrita para dentista, viewer e auxiliar", () => {
    expect(canWriteAgenda("dentist")).toBe(false);
    expect(canWriteAgenda("viewer")).toBe(false);
    expect(canWriteAgenda("room_assistant")).toBe(false);
  });
});
