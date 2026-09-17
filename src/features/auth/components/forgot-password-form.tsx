"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { ClinicLogo } from "@/components/clinic-logo";
import { Input } from "@/components/ui/input";
import {
  requestPasswordResetAction,
  type ForgotPasswordActionState,
} from "@/features/auth/actions";
import { AUTH_COPY } from "@/features/auth/domain/auth-copy";

const initialState: ForgotPasswordActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-center">
        <ClinicLogo variant="on-dark" priority className="h-12 w-auto" />
      </div>
      <h1 className="mt-6 text-center text-xl font-semibold text-neo-cream-100">
        {AUTH_COPY.forgotTitle}
      </h1>
      <p className="mt-2 text-center text-sm text-neo-cream-100/75">
        {AUTH_COPY.forgotHelp}
      </p>

      <form action={formAction} className="mt-8 space-y-4">
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

        {state.message ? (
          <p className="rounded-lg bg-neo-burgundy-900 px-3 py-2 text-sm text-neo-cream-100">
            {state.message}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isPending}
          className="min-h-11 w-full text-base"
        >
          {isPending ? AUTH_COPY.forgotSending : AUTH_COPY.forgotSubmit}
        </Button>
      </form>

      <p className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center text-sm text-neo-cream-100/80 underline-offset-4 hover:text-neo-cream-100 hover:underline"
        >
          {AUTH_COPY.backToLogin}
        </Link>
      </p>
    </div>
  );
}