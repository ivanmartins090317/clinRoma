export interface AudioChunkUploadInput {
  sessionId: string;
  chunkIndex: number;
  mimeType: string;
  blob: Blob;
  totalBytes?: number;
}

export interface AudioChunkUploadResult {
  ok: boolean;
  error?: string;
}

const PENDING_KEY_PREFIX = "clinroma-audio-pending";

function pendingKey(sessionId: string, chunkIndex: number): string {
  return `${PENDING_KEY_PREFIX}:${sessionId}:${chunkIndex}`;
}

export async function uploadAudioChunk(
  input: AudioChunkUploadInput,
): Promise<AudioChunkUploadResult> {
  const formData = new FormData();
  formData.append("sessionId", input.sessionId);
  formData.append("chunkIndex", String(input.chunkIndex));
  formData.append("mimeType", input.mimeType);
  formData.append("chunk", input.blob, `chunk-${input.chunkIndex}`);

  if (input.totalBytes) {
    formData.append("totalBytes", String(input.totalBytes));
  }

  try {
    const response = await fetch("/api/records/audio-chunk", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      return {
        ok: false,
        error: payload?.error ?? "Falha no envio do bloco",
      };
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(
        pendingKey(input.sessionId, input.chunkIndex),
      );
    }

    return { ok: true };
  } catch {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        pendingKey(input.sessionId, input.chunkIndex),
        "1",
      );
    }

    return { ok: false, error: "Rede indisponível" };
  }
}

export async function flushPendingAudioChunks(input: {
  sessionId: string;
  mimeType: string;
  getBlobForIndex: (chunkIndex: number) => Blob | null;
  maxIndex: number;
}): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  for (let index = 0; index <= input.maxIndex; index += 1) {
    const key = pendingKey(input.sessionId, index);

    if (!window.localStorage.getItem(key)) {
      continue;
    }

    const blob = input.getBlobForIndex(index);

    if (!blob) {
      continue;
    }

    const result = await uploadAudioChunk({
      sessionId: input.sessionId,
      chunkIndex: index,
      mimeType: input.mimeType,
      blob,
    });

    if (result.ok) {
      window.localStorage.removeItem(key);
    }
  }
}
