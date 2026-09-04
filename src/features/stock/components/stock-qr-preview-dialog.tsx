"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StockQrPreviewDialogProps {
  open: boolean;
  qrCode: string;
  supplyName: string;
  remainingLabel: string;
  onOpenChange: (open: boolean) => void;
}

export function StockQrPreviewDialog({
  open,
  qrCode,
  supplyName,
  remainingLabel,
  onOpenChange,
}: StockQrPreviewDialogProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDataUrl(null);
      return;
    }

    let cancelled = false;

    QRCode.toDataURL(qrCode, { margin: 1, width: 512 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [open, qrCode]);

  function downloadPng() {
    if (!dataUrl) return;
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `${qrCode}.png`;
    anchor.click();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Etiqueta QR</DialogTitle>
          <DialogDescription>
            Este é o código da embalagem na prateleira. Use Scan QR para
            retirar unidades. Não gere pacote novo só para ver a etiqueta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL gerado no cliente
            <img
              src={dataUrl}
              alt={`QR ${qrCode}`}
              className="size-56 rounded-lg border border-border bg-white p-2"
            />
          ) : (
            <div className="flex size-56 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
              Carregando QR...
            </div>
          )}
          <div className="text-center">
            <p className="font-medium">{supplyName}</p>
            <p className="font-mono text-sm">{qrCode}</p>
            <p className="text-sm text-muted-foreground">{remainingLabel}</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-center">
          <Button
            type="button"
            className="min-h-11"
            disabled={!dataUrl}
            onClick={downloadPng}
          >
            Baixar etiqueta PNG
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
