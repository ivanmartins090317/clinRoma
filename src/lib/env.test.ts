import { afterEach, describe, expect, it, vi } from "vitest";

import { env, hasSupabaseConfig } from "./env";

describe("hasSupabaseConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retorna false quando URL ou chave anônima estão ausentes", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(hasSupabaseConfig()).toBe(false);
  });

  it("retorna false quando só a URL está definida", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(hasSupabaseConfig()).toBe(false);
  });

  it("retorna true quando URL e chave anônima estão definidas", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    expect(hasSupabaseConfig()).toBe(true);
  });
});

describe("env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("normaliza NEXT_PUBLIC_APP_URL vazia ou sem protocolo", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.resetModules();
    const { env: emptyEnv } = await import("./env");
    expect(emptyEnv.NEXT_PUBLIC_APP_URL).toBe("https://localhost:3000");

    vi.stubEnv("NEXT_PUBLIC_APP_URL", "clinroma.vercel.app");
    vi.resetModules();
    const { env: hostEnv } = await import("./env");
    expect(hostEnv.NEXT_PUBLIC_APP_URL).toBe("https://clinroma.vercel.app");
  });
});
