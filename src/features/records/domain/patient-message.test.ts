import { describe, expect, it } from "vitest";

import { ANAMNESIS_COPY } from "@/features/records/domain/anamnesis-form-v2";
import {
  PATIENT_MESSAGE_BODY_MAX,
  PATIENT_MESSAGE_COPY,
  PATIENT_MESSAGE_STATUS,
  buildAnamnesisInviteWhatsAppBody,
  canSendPatientWhatsAppRole,
  extractAnamnesisInviteToken,
  extractAnamnesisInviteUrl,
  inviteWhatsAppBodyLooksSafe,
  messageStatusLabel,
  shouldCallWhatsAppGateway,
  validatePostSurgeryBody,
} from "@/features/records/domain/patient-message";
import { canSendPatientWhatsApp } from "@/features/records/permissions";
import { sendPostSurgeryWhatsAppSchema } from "@/features/records/schemas";

describe("corpo da mensagem pós-cirurgia", () => {
  it("recusa vazio ou só espaços", () => {
    expect(validatePostSurgeryBody("")).toBe(PATIENT_MESSAGE_COPY.emptyBody);
    expect(validatePostSurgeryBody("   \n\t")).toBe(
      PATIENT_MESSAGE_COPY.emptyBody,
    );
  });

  it("recusa texto acima de 2.000 caracteres", () => {
    expect(
      validatePostSurgeryBody("a".repeat(PATIENT_MESSAGE_BODY_MAX + 1)),
    ).toBe(PATIENT_MESSAGE_COPY.tooLong);
  });

  it("aceita texto no teto depois de tirar espaços das pontas", () => {
    expect(
      validatePostSurgeryBody(`  ${"a".repeat(PATIENT_MESSAGE_BODY_MAX)}  `),
    ).toBeNull();
  });
});

describe("convite de anamnese por WhatsApp", () => {
  const inviteUrl =
    "https://localhost:3000/anamnese/clinroma-dev-anamnesis-preconsult-001";
  const body = buildAnamnesisInviteWhatsAppBody(inviteUrl);

  it("usa o texto fixo, o link na linha seguinte e não inclui CPF nem nome", () => {
    expect(body.startsWith(PATIENT_MESSAGE_COPY.inviteBodyLead)).toBe(true);
    expect(body).toContain(`\n${inviteUrl}`);
    expect(body).not.toContain("CPF");
    expect(body).not.toContain("Maria");
    expect(inviteWhatsAppBodyLooksSafe(body)).toBe(true);
    expect(body.length).toBeLessThanOrEqual(PATIENT_MESSAGE_BODY_MAX);
  });

  it("não usa travessão na copy nova", () => {
    const copies = [
      ...Object.values(PATIENT_MESSAGE_COPY),
      ANAMNESIS_COPY.helpPreConsult,
      ANAMNESIS_COPY.sendWhatsApp,
    ];

    for (const text of copies) {
      expect(text).not.toContain("—");
    }
  });

  it("extrai o link atual do corpo para reutilizar o convite aberto", () => {
    expect(extractAnamnesisInviteUrl(body)).toBe(inviteUrl);
    expect(extractAnamnesisInviteToken(inviteUrl)).toBe(
      "clinroma-dev-anamnesis-preconsult-001",
    );
  });
});

describe("recusa e canal", () => {
  it("recusa visualizador e auxiliar; aceita quem já escreve prontuário", () => {
    expect(canSendPatientWhatsAppRole("viewer")).toBe(false);
    expect(canSendPatientWhatsAppRole("room_assistant")).toBe(false);
    expect(canSendPatientWhatsApp("viewer")).toBe(false);
    expect(canSendPatientWhatsApp("admin")).toBe(true);
    expect(canSendPatientWhatsApp("dentist")).toBe(true);
    expect(canSendPatientWhatsApp("reception")).toBe(true);
  });

  it("recusa texto vazio e teto também na borda Zod", () => {
    const patientId = "c1000001-0000-4000-8000-000000000001";
    expect(
      sendPostSurgeryWhatsAppSchema.safeParse({ patientId, body: "   " })
        .success,
    ).toBe(false);
    expect(
      sendPostSurgeryWhatsAppSchema.safeParse({
        patientId,
        body: "a".repeat(PATIENT_MESSAGE_BODY_MAX + 1),
      }).success,
    ).toBe(false);
    expect(
      sendPostSurgeryWhatsAppSchema.safeParse({
        patientId,
        body: "Gelo 20 min",
      }).success,
    ).toBe(true);
  });

  it("não chama o gateway quando o canal está ausente", () => {
    expect(shouldCallWhatsAppGateway(false)).toBe(false);
    expect(shouldCallWhatsAppGateway(true)).toBe(true);
  });

  it("rótulos da lista são Enviado ou Falhou", () => {
    expect(messageStatusLabel(PATIENT_MESSAGE_STATUS.sent)).toBe("Enviado");
    expect(messageStatusLabel(PATIENT_MESSAGE_STATUS.failed)).toBe("Falhou");
    expect(messageStatusLabel(PATIENT_MESSAGE_STATUS.pending)).toBe("Falhou");
  });
});
