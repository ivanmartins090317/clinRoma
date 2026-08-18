#!/usr/bin/env node
/**
 * Gera src/lib/supabase/database.types.ts via Supabase CLI e conexão Postgres.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../../..");
const outputPath = path.join(projectRoot, "src/lib/supabase/database.types.ts");

function resolveEnvPath() {
  for (const name of [".env.local", ".env"]) {
    const candidate = path.join(projectRoot, name);
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Defina SUPABASE_DB_PASSWORD em .env.local para gerar types.",
  );
}

function parseEnvFile(filePath) {
  const env = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function getProjectRef(supabaseUrl) {
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) throw new Error(`URL Supabase inválida: ${supabaseUrl}`);
  return match[1];
}

const envPath = resolveEnvPath();
const env = parseEnvFile(envPath);
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const password = env.SUPABASE_DB_PASSWORD ?? "";

if (!supabaseUrl || !password) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_DB_PASSWORD são obrigatórios para db:types.",
  );
}

const projectRef = getProjectRef(supabaseUrl);
const dbUrl = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;

const generated = execSync(
  `npx supabase gen types typescript --db-url ${JSON.stringify(dbUrl)} --schema public`,
  { cwd: projectRoot, encoding: "utf8" },
);

writeFileSync(outputPath, generated, "utf8");
console.log(`Types gerados em ${path.relative(projectRoot, outputPath)}`);
