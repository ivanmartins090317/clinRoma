import { describe, expect, it } from "vitest";

import {
  PATIENT_WHATSAPP_CHAT_COPY,
  buildPatientWhatsAppChatUrl,
  readNumberExists,
} from "@/features/whatsapp/domain/chat-link";

const MARIA = "5511999990001";

describe("endereço do chat", () => {
  it("monta o chat público só com os dígitos, sem texto clínico", () => {
    const url = buildPatientWhatsAppChatUrl(MARIA);

    expect(url).toBe(`https://wa.me/${MARIA}`);
    expect(url).not.toContain("?");
    expect(url).not.toContain("text");
    expect(url).not.toContain("procedimento");
  });

  it("recusa dígitos fora do destino já normalizado", () => {
    expect(buildPatientWhatsAppChatUrl("11999990001")).toBeNull();
    expect(buildPatientWhatsAppChatUrl(`${MARIA}?text=canal`)).toBeNull();
    expect(buildPatientWhatsAppChatUrl("")).toBeNull();
  });

  it("aceita telefone fixo de dez dígitos já com o 55", () => {
    expect(buildPatientWhatsAppChatUrl("551133334444")).toBe(
      "https://wa.me/551133334444",
    );
  });
});

describe("confirmação de que o número existe", () => {
  it("só libera o chat com numberExists exatamente verdadeiro", () => {
    expect(readNumberExists({ numberExists: true })).toBe("exists");
  });

  it("trata falso explícito como número ausente", () => {
    expect(readNumberExists({ numberExists: false })).toBe("missing");
  });

  it("corpo sem confirmação explícita não libera o chat", () => {
    expect(readNumberExists({ numberExists: "true" })).toBe("unexpected");
    expect(readNumberExists({ chatId: `${MARIA}@c.us` })).toBe("unexpected");
    expect(readNumberExists(null)).toBe("unexpected");
    expect(readNumberExists("ok")).toBe("unexpected");
  });
});

describe("textos do clique", () => {
  it("usa as frases fechadas da fatia, sem travessão", () => {
    const phrases = Object.values(PATIENT_WHATSAPP_CHAT_COPY);

    expect(PATIENT_WHATSAPP_CHAT_COPY.button).toBe("Conversar");
    expect(PATIENT_WHATSAPP_CHAT_COPY.sessionDown).toBe(
      "WhatsApp não está logado.",
    );
    expect(PATIENT_WHATSAPP_CHAT_COPY.numberMissing).toBe(
      "Este número não está no WhatsApp.",
    );
    expect(PATIENT_WHATSAPP_CHAT_COPY.phoneMissing).toBe(
      "Cadastre o telefone do paciente ou um segundo contato.",
    );
    expect(PATIENT_WHATSAPP_CHAT_COPY.openingSecondary).toBe(
      "Abrindo conversa com o segundo contato.",
    );
    expect(PATIENT_WHATSAPP_CHAT_COPY.channelUnavailable).toBe(
      "Não foi possível falar com o WhatsApp da clínica. Tente de novo em instantes.",
    );

    for (const phrase of phrases) {
      expect(phrase).not.toContain("—");
    }
  });
});
