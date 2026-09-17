import { describe, expect, it } from "vitest";

import { AUTH_COPY } from "@/features/auth/domain/auth-copy";
import {
  forgotPasswordSchema,
  loginSchema,
  setPasswordSchema,
} from "@/features/auth/schemas";

describe("loginSchema", () => {
  it("aceita e-mail e senha válidos", () => {
    const result = loginSchema.safeParse({
      email: "reception@clinroma.dev",
      password: "ClinRomaDev2026!",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    const result = loginSchema.safeParse({
      email: "invalido",
      password: "secret",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita senha vazia", () => {
    const result = loginSchema.safeParse({
      email: "admin@clinroma.dev",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("aceita e-mail válido", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "ana@clinroma.dev" }).success,
    ).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    expect(forgotPasswordSchema.safeParse({ email: "invalido" }).success).toBe(
      false,
    );
  });
});

describe("setPasswordSchema", () => {
  it("aceita senha forte e confirmação igual", () => {
    const result = setPasswordSchema.safeParse({
      password: "ClinRomaDev2026!",
      confirmPassword: "ClinRomaDev2026!",
    });

    expect(result.success).toBe(true);
  });

  it("recusa senha fraca", () => {
    const result = setPasswordSchema.safeParse({
      password: "fraca",
      confirmPassword: "fraca",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(AUTH_COPY.weak);
  });

  it("recusa confirmação diferente", () => {
    const result = setPasswordSchema.safeParse({
      password: "ClinRomaDev2026!",
      confirmPassword: "ClinRomaDev2026?",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(AUTH_COPY.mismatch);
  });
});
