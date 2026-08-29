import { CLINIC_WHATSAPP_SESSION } from "@/features/whatsapp/domain/session-status";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getClinicWhatsAppSessionStatus(): Promise<string | null> {
  if (!hasSupabaseConfig()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_session_status")
    .select("status")
    .eq("session_name", CLINIC_WHATSAPP_SESSION)
    .maybeSingle();

  if (error || !data) return null;

  return data.status;
}
