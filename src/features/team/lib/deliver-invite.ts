import { TEAM_COPY } from "@/features/team/domain/team-guards";
import { createSetPasswordLink } from "@/features/team/lib/provision-collaborator";
import { sendCollaboratorInvite } from "@/features/team/lib/send-collaborator-invite";
import type { UserRole } from "@/types/clinroma";

export type DeliveryFailure =
  | "link_failed"
  | "not_configured"
  | "provider_error";

export type DeliveryResult = { ok: true } | { ok: false; reason: DeliveryFailure };

export interface DeliverInviteInput {
  email: string;
  displayName: string;
  role: UserRole;
}

export function describeDeliveryFailure(reason: DeliveryFailure): string {
  if (reason === "not_configured") {
    return TEAM_COPY.emailServiceOff;
  }

  if (reason === "link_failed") {
    return "Não foi possível gerar o link de senha.";
  }

  return "O e-mail de convite não saiu.";
}

export async function deliverInvite(
  input: DeliverInviteInput,
): Promise<DeliveryResult> {
  const setPasswordUrl = await createSetPasswordLink(input.email);

  if (!setPasswordUrl) {
    return { ok: false, reason: "link_failed" };
  }

  const sent = await sendCollaboratorInvite({ ...input, setPasswordUrl });

  if (!sent.ok) {
    return { ok: false, reason: sent.reason };
  }

  return { ok: true };
}
