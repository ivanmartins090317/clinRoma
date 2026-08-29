import {
  formatClinicDateTime,
  formatClinicTime,
} from "@/features/agenda/types";
import {
  PATIENT_MESSAGE_BODY_MAX,
  inviteWhatsAppBodyLooksSafe,
} from "@/features/records/domain/patient-message";
import { SLOT_OFFER_VALIDITY_MINUTES } from "@/features/waitlist/domain/slot-offer-expiry";

export type WhatsappDeliveryStatus = "sent" | "queued" | "skipped";

export const SLOT_OFFER_WHATSAPP_COPY = {
  lead: "Olá. A Clínica Neo Roma tem um horário disponível para você.",
  linkLead: "Responda pelo link em até 40 minutos:",
  slotLine: (dateTimeLabel: string, dentistName: string) =>
    `${dateTimeLabel}, com ${dentistName}.`,
  sent: "WhatsApp enviado.",
  queued:
    "WhatsApp não saiu agora. Vamos tentar de novo em instantes. Copie o link se quiser enviar na hora.",
  skipped:
    "Cadastre o telefone do paciente para enviar WhatsApp. Copie o link.",
  fallbackHelp:
    "Se o WhatsApp não chegou, copie o link. Válido por 40 minutos.",
  copyLink: "Copiar link",
  copied: "Link copiado",
  offerButton: "Oferecer horário",
  offering: "Enviando...",
} as const;

export interface BuildSlotOfferWhatsAppBodyInput {
  offerUrl: string;
  startsAt: string;
  dentistName: string;
}

export function formatSlotOfferWhatsAppDateTime(startsAt: string): string {
  const dateTime = formatClinicDateTime(startsAt);
  const time = formatClinicTime(startsAt);
  if (dateTime.endsWith(` ${time}`)) {
    return `${dateTime.slice(0, -(time.length + 1))} às ${time}`;
  }
  return dateTime.replace(" ", " às ");
}

export function buildSlotOfferWhatsAppBody(
  input: BuildSlotOfferWhatsAppBodyInput,
): string {
  const dentistName = input.dentistName.trim() || "Dentista";
  const when = formatSlotOfferWhatsAppDateTime(input.startsAt);
  const url = input.offerUrl.trim();

  return [
    SLOT_OFFER_WHATSAPP_COPY.lead,
    "",
    SLOT_OFFER_WHATSAPP_COPY.slotLine(when, dentistName),
    "",
    SLOT_OFFER_WHATSAPP_COPY.linkLead,
    url,
  ].join("\n");
}

export function slotOfferWhatsAppBodyLooksSafe(body: string): boolean {
  if (!inviteWhatsAppBodyLooksSafe(body)) return false;
  if (!body.includes("/fila/resposta/")) return false;
  return body.length <= PATIENT_MESSAGE_BODY_MAX;
}

export function isSlotOfferWhatsAppExpired(
  createdAt: Date | string,
  now: Date = new Date(),
): boolean {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(created.getTime())) return true;
  return (
    now.getTime() >= created.getTime() + SLOT_OFFER_VALIDITY_MINUTES * 60 * 1000
  );
}

export function whatsappStatusNotice(status: WhatsappDeliveryStatus): string {
  if (status === "sent") return SLOT_OFFER_WHATSAPP_COPY.sent;
  if (status === "queued") return SLOT_OFFER_WHATSAPP_COPY.queued;
  return SLOT_OFFER_WHATSAPP_COPY.skipped;
}
