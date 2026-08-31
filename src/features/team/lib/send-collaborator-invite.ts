import { buildInviteEmailContent } from "@/features/team/domain/invite-email-content";
import { getReminderFromEmail, getResendClient } from "@/lib/email/resend-client";
import type { UserRole } from "@/types/clinroma";

export interface SendCollaboratorInviteInput {
  email: string;
  displayName: string;
  role: UserRole;
  setPasswordUrl: string;
}

export type SendInviteResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "provider_error" };

export async function sendCollaboratorInvite(
  input: SendCollaboratorInviteInput,
): Promise<SendInviteResult> {
  const resend = getResendClient();
  const fromEmail = getReminderFromEmail();

  if (!resend || !fromEmail) {
    return { ok: false, reason: "not_configured" };
  }

  const content = buildInviteEmailContent({
    displayName: input.displayName,
    role: input.role,
    setPasswordUrl: input.setPasswordUrl,
  });

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: input.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  if (error) {
    return { ok: false, reason: "provider_error" };
  }

  return { ok: true };
}
