"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  lookupPackageAction,
  withdrawPackageAction,
} from "@/features/stock/actions";
import { shouldIgnoreDuplicateScan } from "@/features/stock/domain/withdrawal";
import { normalizeScannedQrCode } from "@/features/stock/domain/qr-code";
import { StockQrScanner } from "@/features/stock/components/stock-qr-scanner";
import type { PackageLookupResult } from "@/features/stock/queries";
import { toast } from "@/components/ui/sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPPLY_UNIT_LABELS } from "@/features/stock/lib/clinic-date";

function playSuccessFeedback() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.05;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
  } catch {
    // optional feedback
  }

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(80);
  }
}

function defaultWithdrawQuantity(remaining: number): string {
  if (!Number.isFinite(remaining) || remaining <= 0) return "";
  return String(remaining);
}

export function StockScanFlow() {
  const [continuousMode, setContinuousMode] = useState(true);
  const [pendingPackage, setPendingPackage] =
    useState<PackageLookupResult | null>(null);
  const [quantity, setQuantity] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const confirmRef = useRef<HTMLElement | null>(null);
  const quantityInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!pendingPackage) return;
    confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => quantityInputRef.current?.focus(), 250);
  }, [pendingPackage]);

  const lookupCode = useCallback((rawCode: string) => {
    const code = normalizeScannedQrCode(rawCode);
    const now = Date.now();

    if (!code) {
      setError("Código QR inválido");
      return;
    }

    if (
      shouldIgnoreDuplicateScan(
        lastScanRef.current?.code ?? null,
        lastScanRef.current?.at ?? null,
        code,
        now,
      )
    ) {
      setMessage("Pacote já processado");
      return;
    }

    lastScanRef.current = { code, at: now };
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const pkg = await lookupPackageAction(code);

      if (!pkg) {
        setPendingPackage(null);
        setError(`Pacote não encontrado (${code})`);
        return;
      }

      setPendingPackage(pkg);
      setQuantity(defaultWithdrawQuantity(pkg.remainingQuantity));
    });
  }, []);

  const handleScan = useCallback(
    (result: { rawCode: string }) => {
      lookupCode(result.rawCode);
    },
    [lookupCode],
  );

  function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!manualCode.trim()) return;
    lookupCode(manualCode);
    setManualCode("");
  }

  function handleConfirm() {
    if (!pendingPackage) return;

    setError(null);

    startTransition(async () => {
      const result = await withdrawPackageAction({
        qrCode: pendingPackage.qrCode,
        quantity,
        allowOverride: false,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      playSuccessFeedback();
      toast(
        `Saída ${result.withdrawnQuantity} · ${result.supplyName} · Saldo ${result.previousQuantity} → ${result.currentQuantity}`,
      );

      if (continuousMode) {
        setPendingPackage(null);
        setQuantity("");
        setMessage("Pronto para próximo pacote");
      }
    });
  }

  const blocked =
    pendingPackage?.status === "depleted" ||
    pendingPackage?.status === "expired";

  const withdrawAmount = Number(quantity);
  const confirmLabel =
    Number.isFinite(withdrawAmount) && withdrawAmount > 0
      ? `Confirmar saída de ${withdrawAmount}`
      : "Confirmar retirada";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Scan QR · retirada</h2>
          <p className="text-sm text-muted-foreground">
            Aponte para o QR do pacote
          </p>
        </div>
        <label className="flex min-h-11 items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={continuousMode}
            onChange={(event) => setContinuousMode(event.target.checked)}
          />
          Modo contínuo
        </label>
      </div>

      {pendingPackage ? (
        <section
          ref={confirmRef}
          className="space-y-4 rounded-xl border-2 border-neo-gold-500 bg-card p-4 shadow-sm"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neo-gold-500">
              Confirme a retirada
            </p>
            <p className="text-lg font-semibold">{pendingPackage.supplyName}</p>
            <p className="text-sm text-muted-foreground">
              {pendingPackage.qrCode}
              {pendingPackage.lotNumber
                ? ` · Lote ${pendingPackage.lotNumber}`
                : ""}
              {pendingPackage.expiresAt
                ? ` · Val. ${pendingPackage.expiresAt}`
                : ""}
            </p>
            <p className="text-sm">
              Restante no pacote: {pendingPackage.remainingQuantity}{" "}
              {SUPPLY_UNIT_LABELS[pendingPackage.unit]}
            </p>
            <p className="text-sm text-muted-foreground">
              Saldo atual do insumo: {pendingPackage.supplyCurrentQuantity}{" "}
              {SUPPLY_UNIT_LABELS[pendingPackage.unit]}
            </p>
            {blocked ? (
              <p className="mt-2 text-sm font-medium text-destructive">
                Pacote {pendingPackage.statusLabel.toLowerCase()}. Retirada
                bloqueada. Gere um pacote novo com saldo restante.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdraw-quantity">Quantidade a retirar</Label>
            <Input
              ref={quantityInputRef}
              id="withdraw-quantity"
              type="number"
              min={0}
              step="any"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="text-base"
              disabled={blocked}
            />
            {!blocked &&
            pendingPackage.remainingQuantity > 0 &&
            Number(quantity) === pendingPackage.remainingQuantity ? (
              <p className="text-xs text-muted-foreground">
                Vai esvaziar o pacote inteiro. Edite se a saída for parcial.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => {
                setPendingPackage(null);
                setQuantity("");
                setError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={blocked || isPending}
              onClick={handleConfirm}
            >
              {isPending ? "Registrando..." : confirmLabel}
            </Button>
          </div>
        </section>
      ) : (
        <>
          <StockQrScanner onScan={handleScan} paused={false} />

          <form
            onSubmit={handleManualSubmit}
            className="space-y-2 rounded-xl border border-border bg-card p-3"
          >
            <Label htmlFor="manual-qr">Ou digite o código do QR</Label>
            <div className="flex gap-2">
              <Input
                id="manual-qr"
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                placeholder="CR-..."
                className="text-base uppercase"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
              <Button
                type="submit"
                variant="outline"
                className="min-h-11 shrink-0"
                disabled={isPending || !manualCode.trim()}
              >
                Buscar
              </Button>
            </div>
          </form>
        </>
      )}

      {message ? <Alert>{message}</Alert> : null}
      {error ? (
        <Alert className="border-destructive/30 text-destructive">
          {error}
        </Alert>
      ) : null}
    </div>
  );
}
