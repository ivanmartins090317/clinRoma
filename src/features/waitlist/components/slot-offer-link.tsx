"use client";

import { useEffect, useState } from "react";

import { getSlotOfferRemainingMs } from "@/features/waitlist/domain/slot-offer-expiry";
import {
  formatClinicDateTime,
  formatClinicTime,
} from "@/features/agenda/types";

function formatRemaining(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60000);

  if (totalMinutes <= 0) {
    return "Expirado";
  }

  if (totalMinutes === 1) {
    return "1 min restante";
  }

  return `${totalMinutes} min restantes`;
}

interface SlotOfferCountdownProps {
  expiresAt: string;
  offeredAt: string;
  endsAt: string;
  dentistName: string;
}

export function SlotOfferCountdown({
  expiresAt,
  offeredAt,
  endsAt,
  dentistName,
}: SlotOfferCountdownProps) {
  const [remainingMs, setRemainingMs] = useState(() =>
    getSlotOfferRemainingMs(new Date(expiresAt)),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingMs(getSlotOfferRemainingMs(new Date(expiresAt)));
    }, 30000);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
      <p className="font-medium text-foreground">
        {formatRemaining(remainingMs)}
      </p>
      <p className="mt-1 text-muted-foreground">
        {formatClinicDateTime(offeredAt)} · {formatClinicTime(endsAt)}
      </p>
      <p className="text-xs text-muted-foreground">Dentista: {dentistName}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Link disponível ao gerar a oferta. Gere nova oferta se precisar
        reenviar.
      </p>
    </div>
  );
}

interface SlotOfferLinkProps {
  offerUrl: string;
  expiresAt: string;
}

export function SlotOfferLink({ offerUrl, expiresAt }: SlotOfferLinkProps) {
  const [remainingMs, setRemainingMs] = useState(() =>
    getSlotOfferRemainingMs(new Date(expiresAt)),
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingMs(getSlotOfferRemainingMs(new Date(expiresAt)));
    }, 30000);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(offerUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
      <p className="font-medium text-foreground">
        {formatRemaining(remainingMs)}
      </p>
      <p className="break-all text-muted-foreground">{offerUrl}</p>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex min-h-11 items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
      >
        {copied ? "Link copiado" : "Copiar link"}
      </button>
      <p className="text-xs text-muted-foreground">
        Envie este link ao paciente por SMS ou WhatsApp. Válido por 40 minutos.
      </p>
    </div>
  );
}
