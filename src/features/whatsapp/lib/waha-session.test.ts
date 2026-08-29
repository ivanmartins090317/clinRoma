import { describe, expect, it, vi } from "vitest";

import {
  buildCreateSessionBody,
  fetchWahaQr,
  fetchWahaSessionStatus,
  logoutWahaSession,
  readWahaSessionWebhook,
  startWahaSession,
} from "@/features/whatsapp/lib/waha-session";

const CONFIG = {
  url: "http://gateway.local",
  key: "chave-gateway",
  session: "default",
};

function jsonResponse(status: number, body?: unknown) {
  if (body === undefined) {
    return new Response(null, { status });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function byUrl(handlers: Record<string, Response | (() => Response)>) {
  return vi.fn().mockImplementation((url: string) => {
    const path = String(url).replace("http://gateway.local", "");
    const handler = handlers[path];
    if (!handler) {
      return Promise.resolve(jsonResponse(599));
    }

    return Promise.resolve(typeof handler === "function" ? handler() : handler);
  });
}

describe("startWahaSession", () => {
  it("não chama a rede quando o canal está ausente", async () => {
    const fetchFn = vi.fn();
    const result = await startWahaSession({
      fetchFn,
      readConfig: () => null,
    });

    expect(result).toEqual({ ok: false, error: "channel_absent" });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("inicia a sessão default quando ela já existe", async () => {
    const fetchFn = byUrl({
      "/api/sessions/default": jsonResponse(200, { status: "STOPPED" }),
      "/api/sessions/default/start": jsonResponse(201),
    });

    const result = await startWahaSession({
      fetchFn,
      readConfig: () => CONFIG,
    });

    expect(result).toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    const startCall = fetchFn.mock.calls[1] as [string, RequestInit];
    expect(startCall[0]).toBe("http://gateway.local/api/sessions/default/start");
    expect(startCall[1].method).toBe("POST");
    expect((startCall[1].headers as Record<string, string>)["X-Api-Key"]).toBe(
      "chave-gateway",
    );
  });

  it("cria a sessão default quando o gateway ainda não tem nenhuma", async () => {
    const fetchFn = byUrl({
      "/api/sessions/default": jsonResponse(404),
      "/api/sessions": jsonResponse(201, { status: "STARTING" }),
    });

    const result = await startWahaSession({
      fetchFn,
      readConfig: () => CONFIG,
      readWebhook: () => null,
    });

    expect(result).toEqual({ ok: true });
    const createCall = fetchFn.mock.calls[1] as [string, RequestInit];
    expect(createCall[0]).toBe("http://gateway.local/api/sessions");
    expect(createCall[1].method).toBe("POST");
    expect(JSON.parse(String(createCall[1].body))).toEqual({
      name: "default",
      start: true,
    });
  });

  it("anexa o aviso de status ao criar a sessão", async () => {
    const fetchFn = byUrl({
      "/api/sessions/default": jsonResponse(404),
      "/api/sessions": jsonResponse(201, { status: "STARTING" }),
    });

    const result = await startWahaSession({
      fetchFn,
      readConfig: () => CONFIG,
      readWebhook: () => ({
        url: "https://app.example/api/webhooks/waha",
        secret: "segredo-aviso",
      }),
    });

    expect(result).toEqual({ ok: true });
    const createCall = fetchFn.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(String(createCall[1].body))).toEqual(
      buildCreateSessionBody("default", {
        url: "https://app.example/api/webhooks/waha",
        secret: "segredo-aviso",
      }),
    );
  });

  it("trata sessão já iniciada como sucesso (sem segunda sessão)", async () => {
    const fetchFn = byUrl({
      "/api/sessions/default": jsonResponse(200, { status: "WORKING" }),
      "/api/sessions/default/start": jsonResponse(422),
    });

    const result = await startWahaSession({
      fetchFn,
      readConfig: () => CONFIG,
    });

    expect(result).toEqual({ ok: true });
  });

  it("falha de forma visível sem vazar a chave", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("offline"));
    const result = await startWahaSession({
      fetchFn,
      readConfig: () => CONFIG,
    });

    expect(result).toEqual({ ok: false, error: "request_failed" });
  });
});

describe("readWahaSessionWebhook", () => {
  it("só monta aviso quando a URL do app é pública", () => {
    expect(
      readWahaSessionWebhook({
        WHATSAPP_WEBHOOK_SECRET: "aviso",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      }),
    ).toBeNull();

    expect(
      readWahaSessionWebhook({
        WHATSAPP_WEBHOOK_SECRET: "aviso",
        NEXT_PUBLIC_APP_URL: "https://neo-roma.vercel.app",
      }),
    ).toEqual({
      url: "https://neo-roma.vercel.app/api/webhooks/waha",
      secret: "aviso",
    });
  });
});

describe("logoutWahaSession", () => {
  it("desconecta a sessão default", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200));
    const result = await logoutWahaSession({
      fetchFn,
      readConfig: () => CONFIG,
    });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://gateway.local/api/sessions/default/logout");
    expect(init.method).toBe("POST");
  });

  it("não chama a rede sem canal", async () => {
    const fetchFn = vi.fn();
    const result = await logoutWahaSession({
      fetchFn,
      readConfig: () => null,
    });

    expect(result).toEqual({ ok: false, error: "channel_absent" });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("fetchWahaSessionStatus", () => {
  it("mapeia SCAN_QR_CODE do gateway", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(200, { name: "default", status: "SCAN_QR_CODE" }),
    );

    const result = await fetchWahaSessionStatus({
      fetchFn,
      readConfig: () => CONFIG,
    });

    expect(result).toEqual({ ok: true, status: "SCAN_QR" });
  });

  it("trata sessão ausente como STOPPED", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(404));
    const result = await fetchWahaSessionStatus({
      fetchFn,
      readConfig: () => CONFIG,
    });

    expect(result).toEqual({ ok: true, status: "STOPPED" });
  });
});

describe("fetchWahaQr", () => {
  it("pede a imagem PNG sem cache no cliente do gateway", async () => {
    const png = new Uint8Array([137, 80, 78, 71]);
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(png, {
        status: 200,
        headers: { "Content-Type": "image/png" },
      }),
    );

    const result = await fetchWahaQr({
      fetchFn,
      readConfig: () => CONFIG,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.from(result.bytes)).toEqual([137, 80, 78, 71]);
    }

    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://gateway.local/api/default/auth/qr");
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Accept).toBe("image/png");
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe(
      "chave-gateway",
    );
  });

  it("não chama a rede sem canal", async () => {
    const fetchFn = vi.fn();
    const result = await fetchWahaQr({
      fetchFn,
      readConfig: () => null,
    });

    expect(result).toEqual({ ok: false, error: "channel_absent" });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
