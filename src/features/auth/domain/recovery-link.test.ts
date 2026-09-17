import { describe, expect, it } from "vitest";

import {
  buildRecoveryConfirmUrl,
  sanitizeSetPasswordPath,
} from "@/features/auth/domain/recovery-link";

describe("sanitizeSetPasswordPath", () => {
  it("aceita as duas telas de senha", () => {
    expect(sanitizeSetPasswordPath("/definir-senha")).toBe("/definir-senha");
    expect(sanitizeSetPasswordPath("/redefinir-senha")).toBe(
      "/redefinir-senha",
    );
  });

  it("recusa redirect aberto e paths estranhos", () => {
    expect(sanitizeSetPasswordPath("https://evil.example")).toBe(
      "/definir-senha",
    );
    expect(sanitizeSetPasswordPath("//evil.example")).toBe("/definir-senha");
    expect(sanitizeSetPasswordPath("/equipe")).toBe("/definir-senha");
    expect(sanitizeSetPasswordPath(null)).toBe("/definir-senha");
  });
});

describe("buildRecoveryConfirmUrl", () => {
  it("monta o confirm com token_hash e next do convite", () => {
    const url = buildRecoveryConfirmUrl({
      baseUrl: "https://neo-roma.vercel.app",
      hashedToken: "abc.123",
      nextPath: "/definir-senha",
    });

    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://neo-roma.vercel.app");
    expect(parsed.pathname).toBe("/auth/confirm");
    expect(parsed.searchParams.get("token_hash")).toBe("abc.123");
    expect(parsed.searchParams.get("type")).toBe("recovery");
    expect(parsed.searchParams.get("next")).toBe("/definir-senha");
  });

  it("aponta esqueci senha para redefinir-senha", () => {
    const url = buildRecoveryConfirmUrl({
      baseUrl: "https://neo-roma.vercel.app/",
      hashedToken: "token",
      nextPath: "/redefinir-senha",
    });

    expect(new URL(url).searchParams.get("next")).toBe("/redefinir-senha");
  });
});
