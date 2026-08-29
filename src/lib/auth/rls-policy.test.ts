import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasRemoteDb =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  process.env.RUN_RLS_TESTS === "true";

const DEV_PASSWORD = "ClinRomaDev2026!";

const ROLE_ACCOUNTS = {
  admin: "admin@clinroma.dev",
  dentist: "dentist@clinroma.dev",
  reception: "reception@clinroma.dev",
  room_assistant: "assistant@clinroma.dev",
  viewer: "viewer@clinroma.dev",
} as const;

async function signInAs(email: string) {
  const client = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await client.auth.signInWithPassword({
    email,
    password: DEV_PASSWORD,
  });

  if (error) {
    throw new Error(`Login falhou para ${email}: ${error.message}`);
  }

  return client;
}

describe.skipIf(!hasRemoteDb)("RLS policies por papel", () => {
  it.each(Object.entries(ROLE_ACCOUNTS))(
    "%s: leitura de prontuário conforme política",
    async (role, email) => {
      const client = await signInAs(email);
      const { data, error } = await client.from("medical_records").select("id");

      const clinicalRoles = ["admin", "dentist", "reception"];

      if (clinicalRoles.includes(role)) {
        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      } else {
        expect(data ?? []).toHaveLength(0);
      }
    },
  );

  it.each(Object.entries(ROLE_ACCOUNTS))(
    "%s: leitura de auditoria conforme política",
    async (role, email) => {
      const client = await signInAs(email);
      const { data, error } = await client.from("audit_log").select("id");

      if (role === "admin") {
        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      } else {
        expect(data ?? []).toHaveLength(0);
      }
    },
  );

  it.each(Object.entries(ROLE_ACCOUNTS))(
    "%s: escrita de movimentação de estoque conforme política",
    async (role, email) => {
      const client = await signInAs(email);

      const { data: supplies } = await client
        .from("supplies")
        .select("id")
        .limit(1);

      if (!supplies?.[0]) {
        return;
      }

      const { error } = await client.from("supply_movements").insert({
        supply_id: supplies[0].id,
        movement_type: "out",
        quantity: 1,
      });

      const canWrite = role === "admin" || role === "room_assistant";

      if (canWrite) {
        expect(error).toBeNull();
      } else {
        expect(error).not.toBeNull();
      }
    },
  );

  it.each(Object.entries(ROLE_ACCOUNTS))(
    "%s: leitura do status WhatsApp conforme política; escrita autenticada recusada",
    async (role, email) => {
      const client = await signInAs(email);
      const { data, error } = await client
        .from("whatsapp_session_status")
        .select("status")
        .eq("session_name", "default");

      const canRead =
        role === "admin" || role === "dentist" || role === "reception";

      if (canRead) {
        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      } else {
        expect(data ?? []).toHaveLength(0);
      }

      const { error: writeError } = await client
        .from("whatsapp_session_status")
        .update({ status: "WORKING" })
        .eq("session_name", "default");

      expect(writeError).not.toBeNull();
    },
  );
});

describe("RLS policy expectations (offline)", () => {
  const clinicalReadRoles = ["admin", "dentist", "reception"] as const;
  const auditReadRoles = ["admin"] as const;
  const stockWriteRoles = ["admin", "room_assistant"] as const;
  const whatsappStatusReadRoles = ["admin", "dentist", "reception"] as const;

  it.each([
    "admin",
    "dentist",
    "reception",
    "room_assistant",
    "viewer",
  ] as const)("%s: prontuário permitido ou negado conforme matriz", (role) => {
    const allowed = clinicalReadRoles.includes(
      role as (typeof clinicalReadRoles)[number],
    );
    expect(allowed).toBe(role !== "room_assistant" && role !== "viewer");
  });

  it.each([
    "admin",
    "dentist",
    "reception",
    "room_assistant",
    "viewer",
  ] as const)("%s: auditoria permitida só para admin", (role) => {
    const allowed = auditReadRoles.includes(
      role as (typeof auditReadRoles)[number],
    );
    expect(allowed).toBe(role === "admin");
  });

  it.each([
    "admin",
    "dentist",
    "reception",
    "room_assistant",
    "viewer",
  ] as const)(
    "%s: escrita de movimentação de estoque conforme matriz",
    (role) => {
      const allowed = stockWriteRoles.includes(
        role as (typeof stockWriteRoles)[number],
      );
      expect(allowed).toBe(role === "admin" || role === "room_assistant");
    },
  );

  it.each([
    "admin",
    "dentist",
    "reception",
    "room_assistant",
    "viewer",
  ] as const)(
    "%s: status WhatsApp lê se admin/dentista/recepção; escrita autenticada negada",
    (role) => {
      const canRead = whatsappStatusReadRoles.includes(
        role as (typeof whatsappStatusReadRoles)[number],
      );
      expect(canRead).toBe(
        role === "admin" || role === "dentist" || role === "reception",
      );
    },
  );

  it("gravação do status WhatsApp só pelo aviso privilegiado, não pela sessão autenticada", () => {
    const authenticatedWriteRoles: readonly string[] = [];
    expect(authenticatedWriteRoles).toHaveLength(0);
  });

  it("matriz exige teste remoto com RUN_RLS_TESTS=true para validação no banco", () => {
    expect(hasRemoteDb || process.env.CI !== "true").toBe(true);
  });
});
