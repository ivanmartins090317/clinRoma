import { describe, expect, it, vi } from "vitest";

import {
  fetchWahaQr,
  logoutWahaSession,
  startWahaSession,
} from "@/features/whatsapp/lib/waha-session";

const CONFIG = {
  url: "http://gateway.local",
  key: "chave-gateway",
  session: "default",
};

function jsonResponse(status: number) {
  return new Response(null, { status });
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

  it("inicia a sessão default com a chave do canal", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(201));
    const result = await startWahaSession({
      fetchFn,
      readConfig: () => CONFIG,
    });

    expect(result).toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://gateway.local/api/sessions/default/start");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe(
      "chave-gateway",
    );
  });

  it("trata sessão já iniciada como sucesso (sem segunda sessão)", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(422));
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
