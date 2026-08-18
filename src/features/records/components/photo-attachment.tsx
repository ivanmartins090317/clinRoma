"use client";

import { useRef, useState, useSyncExternalStore, useTransition } from "react";

import { registerPhotoAttachmentAction } from "@/features/records/actions";
import { validateAttachmentLimits } from "@/features/records/domain/attachment-limits";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

interface PhotoAttachmentProps {
  patientId: string;
  evolutionId: string;
}

function usePreferRearCamera(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () =>
      window.matchMedia("(pointer: coarse)").matches ||
      /iPhone|iPad|Android/i.test(navigator.userAgent),
    () => false,
  );
}

export function PhotoAttachment({
  patientId,
  evolutionId,
}: PhotoAttachmentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preferRearCamera = usePreferRearCamera();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setPreviewUrl(URL.createObjectURL(file));

    startTransition(async () => {
      const limitError = validateAttachmentLimits({
        mimeType: file.type,
        fileSizeBytes: file.size,
        attachmentType: "photo",
      });

      if (limitError) {
        setError(limitError);
        return;
      }

      const storagePath = `${patientId}/${evolutionId}/${crypto.randomUUID()}.${file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg"}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("record-photos")
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setError("Não foi possível enviar a foto.");
        return;
      }

      const result = await registerPhotoAttachmentAction({
        patientId,
        evolutionId,
        mimeType: file.type,
        fileSizeBytes: file.size,
        storagePath,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      toast("Foto anexada à evolução");
    });
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="photo-input">Foto da etiqueta</Label>
      <input
        ref={inputRef}
        id="photo-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        {...(preferRearCamera ? { capture: "environment" as const } : {})}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        {isPending
          ? "Enviando..."
          : preferRearCamera
            ? "Tirar ou escolher foto"
            : "Escolher foto"}
      </Button>
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Prévia da foto"
          className="max-h-48 w-full rounded-md object-cover"
        />
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
