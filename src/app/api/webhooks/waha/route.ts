import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  CLINIC_WHATSAPP_SESSION,
  parseSessionStatusEvent,
} from "@/features/whatsapp/domain/session-status";
import {
  readWhatsAppWebhookSecret,
  verifyWebhookHmac,
} from "@/features/whatsapp/domain/webhook-hmac";
import { persistWhatsAppSessionStatus } from "@/features/whatsapp/lib/persist-session-status";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function POST(request: Request) {
  const secret = readWhatsAppWebhookSecret();
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-webhook-hmac");

  if (!secret || !verifyWebhookHmac(rawBody, hmacHeader, secret)) {
    return unauthorized();
  }

  let parsed: unknown;
  try {
    parsed = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return NextResponse.json({ error: "Aviso inválido" }, { status: 400 });
  }

  const event = parseSessionStatusEvent(parsed);
  if (!event) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (event.sessionName !== CLINIC_WHATSAPP_SESSION) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await persistWhatsAppSessionStatus(event.sessionName, event.status);

  revalidatePath("/whatsapp");
  revalidatePath("/hoje");
  revalidatePath("/", "layout");

  console.info("[whatsapp] aviso de sessão", {
    session: event.sessionName,
    status: event.status,
  });

  return NextResponse.json({ ok: true });
}
