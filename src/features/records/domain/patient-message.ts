import type { UserRole } from "@/types/clinroma";

export const PATIENT_MESSAGE_BODY_MAX = 2000;

export const PATIENT_MESSAGE_PURPOSE = {
  postSurgery: "post_surgery",
  anamnesisInvite: "anamnesis_invite",
} as const;

export const PATIENT_MESSAGE_STATUS = {
  pending: "pending",
  sent: "sent",
  failed: "failed",
} as const;

export type PatientMessagePurpose =
  (typeof PATIENT_MESSAGE_PURPOSE)[keyof typeof PATIENT_MESSAGE_PURPOSE];

export type PatientMessageStatus =
  (typeof PATIENT_MESSAGE_STATUS)[keyof typeof PATIENT_MESSAGE_STATUS];

export const PATIENT_MESSAGE_COPY = {
  tab: "Pós-cirurgia",
  composer: "Mensagem para o paciente",
  send: "Enviar WhatsApp",
  sendAnamnesis: "Enviar questionário por WhatsApp",
  success: "Mensagem enviada.",
  successAnamnesis: "Questionário enviado por WhatsApp.",
  failure: "Não foi possível enviar a mensagem.",
  emptyBody: "Escreva a mensagem antes de enviar.",
  tooLong: "Mensagem muito longa.",
  forbidden: "Sem permissão para enviar WhatsApp.",
  noDestination:
    "Cadastre o telefone do paciente ou um segundo contato para enviar WhatsApp.",
  channelUnavailable:
    "WhatsApp da clínica indisponível. Copie o link ou tente mais tarde.",
  statusSent: "Enviado",
  statusFailed: "Falhou",
  emptyList: "Nenhuma mensagem pós-cirurgia enviada ainda.",
  inviteBodyLead:
    "Olá. Segue o questionário de saúde da Clínica Neo Roma para preencher antes da consulta. Vale por 7 dias.",
} as const;

const CPF_PATTERN = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;

export function trimMessageBody(text: string): string {
  return text.trim();
}

export function validatePostSurgeryBody(text: string): string | null {
  const trimmed = trimMessageBody(text);
  if (!trimmed) return PATIENT_MESSAGE_COPY.emptyBody;
  if (trimmed.length > PATIENT_MESSAGE_BODY_MAX) {
    return PATIENT_MESSAGE_COPY.tooLong;
  }
  return null;
}

export function buildAnamnesisInviteWhatsAppBody(inviteUrl: string): string {
  return `${PATIENT_MESSAGE_COPY.inviteBodyLead}\n${inviteUrl.trim()}`;
}

export function inviteWhatsAppBodyLooksSafe(body: string): boolean {
  if (body.includes("CPF") || body.includes("cpf")) return false;
  if (CPF_PATTERN.test(body)) return false;
  return body.length <= PATIENT_MESSAGE_BODY_MAX;
}

export function extractAnamnesisInviteUrl(body: string): string | null {
  const lines = body.trim().split(/\r?\n/);
  const last = lines.at(-1)?.trim() ?? "";
  if (!last.includes("/anamnese/")) return null;
  return last;
}

export function extractAnamnesisInviteToken(url: string): string | null {
  const match = url.trim().match(/\/anamnese\/([^/?#]+)/);
  const token = match?.[1]?.trim() ?? "";
  return token.length >= 16 ? token : null;
}

export function shouldCallWhatsAppGateway(channelConfigured: boolean): boolean {
  return channelConfigured;
}

export function canSendPatientWhatsAppRole(role: UserRole): boolean {
  return role === "admin" || role === "dentist" || role === "reception";
}

export function messageStatusLabel(status: PatientMessageStatus): string {
  if (status === PATIENT_MESSAGE_STATUS.sent) {
    return PATIENT_MESSAGE_COPY.statusSent;
  }
  return PATIENT_MESSAGE_COPY.statusFailed;
}
