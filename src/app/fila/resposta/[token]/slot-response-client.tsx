"use client";

import { useEffect, useState, useTransition } from "react";

import { getSlotOfferRemainingMs } from "@/features/waitlist/domain/slot-offer-expiry";
import type { PublicSlotOfferView } from "@/features/waitlist/lib/public-offer-view";

interface SlotResponseClientProps {
  token: string;
  view: PublicSlotOfferView;
}

function formatValidUntil(expiresAt: string): string {
  const date = new Date(expiresAt);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function OfferSummary({ view }: { view: PublicSlotOfferView }) {
  return (
    <>
      {view.partialPatientName ? (
        <p className="text-center text-neo-cream-100">
          Olá, {view.partialPatientName}
        </p>
      ) : null}
      {view.offeredAtLabel ? (
        <p className="text-center text-sm text-neo-cream-100/80">
          {view.offeredAtLabel} · {view.endsAtLabel}
        </p>
      ) : null}
      <p className="text-center text-base font-medium text-neo-cream-100">
        Dentista: {view.dentistFirstName ?? "Dentista da clínica"}
      </p>
    </>
  );
}

export function SlotResponseClient({ token, view }: SlotResponseClientProps) {
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"accept" | "decline" | null>(
    view.state === "already_responded" ? (view.response ?? "accept") : null,
  );
  const [remainingMs, setRemainingMs] = useState<number | null>(
    view.expiresAt ? getSlotOfferRemainingMs(new Date(view.expiresAt)) : null,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!view.expiresAt) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingMs(getSlotOfferRemainingMs(new Date(view.expiresAt!)));
    }, 10000);

    return () => window.clearInterval(timer);
  }, [view.expiresAt]);

  const buttonsDisabled =
    view.state !== "valid" ||
    !lgpdConsent ||
    isPending ||
    outcome !== null ||
    (remainingMs ?? 0) <= 0;

  function submit(action: "accept" | "decline") {
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/waitlist/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            action,
            lgpdConsent: true,
          }),
        });

        const payload = (await response.json()) as {
          ok?: boolean;
          error?: string;
          alreadyResponded?: boolean;
          response?: "accept" | "decline";
        };

        if (!response.ok || !payload.ok) {
          setMessage(payload.error ?? "Link inválido ou expirado");
          return;
        }

        const nextOutcome =
          payload.response === "decline" || action === "decline"
            ? "decline"
            : "accept";
        setOutcome(nextOutcome);
      } catch {
        setMessage("Não foi possível enviar a resposta. Tente de novo.");
      }
    });
  }

  if (view.state === "invalid") {
    return (
      <p className="mt-4 text-center text-sm text-neo-cream-100/80">
        Link inválido ou expirado
      </p>
    );
  }

  if (outcome === "accept") {
    return (
      <div className="mt-4 space-y-3">
        <OfferSummary view={view} />
        <p className="text-center text-base font-medium text-neo-gold-500">
          Horário confirmado. Aguardamos você na clínica.
        </p>
      </div>
    );
  }

  if (outcome === "decline") {
    return (
      <p className="mt-4 text-center text-sm text-neo-cream-100/80">
        Obrigado pela resposta. Entraremos em contato se surgir nova vaga.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <OfferSummary view={view} />

      {view.state === "valid" && view.expiresAt ? (
        <p className="text-center text-xs text-neo-gray-500">
          Válido até {formatValidUntil(view.expiresAt)}
        </p>
      ) : null}

      {view.state === "expired" ? (
        <p className="text-center text-sm text-neo-cream-100/80">
          Este link expirou. Entre em contato com a clínica.
        </p>
      ) : null}

      <label className="flex min-h-11 items-start gap-2.5 text-sm text-neo-cream-100/90">
        <input
          type="checkbox"
          className="mt-1"
          checked={lgpdConsent}
          disabled={view.state !== "valid"}
          onChange={(event) => setLgpdConsent(event.target.checked)}
        />
        <span>
          Autorizo o uso dos meus dados para confirmar este agendamento,
          conforme a política de privacidade da clínica.
        </span>
      </label>

      {view.state === "valid" && !lgpdConsent ? (
        <p className="text-center text-xs text-neo-gray-500">
          Marque o consentimento para aceitar ou recusar.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={buttonsDisabled}
          onClick={() => submit("accept")}
          className="min-h-11 flex-1 rounded-lg bg-neo-gold-500 px-4 py-2.5 text-base font-medium text-neo-burgundy-950 disabled:opacity-50"
        >
          {isPending ? "Enviando..." : "Aceitar horário"}
        </button>
        <button
          type="button"
          disabled={buttonsDisabled}
          onClick={() => submit("decline")}
          className="min-h-11 flex-1 rounded-lg border border-neo-cream-100/30 px-4 py-2.5 text-base font-medium text-neo-cream-100 disabled:opacity-50"
        >
          Recusar
        </button>
      </div>

      {message ? (
        <p className="text-center text-sm text-neo-gold-500">{message}</p>
      ) : null}
    </div>
  );
}
