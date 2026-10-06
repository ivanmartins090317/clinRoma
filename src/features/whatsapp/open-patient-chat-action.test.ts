import { describe, expect, it, vi } from "vitest";

import { PATIENT_WHATSAPP_CHAT_COPY } from "@/features/whatsapp/domain/chat-link";
import { openPatientWhatsAppChatAction } from "@/features/whatsapp/open-patient-chat-action";
import type { AuthSession } from "@/lib/auth/session";
import type { UserRole } from "@/types/clinroma";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

const PATIENT_ID = "c1000001-0000-4000-8000-000000000001";
const MARIA = "5511999990001";

function session(role: UserRole): AuthSession {
  return {
    userId: "user-1",
    email: "pessoa@clinroma.dev",
    profile: {
      id: "user-1",
      displayName: "Pessoa",
      role,
      active: true,
    },
  };
}

function depsFor(role: UserRole) {
  return {
    requireSession: async () => session(role),
    readPatientPhones: async () => ({
      contactPhone: "11999990001",
      secondaryPhone: null,
      secondaryPhoneNote: null,
    }),
    readSessionStatus: async () => "WORKING",
    checkNumber: vi.fn(async () => ({ status: "exists" as const })),
  };
}

describe("abrir conversa do paciente", () => {
  it("recusa visualizador e não consulta o canal", async () => {
    const deps = depsFor("viewer");

    const result = await openPatientWhatsAppChatAction(
      { patientId: PATIENT_ID },
      deps,
    );

    expect(result).toEqual({ error: PATIENT_WHATSAPP_CHAT_COPY.refused });
    expect(deps.checkNumber).not.toHaveBeenCalled();
  });

  it("recusa auxiliar e não consulta o canal", async () => {
    const deps = depsFor("room_assistant");

    const result = await openPatientWhatsAppChatAction(
      { patientId: PATIENT_ID },
      deps,
    );

    expect(result).toEqual({ error: PATIENT_WHATSAPP_CHAT_COPY.refused });
    expect(deps.checkNumber).not.toHaveBeenCalled();
  });

  it("não consulta o canal quando a sessão guardada está fora de operação", async () => {
    const deps = {
      ...depsFor("reception"),
      readSessionStatus: async () => "STOPPED",
    };

    const result = await openPatientWhatsAppChatAction(
      { patientId: PATIENT_ID },
      deps,
    );

    expect(result).toEqual({ error: PATIENT_WHATSAPP_CHAT_COPY.sessionDown });
    expect(deps.checkNumber).not.toHaveBeenCalled();
  });

  it("pede o cadastro quando não há telefone aproveitável", async () => {
    const deps = {
      ...depsFor("dentist"),
      readPatientPhones: async () => ({
        contactPhone: "123",
        secondaryPhone: null,
        secondaryPhoneNote: null,
      }),
    };

    const result = await openPatientWhatsAppChatAction(
      { patientId: PATIENT_ID },
      deps,
    );

    expect(result).toEqual({ error: PATIENT_WHATSAPP_CHAT_COPY.phoneMissing });
    expect(deps.checkNumber).not.toHaveBeenCalled();
  });

  it("devolve só o endereço do chat quando o número do cadastro existe", async () => {
    const deps = depsFor("dentist");

    const result = await openPatientWhatsAppChatAction(
      { patientId: PATIENT_ID },
      deps,
    );

    expect(deps.checkNumber).toHaveBeenCalledWith(MARIA);
    expect(result).toEqual({
      url: `https://wa.me/${MARIA}`,
      notice: null,
    });
  });

  it("avisa quando o destino é o segundo contato", async () => {
    const deps = {
      ...depsFor("admin"),
      readPatientPhones: async () => ({
        contactPhone: null,
        secondaryPhone: "11988887777",
        secondaryPhoneNote: "Mãe",
      }),
    };

    const result = await openPatientWhatsAppChatAction(
      { patientId: PATIENT_ID },
      deps,
    );

    expect(result).toEqual({
      url: "https://wa.me/5511988887777",
      notice: PATIENT_WHATSAPP_CHAT_COPY.openingSecondary,
    });
  });

  it("número ausente não abre o chat", async () => {
    const deps = {
      ...depsFor("reception"),
      checkNumber: vi.fn(async () => ({ status: "missing" as const })),
    };

    const result = await openPatientWhatsAppChatAction(
      { patientId: PATIENT_ID },
      deps,
    );

    expect(result).toEqual({ error: PATIENT_WHATSAPP_CHAT_COPY.numberMissing });
  });

  it("sessão parada na consulta não acusa o número", async () => {
    const deps = {
      ...depsFor("reception"),
      checkNumber: vi.fn(async () => ({ status: "session_down" as const })),
    };

    const result = await openPatientWhatsAppChatAction(
      { patientId: PATIENT_ID },
      deps,
    );

    expect(result).toEqual({ error: PATIENT_WHATSAPP_CHAT_COPY.sessionDown });
  });

  it("falha de canal usa o aviso já existente", async () => {
    const deps = {
      ...depsFor("reception"),
      checkNumber: vi.fn(async () => ({
        status: "channel_unavailable" as const,
      })),
    };

    const result = await openPatientWhatsAppChatAction(
      { patientId: PATIENT_ID },
      deps,
    );

    expect(result).toEqual({
      error: PATIENT_WHATSAPP_CHAT_COPY.channelUnavailable,
    });
  });

  it("paciente que a sessão não lê não consulta o canal", async () => {
    const deps = {
      ...depsFor("reception"),
      readPatientPhones: async () => null,
    };

    const result = await openPatientWhatsAppChatAction(
      { patientId: PATIENT_ID },
      deps,
    );

    expect(result).toEqual({
      error: PATIENT_WHATSAPP_CHAT_COPY.patientUnavailable,
    });
    expect(deps.checkNumber).not.toHaveBeenCalled();
  });
});
