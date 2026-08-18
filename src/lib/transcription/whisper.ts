const WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions";

export interface WhisperTranscriptionResult {
  ok: boolean;
  text?: string;
  error?: string;
}

export async function transcribeWithWhisper(
  audioBuffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<WhisperTranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      error: "OPENAI_API_KEY não configurada no servidor",
    };
  }

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
  formData.append("file", blob, fileName);
  formData.append("model", "whisper-1");
  formData.append("language", "pt");

  try {
    const response = await fetch(WHISPER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Whisper retornou status ${response.status}`,
      };
    }

    const payload = (await response.json()) as { text?: string };

    return {
      ok: true,
      text: payload.text?.trim() ?? "",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao chamar Whisper",
    };
  }
}
