"use server";

import {
  cancelPostSurgeryWhatsApp,
  schedulePostSurgeryWhatsApp,
} from "@/features/records/lib/schedule-post-surgery-whatsapp";
import { sendPostSurgeryWhatsApp } from "@/features/records/lib/send-patient-whatsapp";
import {
  cancelPostSurgeryWhatsAppSchema,
  schedulePostSurgeryWhatsAppSchema,
  sendPostSurgeryWhatsAppSchema,
} from "@/features/records/schemas";
import { requireAuthSession } from "@/lib/auth/session";

export interface PostSurgeryWhatsAppActionResult {
  success?: boolean;
  error?: string;
  messageId?: string;
}

export async function sendPostSurgeryWhatsAppAction(
  input: unknown,
): Promise<PostSurgeryWhatsAppActionResult> {
  try {
    const session = await requireAuthSession("/pacientes");
    const parsed = sendPostSurgeryWhatsAppSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    return sendPostSurgeryWhatsApp({
      patientId: parsed.data.patientId,
      appointmentId: parsed.data.appointmentId,
      body: parsed.data.body,
      actorId: session.userId,
      role: session.profile.role,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a mensagem.",
    };
  }
}

export async function schedulePostSurgeryWhatsAppAction(
  input: unknown,
): Promise<PostSurgeryWhatsAppActionResult> {
  try {
    const session = await requireAuthSession("/pacientes");
    const parsed = schedulePostSurgeryWhatsAppSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    return schedulePostSurgeryWhatsApp({
      patientId: parsed.data.patientId,
      appointmentId: parsed.data.appointmentId,
      body: parsed.data.body,
      datetimeLocal: parsed.data.datetimeLocal,
      actorId: session.userId,
      role: session.profile.role,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível agendar a mensagem.",
    };
  }
}

export async function cancelPostSurgeryWhatsAppAction(
  input: unknown,
): Promise<PostSurgeryWhatsAppActionResult> {
  try {
    const session = await requireAuthSession("/pacientes");
    const parsed = cancelPostSurgeryWhatsAppSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    return cancelPostSurgeryWhatsApp({
      messageId: parsed.data.messageId,
      patientId: parsed.data.patientId,
      actorId: session.userId,
      role: session.profile.role,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar o envio.",
    };
  }
}
