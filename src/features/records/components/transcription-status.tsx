"use client";

import { useEffect, useState, useTransition } from "react";

import {
  getTranscriptionStatusAction,
  retryTranscriptionAction,
  updateTranscriptionAction,
} from "@/features/records/actions";
import {
  isTranscriptionEditable,
  TRANSCRIPTION_TEXT_MAX_LENGTH,
  validateTranscriptionText,
} from "@/features/records/domain/transcription-edit";
import {
  getTranscriptionStatusLabel,
  isTranscriptionInProgress,
} from "@/features/records/domain/transcription-status";
import type { Database } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type TranscriptionStatus = Database["public"]["Enums"]["transcription_status"];

interface TranscriptionStatusViewProps {
  attachmentId: string;
  initialStatus: TranscriptionStatus;
  initialText: string | null;
  canRetry: boolean;
  canCorrect: boolean;
}

export function TranscriptionStatusView({
  attachmentId,
  initialStatus,
  initialText,
  canRetry,
  canCorrect,
}: TranscriptionStatusViewProps) {
  const [status, setStatus] = useState(initialStatus);
  const [text, setText] = useState(initialText);
  const [draft, setDraft] = useState(initialText ?? "");
  const [savedText, setSavedText] = useState((initialText ?? "").trim());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
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

        if (result.transcriptionStatus === "completed") {
          const nextText = result.transcription ?? "";
          setDraft(nextText);
          setSavedText(nextText.trim());
        }
      });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [attachmentId, status]);

  function handleDraftChange(value: string) {
    setDraft(value);
    setFeedback(null);
    setIsSuccess(false);
  }

  function handleRetry() {
    startTransition(async () => {
      const result = await retryTranscriptionAction({ attachmentId });

      if (!result.error) {
        setStatus("processing");
      }
    });
  }

  function handleSaveCorrection() {
    setFeedback(null);
    setIsSuccess(false);

    const textError = validateTranscriptionText(draft);

    if (textError) {
      setFeedback(textError);
      return;
    }

    startTransition(async () => {
      const result = await updateTranscriptionAction({
        attachmentId,
        transcription: draft,
      });

      if (result.error) {
        setFeedback(result.error);
        return;
      }

      const persisted = draft.trim();
      setText(persisted);
      setSavedText(persisted);
      setIsSuccess(true);
      setFeedback("Correção salva.");
    });
  }

  const showEditor = isTranscriptionEditable(status) && canCorrect;
  const hasChanges = draft.trim() !== savedText;
  const statusLabel = showEditor
    ? "Transcrição concluída. Corrija se o serviço errou."
    : getTranscriptionStatusLabel(status);

  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground">{statusLabel}</p>
      {showEditor ? (
        <CompletedTranscriptionEditor
          draft={draft}
          feedback={feedback}
          hasChanges={hasChanges}
          isPending={isPending}
          isSuccess={isSuccess}
          onChange={handleDraftChange}
          onSave={handleSaveCorrection}
        />
      ) : text ? (
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

interface CompletedTranscriptionEditorProps {
  draft: string;
  feedback: string | null;
  hasChanges: boolean;
  isPending: boolean;
  isSuccess: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}

function CompletedTranscriptionEditor({
  draft,
  feedback,
  hasChanges,
  isPending,
  isSuccess,
  onChange,
  onSave,
}: CompletedTranscriptionEditorProps) {
  return (
    <div className="space-y-2">
      <Textarea
        aria-label="Texto da transcrição"
        value={draft}
        maxLength={TRANSCRIPTION_TEXT_MAX_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 text-base md:text-base"
      />
      {feedback ? (
        <p
          className={
            isSuccess ? "text-sm text-primary" : "text-sm text-destructive"
          }
        >
          {feedback}
        </p>
      ) : null}
      <Button
        type="button"
        className="min-h-11 min-w-11"
        disabled={isPending || !hasChanges}
        onClick={onSave}
      >
        {isPending ? "Salvando..." : "Salvar correção"}
      </Button>
    </div>
  );
}
