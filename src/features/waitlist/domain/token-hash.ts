import { createHash, randomBytes } from "crypto";

export function generateSlotOfferToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSlotOfferToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isPlainTokenStored(value: string, token: string): boolean {
  return value === token;
}
