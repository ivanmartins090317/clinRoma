import { afterEach, describe, expect, it, vi } from "vitest";

import {
  checkWhatsAppNumber,
  indicatesStoppedSession,
} from "@/features/whatsapp/lib/check-whatsapp-number";

const CONFIG = {
  url: "http://gateway.local",
  key: "chave-gateway",
  session: "default",
};

const MARIA = "5511999990001";

function jsonResponse(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("consulta se o número existe", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("não chama a rede quando o canal está ausente", async () => {
    const fetchFn = vi.fn();
    const result = await checkWhatsAppNumber(MARIA, {
      fetchFn,
      readConfig: () => null,
    });

    expect(result).toEqual({ status: "channel_unavailable" });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("confirma existência só com numberExists verdadeiro", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(200, { numberExists: true, chatId: `${MARIA}@c.us` }),
    );

    const result = await checkWhatsAppNumber(MARIA, {
      fetchFn,
      readConfig: () => CONFIG,
    });

    expect(result).toEqual({ status: "exists" });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `http://gateway.local/api/contacts/check-exists?phone=${MARIA}&session=default`,
    );
    expect(url).not.toContain("text");
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe(
      "chave-gateway",
    );
  });

  it("trata numberExists falso como número ausente", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(200, { numberExists: false }),
    );

    const result = await checkWhatsAppNumber(MARIA, {
      fetchFn,
      readConfig: () => CONFIG,
    });

    expect(result).toEqual({ status: "missing" });
  });

  it("resposta ruim sem sinal de sessão parada é falha de canal e mascara o destino", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(500, { error: `falha ${MARIA}` }),
    );

    const result = await checkWhatsAppNumber(MARIA, {
      fetchFn,
      readConfig: () => CONFIG,
    });

    expect(result).toEqual({ status: "channel_unavailable" });
    const logged = error.mock.calls.flat().join(" ");
    expect(logged).toContain("5511****0001");
    expect(logged).not.toContain(MARIA);
  });

  it("erro que indica sessão parada não acusa o número", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(422, {
        message:
          "Session status is not as expected. Try again later or restart the session",
      }),
    );

    const result = await checkWhatsAppNumber(MARIA, {
      fetchFn,
      readConfig: () => CONFIG,
    });

    expect(result).toEqual({ status: "session_down" });
  });

  it("corpo sem confirmação explícita é falha de canal", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));

    const result = await checkWhatsAppNumber(MARIA, {
      fetchFn,
      readConfig: () => CONFIG,
    });

    expect(result).toEqual({ status: "channel_unavailable" });
  });

  it("tempo esgotado é falha de canal", async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      });
    });

    const pending = checkWhatsAppNumber(MARIA, {
      fetchFn,
      readConfig: () => CONFIG,
    });
    await vi.advanceTimersByTimeAsync(15_000);

    await expect(pending).resolves.toEqual({ status: "channel_unavailable" });
  });
});

describe("sinal de sessão parada", () => {
  it("não confunde número ausente com sessão parada", () => {
    expect(indicatesStoppedSession({ numberExists: false })).toBe(false);
    expect(indicatesStoppedSession({ error: "boom" })).toBe(false);
  });
});
