import { createClient } from "@/lib/supabase/server";

export interface AuditLogInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  actorId?: string | null;
}

export interface AuditLogResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function writeAuditLog(
  input: AuditLogInput,
): Promise<AuditLogResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const actorId = input.actorId ?? user?.id ?? null;

  const { data, error } = await supabase
    .from("audit_log")
    .insert({
      actor_id: actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data.id };
}
