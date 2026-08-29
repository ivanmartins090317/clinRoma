import { NextResponse } from "next/server";

import { fetchWahaQr } from "@/features/whatsapp/lib/waha-session";
import {
  refuseWhatsAppWrite,
  WHATSAPP_COPY,
} from "@/features/whatsapp/permissions";
import { getAuthSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const refused = refuseWhatsAppWrite(session.profile.role);
  if (refused) {
    return NextResponse.json({ error: refused }, { status: 403 });
  }

  const result = await fetchWahaQr();

  if (!result.ok) {
    return NextResponse.json(
      { error: WHATSAPP_COPY.channelUnavailable },
      { status: 502 },
    );
  }

  return new NextResponse(Buffer.from(result.bytes), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
