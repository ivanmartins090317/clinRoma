"use server";

import { revalidatePath } from "next/cache";

import {
  CLINIC_WHATSAPP_SESSION,
  WHATSAPP_SESSION_STATUS,
} from "@/features/whatsapp/domain/session-status";
import { persistWhatsAppSessionStatus } from "@/features/whatsapp/lib/persist-session-status";
import {
  fetchWahaSessionStatus,
  logoutWahaSession,
  startWahaSession,
} from "@/features/whatsapp/lib/waha-session";
import {
  refuseWhatsAppWrite,
  WHATSAPP_COPY,
} from "@/features/whatsapp/permissions";
import { requireAuthSession } from "@/lib/auth/session";

export interface WhatsAppSessionActionResult {
  error?: string;
}

async function assertWhatsAppWrite(): Promise<WhatsAppSessionActionResult> {
  const session = await requireAuthSession("/whatsapp");
  const refused = refuseWhatsAppWrite(session.profile.role);

  if (refused) {
    return { error: refused };
  }

  return {};
}

function revalidateWhatsAppSurfaces() {
  revalidatePath("/whatsapp");
  revalidatePath("/hoje");
  revalidatePath("/", "layout");
}

async function persistGatewayStatus(): Promise<boolean> {
  const result = await fetchWahaSessionStatus();
  if (!result.ok) return false;

  await persistWhatsAppSessionStatus(CLINIC_WHATSAPP_SESSION, result.status);
  return true;
}

export async function startClinicWhatsAppSession(): Promise<WhatsAppSessionActionResult> {
  const gate = await assertWhatsAppWrite();
  if (gate.error) return gate;

  const result = await startWahaSession();
  if (!result.ok) {
    return { error: WHATSAPP_COPY.channelUnavailable };
  }

  await persistGatewayStatus();
  return {};
}

export async function startWhatsAppSessionAction(): Promise<WhatsAppSessionActionResult> {
  const result = await startClinicWhatsAppSession();
  if (!result.error) revalidateWhatsAppSurfaces();
  return result;
}

export async function syncClinicWhatsAppSessionStatus(): Promise<WhatsAppSessionActionResult> {
  const gate = await assertWhatsAppWrite();
  if (gate.error) return gate;

  const persisted = await persistGatewayStatus();
  if (!persisted) {
    return { error: WHATSAPP_COPY.channelUnavailable };
  }

  return {};
}

export async function disconnectWhatsAppSessionAction(): Promise<WhatsAppSessionActionResult> {
  const gate = await assertWhatsAppWrite();
  if (gate.error) return gate;

  const result = await logoutWahaSession();
  if (!result.ok) {
    return { error: WHATSAPP_COPY.channelUnavailable };
  }

  await persistWhatsAppSessionStatus(
    CLINIC_WHATSAPP_SESSION,
    WHATSAPP_SESSION_STATUS.STOPPED,
  );
  revalidateWhatsAppSurfaces();
  return {};
}
