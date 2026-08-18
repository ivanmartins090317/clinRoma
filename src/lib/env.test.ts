import { afterEach, describe, expect, it, vi } from "vitest";

import { hasSupabaseConfig } from "./env";

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
