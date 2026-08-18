import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateAttachmentLimits } from "@/features/records/domain/attachment-limits";
import { normalizeAudioMime } from "@/features/records/lib/pick-audio-mime";

const chunkSchema = z.object({
  sessionId: z.string().uuid(),
  chunkIndex: z.number().int().min(0),
  mimeType: z.string().min(1),
  totalBytes: z.number().int().positive().optional(),
});

const AUDIO_BUCKET = "record-audio";

function canUploadAudio(role: string): boolean {
  return role === "admin" || role === "dentist";
}

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session || !canUploadAudio(session.profile.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const formData = await request.formData();
  const chunkFile = formData.get("chunk");

  if (!(chunkFile instanceof File)) {
    return NextResponse.json({ error: "Bloco inválido" }, { status: 400 });
  }

  const parsed = chunkSchema.safeParse({
    sessionId: formData.get("sessionId"),
    chunkIndex: Number(formData.get("chunkIndex")),
    mimeType: formData.get("mimeType"),
    totalBytes: formData.get("totalBytes")
      ? Number(formData.get("totalBytes"))
      : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const mimeType = normalizeAudioMime(parsed.data.mimeType);
  const limitError = validateAttachmentLimits({
    mimeType,
    fileSizeBytes: parsed.data.totalBytes ?? chunkFile.size,
    attachmentType: "audio",
  });

  if (limitError) {
    return NextResponse.json({ error: limitError }, { status: 400 });
  }

  const admin = createAdminClient();
  const path = `temp/${parsed.data.sessionId}/chunk-${String(parsed.data.chunkIndex).padStart(5, "0")}.${mimeType.includes("webm") ? "webm" : "m4a"}`;
  const buffer = Buffer.from(await chunkFile.arrayBuffer());

  const { error } = await admin.storage
    .from(AUDIO_BUCKET)
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    return NextResponse.json(
      { error: "Falha ao receber bloco de áudio" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, path });
}
