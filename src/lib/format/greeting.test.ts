import { describe, expect, it } from "vitest";

import { formatHeroDate, getTimeGreeting } from "@/lib/format/greeting";

describe("getTimeGreeting", () => {
  it("usa o fuso America/Sao_Paulo, não o UTC do servidor", () => {
    expect(getTimeGreeting(new Date("2026-09-29T13:29:00.000Z"))).toBe(
      "Bom dia",
    );
  });

  it("trata manhã, tarde e noite nos limites do horário da clínica", () => {
    expect(getTimeGreeting(new Date("2026-09-29T14:59:00.000Z"))).toBe(
      "Bom dia",
    );
    expect(getTimeGreeting(new Date("2026-09-29T15:00:00.000Z"))).toBe(
      "Boa tarde",
    );
    expect(getTimeGreeting(new Date("2026-09-29T20:59:00.000Z"))).toBe(
      "Boa tarde",
    );
    expect(getTimeGreeting(new Date("2026-09-29T21:00:00.000Z"))).toBe(
      "Boa noite",
    );
  });
});

describe("formatHeroDate", () => {
  it("formata a data civil da clínica, inclusive perto da meia-noite UTC", () => {
    expect(formatHeroDate(new Date("2026-09-30T02:30:00.000Z"))).toBe(
      "Terça-feira, 29 de setembro de 2026",
    );
  });
});
