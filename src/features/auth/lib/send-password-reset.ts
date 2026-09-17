import { buildResetEmailContent } from "@/features/auth/domain/reset-email-content";
import {
  getReminderFromEmail,
  getResendClient,
} from "@/lib/email/resend-client";

export interface SendPasswordResetInput {
  email: string;
  displayName: string;
  setPasswordUrl: string;
}

export type SendPasswordResetResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "provider_error" };

export async function sendPasswordResetEmail(
  input: SendPasswordResetInput,
): Promise<SendPasswordResetResult> {
  const resend = getResendClient();
  const fromEmail = getReminderFromEmail();

  if (!resend || !fromEmail) {
    return { ok: false, reason: "not_configured" };
  }

  const content = buildResetEmailContent({
    displayName: input.displayName,
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
