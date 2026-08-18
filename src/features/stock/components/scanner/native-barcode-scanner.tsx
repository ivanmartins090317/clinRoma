"use client";

import { useEffect, useRef, useState } from "react";
import { FlashlightIcon, SwitchCameraIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface NativeBarcodeScannerProps {
  onScan: (rawCode: string) => void;
  paused?: boolean;
}

export function NativeBarcodeScanner({
  onScan,
  paused = false,
}: NativeBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    async function start() {
      setError(null);

      if (!window.isSecureContext) {
        setError("A câmera exige HTTPS ou localhost.");
        return;
      }

      try {
        streamRef.current?.getTracks().forEach((track) => track.stop());

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.();
        setTorchSupported(Boolean(capabilities && "torch" in capabilities));

        const detector = new BarcodeDetector({ formats: ["qr_code"] });

        intervalId = window.setInterval(async () => {
          if (paused || !videoRef.current) return;

          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            if (value) {
              onScan(value);
            }
          } catch {
            // ignore frame errors
          }
        }, 350);
      } catch {
        setError(
          "Não foi possível acessar a câmera. Verifique permissões do navegador.",
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [facingMode, onScan, paused]);

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    const next = !torchOn;
    await track.applyConstraints({
      advanced: [{ torch: next } as MediaTrackConstraintSet],
    });
    setTorchOn(next);
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        className="aspect-[3/4] w-full object-cover"
        playsInline
        muted
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-52 w-52 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 p-4">
        {torchSupported ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-11"
            onClick={toggleTorch}
            aria-label="Lanterna"
          >
            <FlashlightIcon />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-11"
          onClick={() =>
            setFacingMode((current) =>
              current === "environment" ? "user" : "environment",
            )
          }
          aria-label="Trocar câmera"
        >
          <SwitchCameraIcon />
        </Button>
      </div>
      {error ? (
        <p className="absolute inset-x-0 top-0 bg-destructive/90 p-3 text-sm text-white">
          {error}
        </p>
      ) : null}
    </div>
  );
}

declare global {
  interface BarcodeDetector {
    detect(source: ImageBitmapSource): Promise<Array<{ rawValue?: string }>>;
  }

  var BarcodeDetector: {
    new (options?: { formats: string[] }): BarcodeDetector;
  };
}
