"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClinicLogo } from "@/components/clinic-logo";
import { loginAction, type LoginActionState } from "@/features/auth/actions";

interface LoginFormProps {
  returnTo?: string;
}

const initialState: LoginActionState = {};

export function LoginForm({ returnTo }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-center">
        <ClinicLogo variant="on-dark" priority className="h-12 w-auto" />
      </div>
      <h1 className="mt-6 text-center text-xl font-semibold text-neo-cream-100">
        Entrar no ClinRoma
      </h1>
      <p className="mt-2 text-center text-sm text-neo-cream-100/75">
        Acesso para colaboradores da clínica
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        {returnTo ? (
          <input type="hidden" name="returnTo" value={returnTo} />
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-neo-cream-100"
          >
            E-mail
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            disabled={isPending}
            className="min-h-11 text-base"
            placeholder="voce@clinroma.dev"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-neo-cream-100"
          >
            Senha
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            className="min-h-11 text-base"
          />
        </div>

        {state.error ? (
          <p
            role="alert"
            className="rounded-lg bg-neo-burgundy-950 px-3 py-2 text-sm text-red-300"
          >
            {state.error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isPending}
          className="min-h-11 w-full text-base"
        >
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
