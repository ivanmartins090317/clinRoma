import { describe, expect, it } from "vitest";

import {
  buildReminderEmailContent,
  formatPatientPartialName,
  truncateSummary,
} from "@/features/reminders/domain/email-content";

describe("email-content", () => {
  it("formata nome parcial do paciente", () => {
    expect(formatPatientPartialName("Maria Souza")).toBe("Maria S.");
    expect(formatPatientPartialName("João")).toBe("João");
  });

  it("trunca resumo longo", () => {
    const longText = "a".repeat(140);
    const result = truncateSummary(longText);

    expect(result).toBeTruthy();
    expect(result!.length).toBeLessThanOrEqual(120);
  });

  it("monta assunto sem CPF", () => {
    const content = buildReminderEmailContent({
      dentistName: "Dr. Felipe Roma",
      patientFullName: "Maria Souza",
      startsAt: "2026-08-18T15:00:00.000Z",
      procedureName: "Restauração",
      notes: null,
      patientUrl: "https://app.example/pacientes/123",
    });

    expect(content.subject).toContain("Maria S.");
    expect(content.subject).not.toContain("Souza");
    expect(content.text).toContain("https://app.example/pacientes/123");
    expect(content.html).not.toContain("<script");
  });
});
