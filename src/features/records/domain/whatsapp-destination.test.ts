import { describe, expect, it } from "vitest";

import {
  extractPhoneDigits,
  formatWhatsAppDestinationNotice,
  formatWhatsAppDigits,
  resolveWhatsAppDestination,
  toWhatsAppDestination,
  WHATSAPP_DESTINATION_EXAMPLES,
} from "@/features/records/domain/whatsapp-destination";

describe("número aproveitável no Brasil", () => {
  it("aceita o telefone da Maria do seed (11 dígitos com DDD)", () => {
    expect(
      toWhatsAppDestination(
        extractPhoneDigits(WHATSAPP_DESTINATION_EXAMPLES.mariaSeedPhone),
      ),
    ).toBe("5511999990001");
  });

  it("limpa máscara e completa o 55", () => {
    expect(toWhatsAppDestination(extractPhoneDigits("(11) 99999-0001"))).toBe(
      "5511999990001",
    );
  });

  it("mantém 12 ou 13 dígitos que já começam com 55", () => {
    expect(toWhatsAppDestination("5511999990001")).toBe("5511999990001");
    expect(toWhatsAppDestination("551133334444")).toBe("551133334444");
  });

  it("rejeita vazio, lixo, só DDD e tamanhos fora da regra", () => {
    expect(toWhatsAppDestination(extractPhoneDigits(""))).toBeNull();
    expect(toWhatsAppDestination(extractPhoneDigits("123"))).toBeNull();
    expect(toWhatsAppDestination(extractPhoneDigits("11"))).toBeNull();
    expect(toWhatsAppDestination("1199999000")).toBe("551199999000");
    expect(toWhatsAppDestination("119999900")).toBeNull();
    expect(toWhatsAppDestination("5411999990001")).toBeNull();
    expect(toWhatsAppDestination("55119999900011")).toBeNull();
  });

  it("não inventa DDD em número local de 8 dígitos", () => {
    expect(toWhatsAppDestination("999990001")).toBeNull();
  });
});

describe("ordem do destino", () => {
  it("usa o telefone do paciente quando aproveitável, mesmo com segundo preenchido", () => {
    const destination = resolveWhatsAppDestination({
      contactPhone: "11999990001",
      secondaryPhone: "21988887777",
      secondaryPhoneNote: "filho",
    });

    expect(destination).toEqual({
      digits: "5511999990001",
      contactSource: "patient_phone",
      note: null,
    });
  });

  it("usa o segundo telefone quando o principal é lixo", () => {
    const destination = resolveWhatsAppDestination({
      contactPhone: "123",
      secondaryPhone: "(21) 98888-7777",
      secondaryPhoneNote: "  filho  ",
    });

    expect(destination).toEqual({
      digits: "5521988887777",
      contactSource: "secondary_phone",
      note: "filho",
    });
  });

  it("fica sem destino quando os dois são inaproveitáveis", () => {
    expect(
      resolveWhatsAppDestination({
        contactPhone: "",
        secondaryPhone: "11",
      }),
    ).toBeNull();
  });
});

describe("aviso do destino na tela", () => {
  it("mostra o número do paciente", () => {
    expect(
      formatWhatsAppDestinationNotice({
        digits: "5511999990001",
        contactSource: "patient_phone",
        note: null,
      }),
    ).toBe(`Será enviado para ${formatWhatsAppDigits("5511999990001")}`);
  });

  it("mostra o segundo número e a observação", () => {
    expect(
      formatWhatsAppDestinationNotice({
        digits: "5521988887777",
        contactSource: "secondary_phone",
        note: "filho",
      }),
    ).toBe(
      `Será enviado para ${formatWhatsAppDigits("5521988887777")} (filho)`,
    );
  });
});
