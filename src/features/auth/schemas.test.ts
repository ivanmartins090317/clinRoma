import { describe, expect, it } from "vitest";

import { loginSchema } from "@/features/auth/schemas";

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
