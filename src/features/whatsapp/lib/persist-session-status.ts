import { CLINIC_WHATSAPP_SESSION } from "@/features/whatsapp/domain/session-status";
import { createAdminClient } from "@/lib/supabase/admin";

export async function persistWhatsAppSessionStatus(
  sessionName: string,
  status: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("whatsapp_session_status").upsert({
    session_name: sessionName,
    status,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

export function isClinicWhatsAppSession(sessionName: string): boolean {
  return sessionName === CLINIC_WHATSAPP_SESSION;
}
