import { afterEach, describe, expect, it } from "vitest";

import {
  ANAMNESIS_COPY,
  type AnamnesisInvitePurpose,
} from "@/features/records/domain/anamnesis-form-v2";
import {
  GENERIC_INVITE_MESSAGE,
  buildAnamnesisInviteUrl,
  checkInviteRateLimit,
  computeInviteExpiresAt,
  inviteViewGuessKey,
  isInviteRateLimited,
  evaluateInviteAccess,
  generateAnamnesisInviteToken,
  hashAnamnesisInviteToken,
  hashInviteOrigin,
  resolveAnamnesisInviteBaseUrl,
  inviteAccessMessage,
  isInviteExpired,
  isPlainInviteTokenStored,
  resetInviteRateLimitForTests,
  shouldReplaceOpenInvite,
} from "@/features/records/lib/anamnesis-token";

afterEach(() => {
  resetInviteRateLimitForTests();
});

describe("anamnesis-token", () => {
  it("gera token opaco e persiste só a impressão digital", () => {
    const token = generateAnamnesisInviteToken();

    expect(token.length).toBeGreaterThan(20);
    expect(generateAnamnesisInviteToken()).not.toBe(token);

    const hash = hashAnamnesisInviteToken(
      "clinroma-dev-anamnesis-preconsult-001",
    );
    expect(hash).toBe(
      "0712e382a2cd48ff8e71f09dd10cda5fd2bb50fccdc90709468e2da28bc5da3a",
    );
    expect(
      isPlainInviteTokenStored(hash, "clinroma-dev-anamnesis-preconsult-001"),
    ).toBe(false);
  });

  it("pré-consulta vale 7 dias e consultório vale até a meia-noite de São Paulo", () => {
    const generated = new Date("2026-08-26T18:00:00-03:00");
    const preConsult = computeInviteExpiresAt("pre_consult", generated);
    const office = computeInviteExpiresAt("office", generated);

    expect(preConsult.toISOString()).toBe("2026-09-02T21:00:00.000Z");
    expect(office.toISOString()).toBe("2026-08-27T03:00:00.000Z");

    expect(isInviteExpired(office, new Date("2026-08-26T23:50:00-03:00"))).toBe(
      false,
    );
    expect(isInviteExpired(office, new Date("2026-08-27T00:00:00-03:00"))).toBe(
      true,
    );
  });

  it.each([
    ["expirado", { status: "open", expiresAt: "2026-08-01T00:00:00.000Z" }],
    ["usado", { status: "used", expiresAt: "2026-09-01T00:00:00.000Z" }],
    ["revogado", { status: "revoked", expiresAt: "2026-09-01T00:00:00.000Z" }],
    ["ausente", { status: "open", storedHash: null }],
  ] as const)(
    "mensagem genérica não distingue o motivo (%s)",
    (_label, extra) => {
      const token = "clinroma-dev-anamnesis-preconsult-001";
      const state = evaluateInviteAccess({
        token,
        tokenHash: hashAnamnesisInviteToken(token),
        storedHash: hashAnamnesisInviteToken(token),
        now: new Date("2026-08-26T12:00:00-03:00"),
        ...extra,
      });

      expect(state).toBe("invalid");
      expect(inviteAccessMessage(state)).toBe(GENERIC_INVITE_MESSAGE);
      expect(inviteAccessMessage("valid")).toBe(ANAMNESIS_COPY.genericInvite);
    },
  );

  it("uso único: convite aberto e na validade é aceito", () => {
    const token = generateAnamnesisInviteToken();
    const hash = hashAnamnesisInviteToken(token);
    const purpose: AnamnesisInvitePurpose = "office";

    expect(
      evaluateInviteAccess({
        token,
        tokenHash: hash,
        storedHash: hash,
        status: "open",
        expiresAt: computeInviteExpiresAt(purpose, new Date()),
      }),
    ).toBe("valid");
  });

  it("um convite aberto por finalidade: gerar de novo substitui", () => {
    expect(shouldReplaceOpenInvite(true)).toBe(true);
    expect(shouldReplaceOpenInvite(false)).toBe(false);
  });

  it("monta URL opaca sem identificador do paciente", () => {
    const url = buildAnamnesisInviteUrl(
      "abcTokenSemNome",
      "https://clinroma.dev",
    );
    expect(url).toBe("https://clinroma.dev/anamnese/abcTokenSemNome");
    expect(url).not.toMatch(/maria|cpf|c1000001/i);
  });

  it("usa a origem da requisição para o link copiável", () => {
    expect(
      resolveAnamnesisInviteBaseUrl({
        origin: "http://localhost:3000",
        fallback: "https://neo-roma.vercel.app",
      }),
    ).toBe("http://localhost:3000");
    expect(
      resolveAnamnesisInviteBaseUrl({
        host: "localhost:3000",
        proto: "http",
        fallback: "https://neo-roma.vercel.app",
      }),
    ).toBe("http://localhost:3000");
  });

  it("impressão digital de origem não guarda o valor em claro", () => {
    const hash = hashInviteOrigin("203.0.113.10", "dev-secret");
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain("203.0.113.10");
    expect(hashInviteOrigin("203.0.113.10", "")).toBeNull();
  });

  it("limita tentativas repetidas na mesma origem", () => {
    for (let index = 0; index < 10; index += 1) {
      expect(checkInviteRateLimit("origin-a")).toBe(true);
    }

    expect(isInviteRateLimited("origin-a")).toBe(true);
    expect(checkInviteRateLimit("origin-a")).toBe(false);
    expect(checkInviteRateLimit("origin-b")).toBe(true);
    expect(isInviteRateLimited("origin-b")).toBe(false);
  });

  it("orçamento de chute da página pública fica em chave própria", () => {
    expect(inviteViewGuessKey("anon")).toBe("guess:view:anon");
    expect(isInviteRateLimited(inviteViewGuessKey("anon"))).toBe(false);
  });
});
