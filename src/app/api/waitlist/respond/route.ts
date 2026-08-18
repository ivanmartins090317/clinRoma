import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  acceptSlotOffer,
  declineSlotOffer,
} from "@/features/waitlist/lib/accept-slot-offer";
import { extractClientIp, hashClientIp } from "@/features/waitlist/lib/hash-ip";
import { checkRateLimit } from "@/features/waitlist/lib/rate-limit";
import { publicSlotResponseSchema } from "@/features/waitlist/schemas";

export async function POST(request: Request) {
  try {
    const payload = publicSlotResponseSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json(
        { ok: false, error: "Dados inválidos" },
        { status: 400 },
      );
    }

    const ip = extractClientIp(request);
    const ipHash = hashClientIp(ip);
    const rateKey = `${ipHash}:${payload.data.token.slice(0, 12)}`;

    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { ok: false, error: "Link inválido ou expirado" },
        { status: 429 },
      );
    }

    const result =
      payload.data.action === "accept"
        ? await acceptSlotOffer({
            token: payload.data.token,
            ipHash,
            lgpdConsent: payload.data.lgpdConsent,
          })
        : await declineSlotOffer({
            token: payload.data.token,
            ipHash,
            lgpdConsent: payload.data.lgpdConsent,
          });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error ?? "Link inválido ou expirado" },
        { status: 400 },
      );
    }

    revalidatePath("/fila");
    revalidatePath("/hoje");
    revalidatePath("/agenda");

    return NextResponse.json({
      ok: true,
      alreadyResponded: result.alreadyResponded,
      response: result.response ?? payload.data.action,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Link inválido ou expirado" },
      { status: 500 },
    );
  }
}
