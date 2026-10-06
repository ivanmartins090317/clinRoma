import { WHATSAPP_COPY } from "@/features/whatsapp/permissions";

export const PATIENT_WHATSAPP_CHAT_COPY = {
  button: "Conversar",
  sessionDown: "WhatsApp não está logado.",
  numberMissing: "Este número não está no WhatsApp.",
  phoneMissing: "Cadastre o telefone do paciente ou um segundo contato.",
  openingSecondary: "Abrindo conversa com o segundo contato.",
  channelUnavailable: WHATSAPP_COPY.channelUnavailable,
  refused: "Sem permissão para abrir a conversa.",
  patientUnavailable: "Não foi possível abrir a conversa deste paciente.",
  popupBlocked: "Não foi possível abrir a janela do WhatsApp.",
} as const;

export type NumberExistsReading = "exists" | "missing" | "unexpected";

export function buildPatientWhatsAppChatUrl(digits: string): string | null {
  if (!/^55\d{10,11}$/.test(digits)) return null;
  return `https://wa.me/${digits}`;
}

export function readNumberExists(payload: unknown): NumberExistsReading {
  if (!payload || typeof payload !== "object") return "unexpected";

  const value = (payload as { numberExists?: unknown }).numberExists;
  if (value === true) return "exists";
  if (value === false) return "missing";
  return "unexpected";
}
