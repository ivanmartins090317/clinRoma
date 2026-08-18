import { createAdminClient } from "@/lib/supabase/admin";
import { transcribeWithWhisper } from "@/lib/transcription/whisper";

const AUDIO_BUCKET = "record-audio";

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("webm")) {
    return "webm";
  }

  if (mimeType.includes("mp4") || mimeType.includes("m4a")) {
    return "m4a";
  }

  if (mimeType.includes("mpeg")) {
    return "mp3";
  }

  return "wav";
}

export async function mergeAudioSessionChunks(input: {
  sessionId: string;
  mimeType: string;
  finalPath: string;
}): Promise<{ ok: boolean; totalBytes: number; error?: string }> {
  const admin = createAdminClient();
  const prefix = `temp/${input.sessionId}`;

  const { data: files, error: listError } = await admin.storage
    .from(AUDIO_BUCKET)
    .list(prefix, { sortBy: { column: "name", order: "asc" } });

  if (listError || !files || files.length === 0) {
    return {
      ok: false,
      totalBytes: 0,
      error: "Nenhum bloco de áudio encontrado",
    };
  }

  const buffers: Buffer[] = [];

  for (const file of files) {
    const { data, error } = await admin.storage
      .from(AUDIO_BUCKET)
      .download(`${prefix}/${file.name}`);

    if (error || !data) {
      return { ok: false, totalBytes: 0, error: "Falha ao montar áudio" };
    }

    buffers.push(Buffer.from(await data.arrayBuffer()));
  }

  const merged = Buffer.concat(buffers);
  const { error: uploadError } = await admin.storage
    .from(AUDIO_BUCKET)
    .upload(input.finalPath, merged, {
      contentType: input.mimeType,
      upsert: true,
    });

  if (uploadError) {
    return { ok: false, totalBytes: 0, error: "Falha ao salvar áudio final" };
  }

  const pathsToRemove = files.map((file) => `${prefix}/${file.name}`);
  await admin.storage.from(AUDIO_BUCKET).remove(pathsToRemove);

  return { ok: true, totalBytes: merged.length };
}

export async function runTranscriptionJob(
  attachmentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const { data: attachment, error: fetchError } = await admin
    .from("record_attachments")
    .select("id, storage_path, mime_type, attachment_type")
    .eq("id", attachmentId)
    .maybeSingle();

  if (fetchError || !attachment || attachment.attachment_type !== "audio") {
    return { ok: false, error: "Anexo de áudio não encontrado" };
  }

  await admin
    .from("record_attachments")
    .update({ transcription_status: "processing" })
    .eq("id", attachmentId);

  const { data: fileData, error: downloadError } = await admin.storage
    .from(AUDIO_BUCKET)
    .download(attachment.storage_path);

  if (downloadError || !fileData) {
    await admin
      .from("record_attachments")
      .update({ transcription_status: "failed" })
      .eq("id", attachmentId);

    return { ok: false, error: "Áudio indisponível no armazenamento" };
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const fileName = `audio.${extensionForMime(attachment.mime_type)}`;
  const result = await transcribeWithWhisper(
    buffer,
    attachment.mime_type,
    fileName,
  );

  if (!result.ok || !result.text) {
    await admin
      .from("record_attachments")
      .update({ transcription_status: "failed" })
      .eq("id", attachmentId);

    return { ok: false, error: result.error ?? "Transcrição falhou" };
  }

  await admin
    .from("record_attachments")
    .update({
      transcription: result.text,
      transcription_status: "completed",
    })
    .eq("id", attachmentId);

  return { ok: true };
}

export async function enqueueTranscription(
  attachmentId: string,
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

  try {
    await fetch(`${baseUrl}/api/records/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachmentId }),
    });
  } catch (error) {
    console.error("[transcription] Falha ao enfileirar:", error);
  }
}
