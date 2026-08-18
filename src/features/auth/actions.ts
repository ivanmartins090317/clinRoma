"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { sanitizeReturnTo } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/env";
import { loginSchema } from "@/features/auth/schemas";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

interface AttemptRecord {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, AttemptRecord>();

function getClientKey(email: string, ip: string | null): string {
  return `${email.toLowerCase()}::${ip ?? "unknown"}`;
}

function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now >= record.resetAt) {
    loginAttempts.set(key, { count: 0, resetAt: now + LOGIN_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    return { allowed: false, retryAfterMs: record.resetAt - now };
  }

  return { allowed: true };
}

function registerFailedAttempt(key: string): void {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now >= record.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }

  record.count += 1;
}

function clearAttempts(key: string): void {
  loginAttempts.delete(key);
}

export interface LoginActionState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  if (!hasSupabaseConfig()) {
    return {
      error:
        "Autenticação indisponível. Configure as variáveis do Supabase no ambiente.",
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip");
  const attemptKey = getClientKey(parsed.data.email, ip ?? null);
  const rateLimit = checkRateLimit(attemptKey);

  if (!rateLimit.allowed) {
    const minutes = Math.ceil(
      (rateLimit.retryAfterMs ?? LOGIN_WINDOW_MS) / 60000,
    );
    return {
      error: `Muitas tentativas. Aguarde ${minutes} minuto(s) e tente novamente.`,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    registerFailedAttempt(attemptKey);
    return { error: "Credenciais inválidas" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active, role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return {
      error:
        "Conta sem perfil de colaborador. Peça ao administrador para provisionar seu acesso.",
    };
  }

  if (!profile.active) {
    await supabase.auth.signOut();
    return { error: "Conta desativada. Fale com o administrador da clínica." };
  }

  clearAttempts(attemptKey);

  const returnTo = sanitizeReturnTo(formData.get("returnTo")?.toString());
  redirect(returnTo);
}

export async function logoutAction(): Promise<void> {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
