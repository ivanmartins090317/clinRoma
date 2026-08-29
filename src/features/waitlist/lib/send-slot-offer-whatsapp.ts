import {
  PATIENT_MESSAGE_COPY,
  PATIENT_MESSAGE_PURPOSE,
  PATIENT_MESSAGE_STATUS,
} from "@/features/records/domain/patient-message";
import {
  resolveWhatsAppDestination,
  type ResolvedWhatsAppDestination,
} from "@/features/records/domain/whatsapp-destination";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { createClient } from "@/lib/supabase/server";
import {
  maskWhatsAppDestination,
  sendWhatsApp,
  type SendWhatsAppResult,
} from "@/lib/whatsapp/send-whatsapp";
import {
  buildSlotOfferWhatsAppBody,
  type WhatsappDeliveryStatus,
} from "@/features/waitlist/domain/slot-offer-whatsapp";

export interface SendSlotOfferWhatsAppInput {
  patientId: string;
  actorId: string;
  offerUrl: string;
  startsAt: string;
  dentistName: string;
}

export interface SendSlotOfferWhatsAppResult {
  status: WhatsappDeliveryStatus;
  messageId?: string;
}

export interface PersistSlotOfferMessageInput {
  patientId: string;
  actorId: string;
  destination: ResolvedWhatsAppDestination;
  body: string;
  sent: boolean;
}

export interface SendSlotOfferWhatsAppDeps {
  loadDestination?: (
    patientId: string,
  ) => Promise<ResolvedWhatsAppDestination | null>;
  send?: (input: {
    destino: string;
    texto: string;
  }) => Promise<SendWhatsAppResult>;
  persist?: (input: PersistSlotOfferMessageInput) => Promise<string | null>;
  audit?: (input: {
    messageId: string;
    patientId: string;
    destination: string;
    sent: boolean;
  }) => Promise<void>;
}

export function buildSlotOfferMessageInsert(
  input: PersistSlotOfferMessageInput,
  nowIso: string,
) {
  return {
    patient_id: input.patientId,
    appointment_id: null,
    purpose: PATIENT_MESSAGE_PURPOSE.slotOffer,
    destination_digits: input.destination.digits,
    contact_source: input.destination.contactSource,
    body: input.body,
    status: input.sent
      ? PATIENT_MESSAGE_STATUS.sent
      : PATIENT_MESSAGE_STATUS.pending,
    error_message: input.sent ? null : PATIENT_MESSAGE_COPY.failure,
    created_by: input.actorId,
    sent_at: input.sent ? nowIso : null,
    scheduled_at: input.sent ? null : nowIso,
    attempt_count: 0,
  };
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

async function persistSlotOfferMessage(
  input: PersistSlotOfferMessageInput,
): Promise<string | null> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("patient_messages")
    .insert(buildSlotOfferMessageInsert(input, nowIso))
    .select("id")
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

async function auditSlotOfferSend(input: {
  messageId: string;
  patientId: string;
  destination: string;
  sent: boolean;
}) {
  const result = await writeAuditLog({
    action: "create",
    entityType: "patient_messages",
    entityId: input.messageId,
    metadata: {
      purpose: PATIENT_MESSAGE_PURPOSE.slotOffer,
      patientId: input.patientId,
      destination: maskWhatsAppDestination(input.destination),
      status: input.sent
        ? PATIENT_MESSAGE_STATUS.sent
        : PATIENT_MESSAGE_STATUS.pending,
    },
  });

  if (!result.ok) {
    console.error("[audit] Falha ao registrar WhatsApp da fila:", result.error);
  }
}

export async function sendSlotOfferWhatsApp(
  input: SendSlotOfferWhatsAppInput,
  deps: SendSlotOfferWhatsAppDeps = {},
): Promise<SendSlotOfferWhatsAppResult> {
  const destination = await (deps.loadDestination ?? loadDestination)(
    input.patientId,
  );

  if (!destination) {
    return { status: "skipped" };
  }

  const body = buildSlotOfferWhatsAppBody({
    offerUrl: input.offerUrl,
    startsAt: input.startsAt,
    dentistName: input.dentistName,
  });

  const sendResult = await (deps.send ?? sendWhatsApp)({
    destino: destination.digits,
    texto: body,
  });

  const sent = sendResult.ok;
  const persist = deps.persist ?? persistSlotOfferMessage;
  const messageId = await persist({
    patientId: input.patientId,
    actorId: input.actorId,
    destination,
    body,
    sent,
  });

  if (messageId) {
    await (deps.audit ?? auditSlotOfferSend)({
      messageId,
      patientId: input.patientId,
      destination: destination.digits,
      sent,
    });
  }

  return {
    status: sent ? "sent" : "queued",
    messageId: messageId ?? undefined,
  };
}

export async function cancelPendingSlotOfferMessages(
  patientId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("patient_messages")
    .update({
      status: PATIENT_MESSAGE_STATUS.cancelled,
      error_message: null,
    })
    .eq("patient_id", patientId)
    .eq("purpose", PATIENT_MESSAGE_PURPOSE.slotOffer)
    .eq("status", PATIENT_MESSAGE_STATUS.pending);
}
