import { describe, expect, it, vi } from "vitest";

import {
  PATIENT_MESSAGE_PURPOSE,
  PATIENT_MESSAGE_STATUS,
} from "@/features/records/domain/patient-message";
import type { ResolvedWhatsAppDestination } from "@/features/records/domain/whatsapp-destination";
import {
  buildSlotOfferMessageInsert,
  sendSlotOfferWhatsApp,
} from "@/features/waitlist/lib/send-slot-offer-whatsapp";

const DESTINATION: ResolvedWhatsAppDestination = {
  digits: "5511999990001",
  contactSource: "patient_phone",
  note: null,
};

const INPUT = {
  patientId: "c1000001-0000-4000-8000-000000000001",
  actorId: "a1000001-0000-4000-8000-000000000001",
  offerUrl:
    "https://localhost:3000/fila/resposta/clinroma-dev-waitlist-offer-001",
  startsAt: "2026-08-29T12:00:00.000Z",
  dentistName: "Felipe Roma",
};

describe("sendSlotOfferWhatsApp", () => {
  it("grava sent quando o disparo funciona", async () => {
    const persist = vi.fn(async () => "msg-1");
    const audit = vi.fn(async () => undefined);
    const send = vi.fn(async () => ({ ok: true as const }));

    const result = await sendSlotOfferWhatsApp(INPUT, {
      loadDestination: async () => DESTINATION,
      send,
      persist,
      audit,
    });

    expect(result).toEqual({ status: "sent", messageId: "msg-1" });
    expect(send).toHaveBeenCalledWith({
      destino: DESTINATION.digits,
      texto: expect.stringContaining(INPUT.offerUrl),
    });
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: INPUT.patientId,
        sent: true,
        destination: DESTINATION,
      }),
    );
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: "msg-1",
        sent: true,
      }),
    );
  });

  it("grava pending com scheduled_at no persist quando o disparo falha", async () => {
    const persist = vi.fn(async (input) => {
      expect(input.sent).toBe(false);
      return "msg-2";
    });

    const result = await sendSlotOfferWhatsApp(INPUT, {
      loadDestination: async () => DESTINATION,
      send: async () => ({ ok: false, error: "send_failed" }),
      persist,
      audit: async () => undefined,
    });

    expect(result.status).toBe("queued");
    expect(result.messageId).toBe("msg-2");
    expect(persist).toHaveBeenCalledTimes(1);

    const row = buildSlotOfferMessageInsert(
      {
        patientId: INPUT.patientId,
        actorId: INPUT.actorId,
        destination: DESTINATION,
        body: "texto",
        sent: false,
      },
      "2026-08-28T15:00:00.000Z",
    );
    expect(row.status).toBe(PATIENT_MESSAGE_STATUS.pending);
    expect(row.scheduled_at).toBe("2026-08-28T15:00:00.000Z");
    expect(row.purpose).toBe(PATIENT_MESSAGE_PURPOSE.slotOffer);
    expect(row.attempt_count).toBe(0);
  });

  it("não grava mensagem quando não há destino", async () => {
    const persist = vi.fn(async () => "should-not-run");
    const send = vi.fn(async () => ({ ok: true as const }));

    const result = await sendSlotOfferWhatsApp(INPUT, {
      loadDestination: async () => null,
      send,
      persist,
    });

    expect(result).toEqual({ status: "skipped" });
    expect(send).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });
});
