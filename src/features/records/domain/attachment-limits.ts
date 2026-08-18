export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const AUDIO_MAX_BYTES = 50 * 1024 * 1024;

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/wav",
] as const;

export type AllowedPhotoMime = (typeof ALLOWED_PHOTO_MIME_TYPES)[number];
export type AllowedAudioMime = (typeof ALLOWED_AUDIO_MIME_TYPES)[number];

export interface AttachmentValidationInput {
  mimeType: string;
  fileSizeBytes: number;
  attachmentType: "photo" | "audio";
}

export function validateAttachmentLimits(
  input: AttachmentValidationInput,
): string | null {
  if (input.fileSizeBytes <= 0) {
    return "Arquivo vazio.";
  }

  if (input.attachmentType === "photo") {
    if (
      !(ALLOWED_PHOTO_MIME_TYPES as readonly string[]).includes(input.mimeType)
    ) {
      return "Formato de foto não permitido. Use JPEG, PNG ou WebP.";
    }

    if (input.fileSizeBytes > PHOTO_MAX_BYTES) {
      return "Foto acima do limite de 10 MB.";
    }

    return null;
  }

  if (
    !(ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(input.mimeType)
  ) {
    return "Formato de áudio não permitido.";
  }

  if (input.fileSizeBytes > AUDIO_MAX_BYTES) {
    return "Áudio acima do limite de 50 MB.";
  }

  return null;
}
