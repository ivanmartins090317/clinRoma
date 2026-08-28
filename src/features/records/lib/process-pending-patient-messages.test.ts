import { afterEach, describe, expect, it, vi } from "vitest";

import { processPendingPatientMessages } from "@/features/records/lib/process-pending-patient-messages";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => {
    throw new Error("admin não deveria ser chamado com canal ausente");
  }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cron de mensagens pós-cirurgia", () => {
  it("não chama o banco nem a WAHA quando o canal está ausente", async () => {
    vi.stubEnv("WHATSAPP_GATEWAY_URL", "");
    vi.stubEnv("WHATSAPP_GATEWAY_KEY", "");
    vi.stubEnv("WHATSAPP_GATEWAY_SESSION", "");

    await expect(processPendingPatientMessages()).resolves.toEqual({
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    });
  });
});
