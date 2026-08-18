import type { Database } from "@/lib/supabase/database.types";

export type TranscriptionStatus =
  Database["public"]["Enums"]["transcription_status"];

export const TRANSCRIPTION_STATUS_LABELS: Record<TranscriptionStatus, string> =
  {
    pending: "Aguardando transcrição",
    processing: "Processando...",
    completed: "Transcrição concluída",
    failed: "Transcrição indisponível; áudio salvo",
  };

export function getTranscriptionStatusLabel(
  status: TranscriptionStatus,
): string {
  return TRANSCRIPTION_STATUS_LABELS[status];
}

export function isTranscriptionInProgress(
  status: TranscriptionStatus,
): boolean {
  return status === "pending" || status === "processing";
}
