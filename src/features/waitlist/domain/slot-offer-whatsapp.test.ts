import { describe, expect, it } from "vitest";

import { PATIENT_MESSAGE_BODY_MAX } from "@/features/records/domain/patient-message";
import { SLOT_OFFER_VALIDITY_MINUTES } from "@/features/waitlist/domain/slot-offer-expiry";
import {
  SLOT_OFFER_WHATSAPP_COPY,
  buildSlotOfferWhatsAppBody,
  formatSlotOfferWhatsAppDateTime,
  isSlotOfferWhatsAppExpired,
  slotOfferWhatsAppBodyLooksSafe,
  whatsappStatusNotice,
} from "@/features/waitlist/domain/slot-offer-whatsapp";

const OFFER_URL =
  "https://localhost:3000/fila/resposta/clinroma-dev-waitlist-offer-001";

describe("corpo do WhatsApp da oferta da fila", () => {
  const body = buildSlotOfferWhatsAppBody({
    offerUrl: OFFER_URL,
    startsAt: "2026-08-29T12:00:00.000Z",
    dentistName: "Felipe Roma",
  });

  it("usa texto fixo, data, dentista e o link, sem CPF nem nome do paciente", () => {
    expect(body.startsWith(SLOT_OFFER_WHATSAPP_COPY.lead)).toBe(true);
    expect(body).toContain("29/08/2026 às 09:00, com Felipe Roma.");
    expect(body).toContain(SLOT_OFFER_WHATSAPP_COPY.linkLead);
    expect(body).toContain(`\n${OFFER_URL}`);
    expect(body).not.toContain("CPF");
    expect(body).not.toContain("Maria");
    expect(slotOfferWhatsAppBodyLooksSafe(body)).toBe(true);
    expect(body.length).toBeLessThanOrEqual(PATIENT_MESSAGE_BODY_MAX);
  });

  it("não usa travessão na copy", () => {
    const copies = [
      SLOT_OFFER_WHATSAPP_COPY.lead,
      SLOT_OFFER_WHATSAPP_COPY.linkLead,
      SLOT_OFFER_WHATSAPP_COPY.sent,
      SLOT_OFFER_WHATSAPP_COPY.queued,
      SLOT_OFFER_WHATSAPP_COPY.skipped,
      SLOT_OFFER_WHATSAPP_COPY.fallbackHelp,
      SLOT_OFFER_WHATSAPP_COPY.copyLink,
      SLOT_OFFER_WHATSAPP_COPY.copied,
      SLOT_OFFER_WHATSAPP_COPY.offerButton,
      SLOT_OFFER_WHATSAPP_COPY.offering,
    ];

    for (const text of copies) {
      expect(text).not.toContain("—");
    }
  });

  it("formata o horário no fuso da clínica", () => {
    expect(formatSlotOfferWhatsAppDateTime("2026-08-29T12:00:00.000Z")).toBe(
      "29/08/2026 às 09:00",
    );
  });

  it("recusa corpo sem o link da fila ou com CPF", () => {
    expect(slotOfferWhatsAppBodyLooksSafe("Olá sem link")).toBe(false);
    expect(
      slotOfferWhatsAppBodyLooksSafe(
        `${SLOT_OFFER_WHATSAPP_COPY.lead}\nCPF 529.982.247-25\n${OFFER_URL}`,
      ),
    ).toBe(false);
  });
});

describe("expiração do retry da oferta", () => {
  const createdAt = new Date("2026-08-28T15:00:00.000Z");

  it("ainda tenta dentro de 40 minutos", () => {
    expect(
      isSlotOfferWhatsAppExpired(
        createdAt,
        new Date("2026-08-28T15:39:00.000Z"),
      ),
    ).toBe(false);
  });

  it("cancela depois de 40 minutos", () => {
    expect(
      isSlotOfferWhatsAppExpired(
        createdAt,
        new Date(createdAt.getTime() + SLOT_OFFER_VALIDITY_MINUTES * 60 * 1000),
      ),
    ).toBe(true);
  });
});

describe("aviso na UI", () => {
  it("espelha enviado, fila de retry e sem telefone", () => {
    expect(whatsappStatusNotice("sent")).toBe(SLOT_OFFER_WHATSAPP_COPY.sent);
    expect(whatsappStatusNotice("queued")).toBe(
      SLOT_OFFER_WHATSAPP_COPY.queued,
    );
    expect(whatsappStatusNotice("skipped")).toBe(
      SLOT_OFFER_WHATSAPP_COPY.skipped,
    );
  });
});
