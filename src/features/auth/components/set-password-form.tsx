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

    async function consumeCode() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) return;

      await supabase.auth.exchangeCodeForSession(code);
    }

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

    void consumeCode().then(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) markReady();
    });

    const timeout = window.setTimeout(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) markReady();
      else markInvalid();
    }, 2500);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
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
