import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";

import {
  readWhatsAppWebhookSecret,
  verifyWebhookHmac,
} from "@/features/whatsapp/domain/webhook-hmac";

const BODY = JSON.stringify({
  event: "session.status",
  session: "default",
  payload: { status: "WORKING" },
});

function sign(body: string, secret: string) {
  return createHmac("sha512", secret).update(body).digest("hex");
}

describe("verifyWebhookHmac", () => {
  it("aceita sha512 do corpo com o segredo do aviso", () => {
    const secret = "aviso-whatsapp-teste";
    expect(verifyWebhookHmac(BODY, sign(BODY, secret), secret)).toBe(true);
  });

  it("recusa assinatura inválida ou ausente", () => {
    const secret = "aviso-whatsapp-teste";
    expect(verifyWebhookHmac(BODY, sign(BODY, "outro"), secret)).toBe(false);
    expect(verifyWebhookHmac(BODY, null, secret)).toBe(false);
    expect(verifyWebhookHmac(BODY, "", secret)).toBe(false);
    expect(verifyWebhookHmac(BODY, sign(BODY, secret), "")).toBe(false);
  });

  it("recusa corpo adulterado", () => {
    const secret = "aviso-whatsapp-teste";
    const tampered = BODY.replace("WORKING", "STOPPED");
    expect(verifyWebhookHmac(tampered, sign(BODY, secret), secret)).toBe(false);
  });
});

describe("readWhatsAppWebhookSecret", () => {
  it("lê o segredo do aviso e recusa se estiver vazio", () => {
    expect(
      readWhatsAppWebhookSecret({ WHATSAPP_WEBHOOK_SECRET: "" }),
    ).toBeNull();
    expect(
      readWhatsAppWebhookSecret({ WHATSAPP_WEBHOOK_SECRET: "  aviso  " }),
    ).toBe("aviso");
  });

  it("recusa se o segredo for igual ao do relógio dos jobs", () => {
    expect(
      readWhatsAppWebhookSecret({
        WHATSAPP_WEBHOOK_SECRET: "mesmo-segredo",
        CRON_SECRET: "mesmo-segredo",
      }),
    ).toBeNull();
  });

  it("aceita segredo próprio diferente do relógio", () => {
    expect(
      readWhatsAppWebhookSecret({
        WHATSAPP_WEBHOOK_SECRET: "aviso-whatsapp",
        CRON_SECRET: "relogio-jobs",
      }),
    ).toBe("aviso-whatsapp");
  });
});
