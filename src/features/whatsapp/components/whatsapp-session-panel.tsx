"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { disconnectWhatsAppSessionAction } from "@/features/whatsapp/actions";
import {
  isScanQrStatus,
  isSessionWorking,
  shouldRefreshPairing,
} from "@/features/whatsapp/domain/session-status";
import { WHATSAPP_COPY } from "@/features/whatsapp/permissions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const QR_POLL_MS = 4000;

interface WhatsAppSessionPanelProps {
  status: string | null;
  startError?: string | null;
}

export function WhatsAppSessionPanel({
  status,
  startError = null,
}: WhatsAppSessionPanelProps) {
  const router = useRouter();
  const working = isSessionWorking(status);
  const showQr = isScanQrStatus(status);
  const refreshPairing = shouldRefreshPairing(status);
  const [qrTick, setQrTick] = useState(0);
  const [qrFailed, setQrFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(startError);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!refreshPairing) return;

    const timer = window.setInterval(() => {
      if (showQr) {
        setQrTick((current) => current + 1);
        setQrFailed(false);
      }
      router.refresh();
    }, QR_POLL_MS);

    return () => window.clearInterval(timer);
  }, [refreshPairing, showQr, router]);

  function handleDisconnect() {
    setActionError(null);
    startTransition(async () => {
      const result = await disconnectWhatsAppSessionAction();
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    });
  }

  const message = working
    ? WHATSAPP_COPY.connected
    : WHATSAPP_COPY.disconnected;
  const displayError =
    actionError ?? (qrFailed ? WHATSAPP_COPY.channelUnavailable : null);

  return (
    <section className="space-y-5 rounded-(--radius) border border-[#f0e3db] bg-neo-white p-5 shadow-neo md:p-5.5">
      <p className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <span
          aria-hidden
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            working ? "bg-priority-green" : "animate-pulse bg-priority-red",
          )}
        />
        {message}
      </p>

      {showQr ? (
        <div className="space-y-3">
          <p className="text-[13.5px] text-muted-foreground">
            {WHATSAPP_COPY.qrHelp}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={qrTick}
            src={`/api/whatsapp/qr?t=${qrTick}`}
            alt="Código QR da sessão WhatsApp da clínica"
            width={256}
            height={256}
            className="size-64 max-w-full rounded-[10px] border border-neo-cream-line bg-neo-cream-soft"
            onError={() => setQrFailed(true)}
          />
        </div>
      ) : null}

      {displayError ? (
        <p className="text-sm text-priority-red">{displayError}</p>
      ) : null}

      <Button
        type="button"
        variant="dangerGhost"
        className="min-h-11"
        onClick={() => setConfirmOpen(true)}
      >
        {WHATSAPP_COPY.disconnect}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{WHATSAPP_COPY.disconnect}</DialogTitle>
            <DialogDescription>
              {WHATSAPP_COPY.disconnectConfirm}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              {WHATSAPP_COPY.cancel}
            </Button>
            <Button
              type="button"
              className="min-h-11"
              onClick={handleDisconnect}
              disabled={isPending}
            >
              {WHATSAPP_COPY.disconnectNow}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
