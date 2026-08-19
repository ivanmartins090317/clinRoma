"use client";

import { useEffect, useState, useTransition } from "react";

import {
  getTranscriptionStatusAction,
  retryTranscriptionAction,
} from "@/features/records/actions";
import {
  getTranscriptionStatusLabel,
  isTranscriptionInProgress,
} from "@/features/records/domain/transcription-status";
import type { Database } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";

type TranscriptionStatus = Database["public"]["Enums"]["transcription_status"];

interface TranscriptionStatusViewProps {
  attachmentId: string;
  initialStatus: TranscriptionStatus;
  initialText: string | null;
  canRetry: boolean;
}

export function TranscriptionStatusView({
  attachmentId,
  initialStatus,
  initialText,
  canRetry,
}: TranscriptionStatusViewProps) {
  const [status, setStatus] = useState(initialStatus);
  const [text, setText] = useState(initialText);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isTranscriptionInProgress(status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void getTranscriptionStatusAction(attachmentId).then((result) => {
        if (!result) {
          return;
        }

        setStatus(result.transcriptionStatus);
        setText(result.transcription);
      });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [attachmentId, status]);

  function handleRetry() {
    startTransition(async () => {
      const result = await retryTranscriptionAction({ attachmentId });

      if (!result.error) {
        setStatus("processing");
      }
    });
  }

  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground">
        {getTranscriptionStatusLabel(status)}
      </p>
      {text ? (
        <blockquote className="rounded-md border border-border bg-muted/30 p-3 whitespace-pre-wrap">
          {text}
        </blockquote>
      ) : null}
      {status === "failed" && canRetry ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={isPending}
          onClick={handleRetry}
        >
          {isPending ? "Reenfileirando..." : "Tentar novamente"}
        </Button>
      ) : null}
      {status === "pending" && canRetry ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={isPending}
          onClick={handleRetry}
        >
          {isPending ? "Iniciando..." : "Processar transcrição"}
        </Button>
      ) : null}
    </div>
  );
}
