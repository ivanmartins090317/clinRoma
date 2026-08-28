import { NextResponse } from "next/server";

import { processPendingPatientMessages } from "@/features/records/lib/process-pending-patient-messages";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const result = await processPendingPatientMessages();

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível processar mensagens pós-cirurgia" },
      { status: 500 },
    );
  }
}
