"use server";

import { z } from "zod";

import { resolveWhatsAppDestination } from "@/features/records/domain/whatsapp-destination";
import type { PatientPhonesInput } from "@/features/records/domain/whatsapp-destination";
import {
  PATIENT_WHATSAPP_CHAT_COPY,
  buildPatientWhatsAppChatUrl,
} from "@/features/whatsapp/domain/chat-link";
import { isSessionWorking } from "@/features/whatsapp/domain/session-status";
import {
  checkWhatsAppNumber,
  type CheckWhatsAppNumberResult,
} from "@/features/whatsapp/lib/check-whatsapp-number";
import { canReadWhatsAppSessionStatus } from "@/features/whatsapp/permissions";
import { getClinicWhatsAppSessionStatus } from "@/features/whatsapp/queries";
import { requireAuthSession, type AuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const openPatientChatSchema = z.object({
  patientId: z.string().uuid("Paciente inválido."),
});

export type OpenPatientWhatsAppChatResult =
  | { url: string; notice: string | null }
  | { error: string };

export interface OpenPatientWhatsAppChatDeps {
  requireSession?: () => Promise<AuthSession>;
  readPatientPhones?: (patientId: string) => Promise<PatientPhonesInput | null>;
  readSessionStatus?: () => Promise<string | null>;
  checkNumber?: (digits: string) => Promise<CheckWhatsAppNumberResult>;
}

function isFn<T extends (...args: never[]) => unknown>(value: unknown): value is T {
  return typeof value === "function";
}

async function readPatientPhones(
  patientId: string,
): Promise<PatientPhonesInput | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("contact_phone, secondary_phone, secondary_phone_note")
    .eq("id", patientId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    contactPhone: data.contact_phone,
    secondaryPhone: data.secondary_phone,
    secondaryPhoneNote: data.secondary_phone_note,
  };
}

function chatFromCheck(
  digits: string,
  contactSource: "patient_phone" | "secondary_phone",
  check: CheckWhatsAppNumberResult,
): OpenPatientWhatsAppChatResult {
  if (check.status === "session_down") {
    return { error: PATIENT_WHATSAPP_CHAT_COPY.sessionDown };
  }

  if (check.status === "channel_unavailable") {
    return { error: PATIENT_WHATSAPP_CHAT_COPY.channelUnavailable };
  }

  if (check.status === "missing") {
    return { error: PATIENT_WHATSAPP_CHAT_COPY.numberMissing };
  }

  const url = buildPatientWhatsAppChatUrl(digits);
  if (!url) {
    return { error: PATIENT_WHATSAPP_CHAT_COPY.phoneMissing };
  }

  return {
    url,
    notice:
      contactSource === "secondary_phone"
        ? PATIENT_WHATSAPP_CHAT_COPY.openingSecondary
        : null,
  };
}

export async function openPatientWhatsAppChatAction(
  input: { patientId: string },
  deps: OpenPatientWhatsAppChatDeps = {},
): Promise<OpenPatientWhatsAppChatResult> {
  const requireSession = isFn<() => Promise<AuthSession>>(deps.requireSession)
    ? deps.requireSession
    : () => requireAuthSession("/agenda");
  const session = await requireSession();

  if (!canReadWhatsAppSessionStatus(session.profile.role)) {
    return { error: PATIENT_WHATSAPP_CHAT_COPY.refused };
  }

  const parsed = openPatientChatSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Paciente inválido." };
  }

  const readPhones = isFn<(patientId: string) => Promise<PatientPhonesInput | null>>(
    deps.readPatientPhones,
  )
    ? deps.readPatientPhones
    : readPatientPhones;
  const phones = await readPhones(parsed.data.patientId);
  if (!phones) {
    return { error: PATIENT_WHATSAPP_CHAT_COPY.patientUnavailable };
  }

  const destination = resolveWhatsAppDestination(phones);
  if (!destination) {
    return { error: PATIENT_WHATSAPP_CHAT_COPY.phoneMissing };
  }

  const readStatus = isFn<() => Promise<string | null>>(deps.readSessionStatus)
    ? deps.readSessionStatus
    : getClinicWhatsAppSessionStatus;
  const status = await readStatus();
  if (!isSessionWorking(status)) {
    return { error: PATIENT_WHATSAPP_CHAT_COPY.sessionDown };
  }

  const checkNumber = isFn<(digits: string) => Promise<CheckWhatsAppNumberResult>>(
    deps.checkNumber,
  )
    ? deps.checkNumber
    : checkWhatsAppNumber;

  const check = await checkNumber(destination.digits);
  return chatFromCheck(destination.digits, destination.contactSource, check);
}
