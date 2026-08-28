import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isWhatsAppChannelConfigured,
  maskWhatsAppDestination,
  readWhatsAppChannelConfig,
  sendWhatsApp,
} from "@/lib/whatsapp/send-whatsapp";

const MARIA = "5511999990001";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("canal do WhatsApp da clínica", () => {
  it("fica ausente se faltar endereço, chave ou sessão", () => {
    expect(readWhatsAppChannelConfig({})).toBeNull();
    expect(
      readWhatsAppChannelConfig({
        WHATSAPP_GATEWAY_URL: "http://gateway.local",
        WHATSAPP_GATEWAY_KEY: "secret",
        WHATSAPP_GATEWAY_SESSION: "",
      }),
    ).toBeNull();
    expect(
      readWhatsAppChannelConfig({
        WHATSAPP_GATEWAY_URL: "http://gateway.local",
        WHATSAPP_GATEWAY_KEY: "",
        WHATSAPP_GATEWAY_SESSION: "default",
      }),
    ).toBeNull();
  });

  it("fica presente só com os três valores", () => {
    expect(
      readWhatsAppChannelConfig({
        WHATSAPP_GATEWAY_URL: "http://gateway.local",
        WHATSAPP_GATEWAY_KEY: "secret",
        WHATSAPP_GATEWAY_SESSION: "default",
      }),
    ).toEqual({
      url: "http://gateway.local",
      key: "secret",
      session: "default",
    });
  });

  it("não chama a rede quando o canal está ausente", async () => {
    const fetchFn = vi.fn();
    const result = await sendWhatsApp(
      { destino: MARIA, texto: "cuidados com gelo" },
      { fetchFn, readConfig: () => null },
    );

    expect(result).toEqual({ ok: false, error: "channel_absent" });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("isWhatsAppChannelConfigured reflete o ambiente atual", () => {
    vi.stubEnv("WHATSAPP_GATEWAY_URL", "");
    vi.stubEnv("WHATSAPP_GATEWAY_KEY", "");
    vi.stubEnv("WHATSAPP_GATEWAY_SESSION", "");
    expect(isWhatsAppChannelConfigured()).toBe(false);
  });
});

describe("máscara do destino", () => {
  it("mascara o destino e nunca devolve o número completo", () => {
    const masked = maskWhatsAppDestination(MARIA);
    expect(masked).toBe("5511****0001");
    expect(masked).not.toContain("99999");
    expect(masked).not.toBe(MARIA);
  });

  it("não inclui o corpo nem o número completo no log de falha", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchFn = vi.fn().mockRejectedValue(new Error("offline"));

    await sendWhatsApp(
      { destino: MARIA, texto: "texto clínico confidencial" },
      {
        fetchFn,
        readConfig: () => ({
          url: "http://gateway.local",
          key: "secret",
          session: "default",
        }),
      },
    );

    const logged = spy.mock.calls.map((call) => call.join(" ")).join(" ");
    expect(logged).toContain("5511****0001");
    expect(logged).not.toContain(MARIA);
    expect(logged).not.toContain("texto clínico confidencial");
    expect(logged).not.toContain("secret");
  });
});
