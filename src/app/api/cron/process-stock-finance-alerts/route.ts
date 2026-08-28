import { NextResponse } from "next/server";

import { processFinanceAlerts } from "@/features/stock/lib/process-finance-alerts";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const result = await processFinanceAlerts();

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
      cancelled: result.cancelled,
      created: result.created,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível processar avisos de estoque" },
      { status: 500 },
    );
  }
}
