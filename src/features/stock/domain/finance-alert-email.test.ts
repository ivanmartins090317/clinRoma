import { describe, expect, it } from "vitest";

import {
  buildFinanceAlertEmailContent,
  getFinanceAlertConfigError,
  getFinanceAlertProviderError,
} from "@/features/stock/domain/finance-alert-email";

const PHI_MARKERS = [
  "Maria",
  "paciente",
  "CPF",
  "prontuário",
  "prontuario",
  "QR",
  "auxiliar",
];

describe("finance-alert-email", () => {
  const content = buildFinanceAlertEmailContent({
    supplyName: "Anestésico",
    currentQuantity: 2,
    minimumQuantity: 5,
    unit: "bottle",
    alertedAt: new Date("2026-08-26T15:00:00.000Z"),
    stockUrl: "https://app.clinroma.example/estoque",
  });

  it("monta assunto, saldo, mínimo, unidade e ligação ao estoque", () => {
    expect(content.subject).toBe("ClinRoma · Estoque baixo · Anestésico");
    expect(content.text).toContain("Olá, financeiro.");
    expect(content.text).toContain("O insumo abaixo precisa de reposição.");
    expect(content.text).toContain("Anestésico: 2 de 5 (frasco).");
    expect(content.text).toContain(
      "Abrir estoque: https://app.clinroma.example/estoque",
    );
    expect(content.html).toContain("Abrir estoque");
    expect(content.html).toContain("https://app.clinroma.example/estoque");
    expect(content.text).toContain(
      "Clínica Neo Roma. Mensagem automática, não responda.",
    );
  });

  it("usa o fuso America/Sao_Paulo no horário do aviso", () => {
    expect(content.text).toContain("26/08/2026 12:00");
  });

  it("não inclui dado de paciente nem travessão", () => {
    const blob = `${content.subject}\n${content.text}\n${content.html}`;

    for (const marker of PHI_MARKERS) {
      expect(blob.toLowerCase()).not.toContain(marker.toLowerCase());
    }

    expect(blob).not.toContain("—");
    expect(content.html).not.toContain("<script");
  });

  it("não aponta para localhost hardcoded", () => {
    expect(content.text).not.toContain("localhost");
    expect(content.html).not.toContain("localhost");
  });

  it("expõe copy genérica de erro sem detalhe do provedor", () => {
    expect(getFinanceAlertProviderError()).toBe(
      "Não foi possível enviar o e-mail.",
    );
    expect(getFinanceAlertConfigError()).toBe(
      "Serviço de e-mail não configurado.",
    );
  });
});
