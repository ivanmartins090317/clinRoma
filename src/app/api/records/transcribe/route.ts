import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth/session";
import { runTranscriptionJob } from "@/lib/transcription/enqueue-transcription";

const bodySchema = z.object({
  attachmentId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const payload = bodySchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const result = await runTranscriptionJob(payload.data.attachmentId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
