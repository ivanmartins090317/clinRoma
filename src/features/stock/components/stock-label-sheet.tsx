"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";

export interface LabelPackageData {
  id: string;
  qrCode: string;
  quantity: number;
  lotNumber: string | null;
  expiresAt: string | null;
  supplyName: string;
  unitLabel: string;
}

interface StockLabelSheetProps {
  packages: LabelPackageData[];
  onClose: () => void;
}

export function StockLabelSheet({ packages, onClose }: StockLabelSheetProps) {
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    packages.forEach((pkg) => {
      const canvas = canvasRefs.current[pkg.id];
      if (!canvas) return;

      QRCode.toCanvas(canvas, pkg.qrCode, {
        width: 180,
        margin: 1,
      }).catch(() => undefined);
    });
  }, [packages]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
          <h3 className="text-lg font-semibold">Imprimir etiquetas</h3>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => window.print()}
              className="min-h-11"
            >
              Imprimir
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-11"
            >
              Fechar
            </Button>
          </div>
        </div>

        <div className="label-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-3">
          {packages.map((pkg) => (
            <article
              key={pkg.id}
              className="rounded-lg border border-border p-3 text-center print:break-inside-avoid"
            >
              <canvas
                ref={(node) => {
                  canvasRefs.current[pkg.id] = node;
                }}
                className="mx-auto"
                aria-label={`QR ${pkg.qrCode}`}
              />
              <p className="mt-2 text-sm font-semibold">{pkg.supplyName}</p>
              <p className="text-xs text-muted-foreground">
                {pkg.quantity} {pkg.unitLabel}
              </p>
              {pkg.lotNumber ? (
                <p className="text-xs">Lote {pkg.lotNumber}</p>
              ) : null}
              {pkg.expiresAt ? (
                <p className="text-xs">Val. {pkg.expiresAt}</p>
              ) : null}
              <p className="mt-1 font-mono text-xs">{pkg.qrCode}</p>
            </article>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .label-grid,
          .label-grid * {
            visibility: visible;
          }

          .label-grid {
            position: absolute;
            inset: 0;
            padding: 12mm;
          }
        }
      `}</style>
    </div>
  );
}
