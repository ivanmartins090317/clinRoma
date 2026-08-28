import { revalidatePath } from "next/cache";

import {
  buildAnamnesisInviteUrl,
  computeInviteExpiresAt,
  generateAnamnesisInviteToken,
  hashAnamnesisInviteToken,
} from "@/features/records/lib/anamnesis-token";
import {
  PATIENT_MESSAGE_COPY,
  PATIENT_MESSAGE_PURPOSE,
  PATIENT_MESSAGE_STATUS,
  buildAnamnesisInviteWhatsAppBody,
  extractAnamnesisInviteToken,
  extractAnamnesisInviteUrl,
  shouldCallWhatsAppGateway,
  trimMessageBody,
  validatePostSurgeryBody,
  type PatientMessagePurpose,
} from "@/features/records/domain/patient-message";
import {
  resolveWhatsAppDestination,
  type ResolvedWhatsAppDestination,
} from "@/features/records/domain/whatsapp-destination";
import { canSendPatientWhatsApp } from "@/features/records/permissions";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  isWhatsAppChannelConfigured,
  maskWhatsAppDestination,
  sendWhatsApp,
} from "@/lib/whatsapp/send-whatsapp";
import type { UserRole } from "@/types/clinroma";

export interface PatientWhatsAppResult {
  success?: boolean;
  error?: string;
  inviteUrl?: string;
  messageId?: string;
}

interface DispatchInput {
  patientId: string;
  appointmentId?: string;
  purpose: PatientMessagePurpose;
  body: string;
  actorId: string;
  role: UserRole;
}

async function loadDestination(
  patientId: string,
): Promise<ResolvedWhatsAppDestination | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("contact_phone, secondary_phone, secondary_phone_note")
    .eq("id", patientId)
    .maybeSingle();

  if (!data) return null;

  return resolveWhatsAppDestination({
    contactPhone: data.contact_phone,
    secondaryPhone: data.secondary_phone,
    secondaryPhoneNote: data.secondary_phone_note,
  });
}

