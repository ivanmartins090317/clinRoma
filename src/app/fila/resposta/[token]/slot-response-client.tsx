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

export function SlotResponseClient({ token, view }: SlotResponseClientProps) {
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
    (remainingMs ?? 0) <= 0;

  function submit(action: "accept" | "decline") {
    setMessage(null);

    startTransition(async () => {
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

      if (payload.response === "accept" || action === "accept") {
        setMessage("Horário confirmado. Aguardamos você na clínica.");
        return;
      }

      setMessage(
        "Obrigado pela resposta. Entraremos em contato se surgir nova vaga.",
      );
    });
  }

  if (view.state === "invalid") {
    return (
      <p className="mt-4 text-center text-sm text-neo-cream-100/80">
        Link inválido ou expirado
      </p>
    );
  }

  if (view.state === "already_responded") {
    return (
      <p className="mt-4 text-center text-sm text-neo-cream-100/80">
        Você já respondeu a esta oferta
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-center text-neo-cream-100">
        Olá, {view.partialPatientName}
      </p>
      <p className="text-center text-sm text-neo-cream-100/80">
        {view.offeredAtLabel} · {view.endsAtLabel}
      </p>
      <p className="text-center text-sm text-neo-cream-100/80">
        Dentista: {view.dentistFirstName}
      </p>

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

      <label className="flex items-start gap-3 text-sm text-neo-cream-100/90">
        <input
          type="checkbox"
          className="mt-1 size-5 accent-neo-gold-500"
          checked={lgpdConsent}
          disabled={view.state !== "valid"}
          onChange={(event) => setLgpdConsent(event.target.checked)}
        />
        <span>
          Autorizo o uso dos meus dados para confirmar este agendamento,
          conforme a política de privacidade da clínica.
        </span>
      </label>

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
        <p className="text-center text-sm text-neo-cream-100">{message}</p>
      ) : null}
    </div>
  );
}
