import type { UserRole } from "@/types/clinroma";

export const PATIENT_MESSAGE_BODY_MAX = 2000;

export const PATIENT_MESSAGE_PURPOSE = {
  postSurgery: "post_surgery",
  anamnesisInvite: "anamnesis_invite",
  slotOffer: "slot_offer",
} as const;

export const PATIENT_MESSAGE_STATUS = {
  pending: "pending",
  sent: "sent",
  failed: "failed",
  cancelled: "cancelled",
} as const;

export type PatientMessagePurpose =
  (typeof PATIENT_MESSAGE_PURPOSE)[keyof typeof PATIENT_MESSAGE_PURPOSE];

export type PatientMessageStatus =
  (typeof PATIENT_MESSAGE_STATUS)[keyof typeof PATIENT_MESSAGE_STATUS];

export const PATIENT_MESSAGE_COPY = {
  tab: "Pós-cirurgia",
  composer: "Mensagem para o paciente",
  composerHelp:
    "Texto-padrão. Altere se o caso pedir. O envio usa o texto que estiver neste campo.",
  scheduleAt: "Data e hora do envio",
  schedule: "Agendar envio",
  sendNow: "Enviar agora",
  send: "Enviar WhatsApp",
  sendAnamnesis: "Enviar questionário por WhatsApp",
  cancel: "Cancelar",
  success: "Mensagem enviada.",
  successScheduled: "Mensagem agendada.",
  successCancelled: "Envio cancelado.",
  successAnamnesis: "Questionário enviado por WhatsApp.",
  failure: "Não foi possível enviar a mensagem.",
  emptyBody: "Escreva a mensagem antes de enviar.",
  tooLong: "Mensagem muito longa.",
  missingSchedule: "Informe a data e a hora do envio.",
  invalidSchedule: "Data e hora inválidas.",
  pastSchedule: "Escolha uma data e hora futuras.",
  forbidden: "Sem permissão para enviar WhatsApp.",
  noDestination:
    "Cadastre o telefone do paciente ou um segundo contato para enviar WhatsApp.",
  channelUnavailable: "WhatsApp da clínica indisponível. Tente mais tarde.",
  channelUnavailableInvite:
    "WhatsApp da clínica indisponível. Copie o link ou tente mais tarde.",
  scheduleHelp: "A mensagem sai até 5 minutos depois do horário.",
  statusSent: "Enviado",
  statusFailed: "Falhou",
  statusScheduled: "Agendado",
  statusCancelled: "Cancelado",
  emptyList: "Nenhuma mensagem pós-cirurgia ainda.",
  inviteBodyLead:
    "Olá. Segue o questionário de saúde da Clínica Neo Roma para preencher antes da consulta. Vale por 7 dias.",
} as const;

export const POST_SURGERY_DEFAULT_BODY = [
  "Olá. Seguem os cuidados após o procedimento na Clínica Neo Roma.",
  "",
  "Não cuspa nem faça bochecho forte nas primeiras 24 horas.",
  "Morda a gaze pelo tempo combinado.",
  "Evite alimentos quentes e esforço no dia.",
  "Se o sangramento persistir, a dor for forte ou o inchaço aumentar, ligue para a clínica.",
  "",
  "Clínica Neo Roma",
].join("\n");

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
  if (status === PATIENT_MESSAGE_STATUS.pending) {
    return PATIENT_MESSAGE_COPY.statusScheduled;
  }
  if (status === PATIENT_MESSAGE_STATUS.cancelled) {
    return PATIENT_MESSAGE_COPY.statusCancelled;
  }
  return PATIENT_MESSAGE_COPY.statusFailed;
}
