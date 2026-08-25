import type { TranscriptionStatus } from "@/features/records/domain/transcription-status";
import { canCorrectTranscription } from "@/features/records/permissions";
import type { UserRole } from "@/types/clinroma";

export const TRANSCRIPTION_TEXT_MAX_LENGTH = 10_000;

export const TRANSCRIPTION_EDIT_ERRORS = {
  empty: "Informe o texto da transcrição.",
  tooLong: "Texto muito longo",
  notCompleted: "Só é possível corrigir depois que a transcrição concluir.",
  forbidden: "Sem permissão para corrigir a transcrição.",
  generic: "Não foi possível salvar a correção.",
} as const;

export function isTranscriptionEditable(status: TranscriptionStatus): boolean {
  return status === "completed";
}

export function normalizeTranscriptionText(raw: string): string {
  return raw.trim();
}

export function validateTranscriptionText(raw: string): string | null {
  const text = normalizeTranscriptionText(raw);

  if (text.length === 0) {
    return TRANSCRIPTION_EDIT_ERRORS.empty;
  }

  if (text.length > TRANSCRIPTION_TEXT_MAX_LENGTH) {
    return TRANSCRIPTION_EDIT_ERRORS.tooLong;
  }

  return null;
}

export interface TranscriptionCorrectionInput {
  role: UserRole;
  status: TranscriptionStatus;
  attachmentType: string;
  text: string;
}

export interface TranscriptionCorrectionOk {
  ok: true;
  text: string;
}

export interface TranscriptionCorrectionFail {
  ok: false;
  error: string;
}

export function evaluateTranscriptionCorrection(
  input: TranscriptionCorrectionInput,
): TranscriptionCorrectionOk | TranscriptionCorrectionFail {
  if (!canCorrectTranscription(input.role)) {
    return { ok: false, error: TRANSCRIPTION_EDIT_ERRORS.forbidden };
  }

  if (input.attachmentType !== "audio") {
    return { ok: false, error: TRANSCRIPTION_EDIT_ERRORS.generic };
  }

  if (!isTranscriptionEditable(input.status)) {
    return { ok: false, error: TRANSCRIPTION_EDIT_ERRORS.notCompleted };
  }

  const textError = validateTranscriptionText(input.text);

  if (textError) {
    return { ok: false, error: textError };
  }

  return { ok: true, text: normalizeTranscriptionText(input.text) };
}
