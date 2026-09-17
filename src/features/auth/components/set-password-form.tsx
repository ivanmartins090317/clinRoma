"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ClinicLogo } from "@/components/clinic-logo";
import { PasswordInput } from "@/components/ui/password-input";
import { AUTH_COPY } from "@/features/auth/domain/auth-copy";
import { setPasswordSchema } from "@/features/auth/schemas";
import { createClient } from "@/lib/supabase/client";

export type SetPasswordVariant = "invite" | "reset";

interface SetPasswordFormProps {
  variant: SetPasswordVariant;
}

type RecoveryState = "loading" | "ready" | "invalid";

async function establishRecoverySession(
  supabase: ReturnType<typeof createClient>,
): Promise<"ready" | "invalid" | "missing"> {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  if (search.get("erro") || search.get("error") || hash.get("error")) {
    return "invalid";
  }

  const code = search.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return "ready";
  }

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error) return "ready";
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session ? "ready" : "missing";
}

export function SetPasswordForm({ variant }: SetPasswordFormProps) {
  const router = useRouter();
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    let settled = false;
    let cancelled = false;
    let timeout: number | undefined;

    function markReady() {
      if (settled) return;
      settled = true;
      setRecoveryState("ready");
    }

    function markInvalid() {
      if (settled) return;
      settled = true;
      setRecoveryState("invalid");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        markReady();
      }
    });

    void establishRecoverySession(supabase).then((status) => {
      if (cancelled) return;

      if (status === "ready") {
        markReady();
        return;
      }

      if (status === "invalid") {
        markInvalid();
        return;
      }

      timeout = window.setTimeout(async () => {
        if (cancelled) return;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) markReady();
        else markInvalid();
      }, 800);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = setPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? AUTH_COPY.weak);
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (updateError) {
        setError(AUTH_COPY.saveFailed);
        return;
      }

      await supabase.auth.signOut();
      router.replace("/login?senha=definida");
    });
  }

  const title =
    variant === "invite"
      ? AUTH_COPY.setPasswordTitle
      : AUTH_COPY.resetPasswordTitle;
  const submitLabel =
    variant === "invite" ? AUTH_COPY.submitSet : AUTH_COPY.submitReset;

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-center">
        <ClinicLogo variant="on-dark" priority className="h-12 w-auto" />
      </div>
      <h1 className="mt-6 text-center text-xl font-semibold text-neo-cream-100">
        {title}
      </h1>

      {recoveryState === "loading" ? (
        <p className="mt-4 text-center text-sm text-neo-cream-100/75">
          Validando o link...
        </p>
      ) : null}

      {recoveryState === "invalid" ? (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-neo-burgundy-950 px-3 py-2 text-center text-sm text-red-300"
        >
          {AUTH_COPY.genericLink}
        </p>
      ) : null}

      {recoveryState === "ready" ? (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <p className="text-sm text-neo-cream-100/75">
            {AUTH_COPY.setPasswordHelp}
          </p>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neo-cream-100"
            >
              {AUTH_COPY.passwordLabel}
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              disabled={isPending}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 text-base"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-neo-cream-100"
            >
              {AUTH_COPY.confirmLabel}
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              disabled={isPending}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="min-h-11 text-base"
            />
          </div>
          {error ? (
            <p
              role="alert"
              className="rounded-lg bg-neo-burgundy-950 px-3 py-2 text-sm text-red-300"
            >
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={isPending}
            className="min-h-11 w-full text-base"
          >
            {isPending ? AUTH_COPY.submitting : submitLabel}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
