"use server";

import { revalidatePath } from "next/cache";

import {
  refuseWhatsAppWrite,
  WHATSAPP_COPY,
} from "@/features/whatsapp/permissions";
import {
  logoutWahaSession,
  startWahaSession,
} from "@/features/whatsapp/lib/waha-session";
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

export async function startClinicWhatsAppSession(): Promise<WhatsAppSessionActionResult> {
  const gate = await assertWhatsAppWrite();
  if (gate.error) return gate;

  const result = await startWahaSession();
  if (!result.ok) {
    return { error: WHATSAPP_COPY.channelUnavailable };
  }

  revalidateWhatsAppSurfaces();
  return {};
}

export async function startWhatsAppSessionAction(): Promise<WhatsAppSessionActionResult> {
  return startClinicWhatsAppSession();
}

export async function disconnectWhatsAppSessionAction(): Promise<WhatsAppSessionActionResult> {
  const gate = await assertWhatsAppWrite();
  if (gate.error) return gate;

  const result = await logoutWahaSession();
  if (!result.ok) {
    return { error: WHATSAPP_COPY.channelUnavailable };
  }

  revalidateWhatsAppSurfaces();
  return {};
}
