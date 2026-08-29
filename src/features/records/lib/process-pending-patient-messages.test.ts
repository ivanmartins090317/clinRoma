import { afterEach, describe, expect, it, vi } from "vitest";

import { PATIENT_MESSAGE_PURPOSE } from "@/features/records/domain/patient-message";
import { processPendingPatientMessages } from "@/features/records/lib/process-pending-patient-messages";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => {
    throw new Error("admin não deveria ser chamado com canal ausente");
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

interface FakeRow {
  id: string;
  patient_id: string;
  destination_digits: string;
  body: string;
  status: string;
  purpose: string;
  scheduled_at: string;
  attempt_count: number;
  created_at: string;
}

function createFakeAdmin(rows: FakeRow[]) {
  const updates: Record<string, unknown>[] = [];

  function createBuilder() {
    let payload: Record<string, unknown> | null = null;

    const builder = {
      select: () => builder,
      in: () => builder,
      eq: () => builder,
      not: () => builder,
      lte: () => builder,
      lt: () => builder,
      order: () => builder,
      limit: () => builder,
      update: (next: Record<string, unknown>) => {
        payload = next;
        updates.push(next);
        return builder;
      },
      maybeSingle: () => builder,
      then(
        resolve: (value: unknown) => unknown,
        reject?: (reason: unknown) => unknown,
      ) {
        if (!payload) {
          return Promise.resolve({ data: rows, error: null }).then(
            resolve,
            reject,
          );
        }

        if ("attempt_count" in payload) {
          return Promise.resolve({
            data: { id: rows[0]?.id ?? "claimed" },
            error: null,
          }).then(resolve, reject);
        }

        return Promise.resolve({ data: null, error: null }).then(
          resolve,
          reject,
        );
      },
    };

    return builder;
  }

  return {
    updates,
    from: () => createBuilder(),
  };
}

describe("cron de mensagens pendentes", () => {
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

  it("envia oferta da fila pendente e ainda válida", async () => {
    const now = new Date("2026-08-28T15:10:00.000Z");
    const admin = createFakeAdmin([
      {
        id: "offer-msg-1",
        patient_id: "patient-1",
        destination_digits: "5511999990001",
        body: "https://localhost:3000/fila/resposta/token-opaco",
        status: "pending",
        purpose: PATIENT_MESSAGE_PURPOSE.slotOffer,
        scheduled_at: "2026-08-28T15:00:00.000Z",
        attempt_count: 0,
        created_at: "2026-08-28T15:00:00.000Z",
      },
    ]);
    const send = vi.fn(async () => ({ ok: true as const }));

    const result = await processPendingPatientMessages({
      isChannelConfigured: () => true,
      admin: admin as never,
      send,
      now,
    });

    expect(result).toEqual({
      processed: 1,
      sent: 1,
      failed: 0,
      skipped: 0,
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(admin.updates.some((update) => update.status === "sent")).toBe(true);
  });

  it("cancela oferta da fila com mais de 40 minutos sem disparar", async () => {
    const now = new Date("2026-08-28T16:00:00.000Z");
    const admin = createFakeAdmin([
      {
        id: "offer-msg-old",
        patient_id: "patient-1",
        destination_digits: "5511999990001",
        body: "https://localhost:3000/fila/resposta/token-opaco",
        status: "pending",
        purpose: PATIENT_MESSAGE_PURPOSE.slotOffer,
        scheduled_at: "2026-08-28T15:00:00.000Z",
        attempt_count: 0,
        created_at: "2026-08-28T15:00:00.000Z",
      },
    ]);
    const send = vi.fn(async () => ({ ok: true as const }));

    const result = await processPendingPatientMessages({
      isChannelConfigured: () => true,
      admin: admin as never,
      send,
      now,
    });

    expect(result).toEqual({
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 1,
    });
    expect(send).not.toHaveBeenCalled();
    expect(admin.updates.some((update) => update.status === "cancelled")).toBe(
      true,
    );
  });
});
