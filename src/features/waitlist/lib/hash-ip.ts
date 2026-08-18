import { createHmac } from "crypto";

export function hashClientIp(
  ip: string,
  secret = process.env.WAITLIST_IP_HASH_SECRET,
): string {
  if (!secret) {
    throw new Error("WAITLIST_IP_HASH_SECRET não configurado");
  }

  return createHmac("sha256", secret).update(ip.trim()).digest("hex");
}

export function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}
