import { createHmac, timingSafeEqual } from "crypto";

export const WHATSAPP_WEBHOOK_HMAC_HEADER = "x-webhook-hmac";

export function readWhatsAppWebhookSecret(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const secret = env.WHATSAPP_WEBHOOK_SECRET?.trim() ?? "";
  const cronSecret = env.CRON_SECRET?.trim() ?? "";

  if (!secret) return null;
  if (cronSecret && secret === cronSecret) return null;

  return secret;
}

export function verifyWebhookHmac(
  rawBody: string,
  headerValue: string | null | undefined,
  secret: string,
): boolean {
  if (!secret || !headerValue?.trim()) return false;

  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const provided = headerValue.trim().toLowerCase();

  if (provided.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}
