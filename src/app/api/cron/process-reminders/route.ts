import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { processPendingReminders } from "@/features/reminders/lib/process-pending-reminders";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const result = await processPendingReminders();

    revalidatePath("/hoje");
    revalidatePath("/agenda");

    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível processar lembretes" },
      { status: 500 },
    );
  }
}
