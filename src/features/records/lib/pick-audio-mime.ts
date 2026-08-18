const AUDIO_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
] as const;

export function pickSupportedAudioMime(
  isTypeSupported: (mimeType: string) => boolean = defaultIsTypeSupported,
): string | null {
  for (const mimeType of AUDIO_MIME_CANDIDATES) {
    if (isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return null;
}

function defaultIsTypeSupported(): boolean {
  return false;
}

export function normalizeAudioMime(mimeType: string): string {
  if (mimeType.startsWith("audio/webm")) {
    return "audio/webm";
  }

  if (mimeType.startsWith("audio/mp4")) {
    return "audio/mp4";
  }

  return mimeType.split(";")[0] ?? mimeType;
}
