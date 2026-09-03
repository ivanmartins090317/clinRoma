"use client";

import { useCallback, useRef, useState } from "react";

import { ZxingWasmScanner } from "@/features/stock/components/scanner/zxing-wasm-scanner";
import { NativeBarcodeScanner } from "@/features/stock/components/scanner/native-barcode-scanner";

export interface StockQrScanResult {
  rawCode: string;
}

interface StockQrScannerProps {
  onScan: (result: StockQrScanResult) => void;
  paused?: boolean;
}

export function StockQrScanner({
  onScan,
  paused = false,
}: StockQrScannerProps) {
  const [useNative] = useState(
    () => typeof window !== "undefined" && "BarcodeDetector" in window,
  );
  const lastCodeRef = useRef<string | null>(null);
  const lastAtRef = useRef<number>(0);

  const handleDecoded = useCallback(
    (rawCode: string) => {
      const now = Date.now();
      if (lastCodeRef.current === rawCode && now - lastAtRef.current < 3000) {
        return;
      }

      lastCodeRef.current = rawCode;
      lastAtRef.current = now;
      onScan({ rawCode });
    },
    [onScan],
  );

  if (typeof window === "undefined") {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">
        Preparando câmera...
      </div>
    );
  }

  if (useNative) {
    return <NativeBarcodeScanner onScan={handleDecoded} paused={paused} />;
  }

  return <ZxingWasmScanner onScan={handleDecoded} paused={paused} />;
}
