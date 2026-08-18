import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  expirePendingSlotOffers,
  expirePendingSlotOffersFallback,
} from "@/features/waitlist/lib/expire-slot-offers";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    let expired = 0;

    try {
      expired = await expirePendingSlotOffers();
    } catch {
      expired = await expirePendingSlotOffersFallback();
    }

    revalidatePath("/fila");
    revalidatePath("/hoje");

    return NextResponse.json({ ok: true, expired });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível expirar ofertas" },
      { status: 500 },
    );
  }
}
