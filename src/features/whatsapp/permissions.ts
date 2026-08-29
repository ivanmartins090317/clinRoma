import { getModuleAccess } from "@/lib/auth/roles";
import type { UserRole } from "@/types/clinroma";

export function canWriteWhatsAppSession(role: UserRole): boolean {
  return getModuleAccess(role, "whatsapp") === "write";
}

export function canSeeWhatsAppMenuChip(role: UserRole): boolean {
  return canWriteWhatsAppSession(role);
}

export function canSeeWhatsAppStatusCard(role: UserRole): boolean {
  return role === "admin" || role === "reception" || role === "dentist";
}

export function canReadWhatsAppSessionStatus(role: UserRole): boolean {
  return canSeeWhatsAppStatusCard(role);
}

export function canOpenWhatsAppPairing(role: UserRole): boolean {
  return canWriteWhatsAppSession(role);
}

export const WHATSAPP_COPY = {
  noPermission: "Sem permissão para gerenciar o WhatsApp da clínica.",
  channelUnavailable:
    "Não foi possível falar com o WhatsApp da clínica. Tente de novo em instantes.",
  connected: "WhatsApp da clínica conectado.",
  disconnected: "WhatsApp da clínica desconectado.",
  qrHelp: "Abra o WhatsApp no celular da clínica e leia o código.",
  chipOn: "WhatsApp ligado",
  chipOff: "WhatsApp desligado",
  cardTitle: "WhatsApp da clínica",
  dentistHint: "Peça à recepção ou ao admin para reconectar.",
  openPairing: "Abrir pareamento",
  disconnect: "Desconectar",
  disconnectConfirm:
    "Desconectar o WhatsApp da clínica? As mensagens ao paciente (pós-cirurgia, questionário e oferta da fila) param até alguém parear de novo.",
  disconnectNow: "Desconectar agora",
  cancel: "Cancelar",
  pageTitle: "WhatsApp da clínica",
} as const;

export function refuseWhatsAppWrite(role: UserRole): string | null {
  if (!canWriteWhatsAppSession(role)) {
    return WHATSAPP_COPY.noPermission;
  }

  return null;
}