async function persistMessage(input: {
  patientId: string;
  appointmentId?: string;
  purpose: PatientMessagePurpose;
  destination: ResolvedWhatsAppDestination;
  body: string;
  actorId: string;
  sent: boolean;
}) {
  const supabase = await createClient();
  const sentAt = input.sent ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("patient_messages")
    .insert({
      patient_id: input.patientId,
      appointment_id: input.appointmentId ?? null,
      purpose: input.purpose,
      destination_digits: input.destination.digits,
      contact_source: input.destination.contactSource,
      body: input.body,
      status: input.sent
        ? PATIENT_MESSAGE_STATUS.sent
        : PATIENT_MESSAGE_STATUS.failed,
      error_message: input.sent ? null : PATIENT_MESSAGE_COPY.failure,
      created_by: input.actorId,
      sent_at: sentAt,
      scheduled_at: null,
      attempt_count: 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

async function auditSend(input: {
  messageId: string;
  patientId: string;
  purpose: PatientMessagePurpose;
  destination: string;
  sent: boolean;
}) {
  const result = await writeAuditLog({
    action: "create",
    entityType: "patient_messages",
    entityId: input.messageId,
    metadata: {
      purpose: input.purpose,
      patientId: input.patientId,
      destination: maskWhatsAppDestination(input.destination),
      status: input.sent
        ? PATIENT_MESSAGE_STATUS.sent
        : PATIENT_MESSAGE_STATUS.failed,
    },
  });

  if (!result.ok) {
    console.error("[audit] Falha ao registrar WhatsApp:", result.error);
  }
}

async function dispatchPatientWhatsApp(
  input: DispatchInput,
): Promise<PatientWhatsAppResult> {
  if (!canSendPatientWhatsApp(input.role)) {
    return { error: PATIENT_MESSAGE_COPY.forbidden };
  }

  if (!hasSupabaseConfig()) {
    return { error: "Supabase não configurado" };
  }

  const channelConfigured = isWhatsAppChannelConfigured();
  if (!channelConfigured || !shouldCallWhatsAppGateway(channelConfigured)) {
    return { error: PATIENT_MESSAGE_COPY.channelUnavailable };
  }

  const destination = await loadDestination(input.patientId);
  if (!destination) {
    return { error: PATIENT_MESSAGE_COPY.noDestination };
  }

  const sendResult = await sendWhatsApp({
    destino: destination.digits,
    texto: input.body,
  });

  if (!sendResult.ok && sendResult.error === "channel_absent") {
    return { error: PATIENT_MESSAGE_COPY.channelUnavailable };
  }

  const sent = sendResult.ok;
  const messageId = await persistMessage({
    patientId: input.patientId,
    appointmentId: input.appointmentId,
    purpose: input.purpose,
    destination,
    body: input.body,
    actorId: input.actorId,
    sent,
  });

  if (messageId) {
    await auditSend({
      messageId,
      patientId: input.patientId,
      purpose: input.purpose,
      destination: destination.digits,
      sent,
    });
  }

  revalidatePath(`/pacientes/${input.patientId}`);

  if (!sent) {
    return {
      error: PATIENT_MESSAGE_COPY.failure,
      messageId: messageId ?? undefined,
    };
  }

  return { success: true, messageId: messageId ?? undefined };
}

async function findReusablePreConsultUrl(
  patientId: string,
  tokenHash: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("patient_messages")
    .select("body")
    .eq("patient_id", patientId)
    .eq("purpose", PATIENT_MESSAGE_PURPOSE.anamnesisInvite)
    .eq("status", PATIENT_MESSAGE_STATUS.sent)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const url = data?.body ? extractAnamnesisInviteUrl(data.body) : null;
  const token = url ? extractAnamnesisInviteToken(url) : null;
  if (!token) return null;
  if (hashAnamnesisInviteToken(token) !== tokenHash) return null;
  return url;
}

async function ensurePreConsultInviteUrl(input: {
  patientId: string;
  actorId: string;
  inviteBaseUrl: string;
}): Promise<string | null> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("anamnesis_invites")
    .select("id, token_hash")
    .eq("patient_id", input.patientId)
    .eq("purpose", "pre_consult")
    .eq("status", "open")
    .maybeSingle();

  if (existing) {
    const reused = await findReusablePreConsultUrl(
      input.patientId,
      existing.token_hash,
    );
    if (reused) return reused;
  }

  const token = generateAnamnesisInviteToken();
  const tokenHash = hashAnamnesisInviteToken(token);
  const expiresAt = computeInviteExpiresAt("pre_consult").toISOString();
  const now = new Date().toISOString();

  const persisted = existing
    ? await supabase
        .from("anamnesis_invites")
        .update({
          token_hash: tokenHash,
          expires_at: expiresAt,
          used_at: null,
          updated_at: now,
        })
        .eq("id", existing.id)
        .eq("status", "open")
        .select("id")
        .single()
    : await supabase
        .from("anamnesis_invites")
        .insert({
          patient_id: input.patientId,
          purpose: "pre_consult",
          token_hash: tokenHash,
          status: "open",
          expires_at: expiresAt,
          created_by: input.actorId,
        })
        .select("id")
        .single();

  if (persisted.error || !persisted.data) {
    return null;
  }

  return buildAnamnesisInviteUrl(token, input.inviteBaseUrl);
}

export async function sendPostSurgeryWhatsApp(input: {
  patientId: string;
  appointmentId?: string;
  body: string;
  actorId: string;
  role: UserRole;
}): Promise<PatientWhatsAppResult> {
  const bodyError = validatePostSurgeryBody(input.body);
  if (bodyError) return { error: bodyError };

  return dispatchPatientWhatsApp({
    ...input,
    purpose: PATIENT_MESSAGE_PURPOSE.postSurgery,
    body: trimMessageBody(input.body),
  });
}

export async function sendAnamnesisInviteWhatsApp(input: {
  patientId: string;
  appointmentId?: string;
  actorId: string;
  role: UserRole;
  inviteBaseUrl: string;
}): Promise<PatientWhatsAppResult> {
  if (!canSendPatientWhatsApp(input.role)) {
    return { error: PATIENT_MESSAGE_COPY.forbidden };
  }

  if (!hasSupabaseConfig()) {
    return { error: "Supabase não configurado" };
  }

  if (!isWhatsAppChannelConfigured()) {
    return { error: PATIENT_MESSAGE_COPY.channelUnavailable };
  }

  const destination = await loadDestination(input.patientId);
  if (!destination) {
    return { error: PATIENT_MESSAGE_COPY.noDestination };
  }

  const inviteUrl = await ensurePreConsultInviteUrl({
    patientId: input.patientId,
    actorId: input.actorId,
    inviteBaseUrl: input.inviteBaseUrl,
  });

  if (!inviteUrl) {
    return { error: PATIENT_MESSAGE_COPY.failure };
  }

  const result = await dispatchPatientWhatsApp({
    patientId: input.patientId,
    appointmentId: input.appointmentId,
    purpose: PATIENT_MESSAGE_PURPOSE.anamnesisInvite,
    body: buildAnamnesisInviteWhatsAppBody(inviteUrl),
    actorId: input.actorId,
    role: input.role,
  });

  return { ...result, inviteUrl };
}
