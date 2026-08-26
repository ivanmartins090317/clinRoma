import { createHash, createHmac, randomBytes } from "crypto";
import { addDays, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import {
  ANAMNESIS_COPY,
  type AnamnesisInvitePurpose,
} from "@/features/records/domain/anamnesis-form-v2";

const CLINIC_TIMEZONE = "America/Sao_Paulo";
const PRE_CONSULT_DAYS = 7;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX_ATTEMPTS = 10;

const rateAttempts = new Map<string, { count: number; resetAt: number }>();

export const GENERIC_INVITE_MESSAGE = ANAMNESIS_COPY.genericInvite;

export function generateAnamnesisInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAnamnesisInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isPlainInviteTokenStored(
  value: string,
  token: string,
): boolean {
  return value === token;
}

export function computeInviteExpiresAt(
  purpose: AnamnesisInvitePurpose,
  now: Date = new Date(),
): Date {
  if (purpose === "pre_consult") {
    return new Date(now.getTime() + PRE_CONSULT_DAYS * 24 * 60 * 60 * 1000);
  }

  const zoned = toZonedTime(now, CLINIC_TIMEZONE);
  const nextMidnightLocal = startOfDay(addDays(zoned, 1));
  return fromZonedTime(nextMidnightLocal, CLINIC_TIMEZONE);
}

export function isInviteExpired(
  expiresAt: Date | string,
  now: Date = new Date(),
): boolean {
  const expires = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);

  if (Number.isNaN(expires.getTime())) return true;
  return now.getTime() >= expires.getTime();
}

export type InviteAccessState = "valid" | "invalid";

export interface InviteAccessInput {
  token?: string | null;
  tokenHash?: string | null;
  storedHash?: string | null;
  status?: "open" | "used" | "revoked" | string | null;
  expiresAt?: Date | string | null;
  usedAt?: string | null;
  now?: Date;
}

export function evaluateInviteAccess(
  input: InviteAccessInput,
): InviteAccessState {
  const token = (input.token ?? "").trim();
  if (token.length < 16) return "invalid";

  if (!input.storedHash || !input.tokenHash) return "invalid";
  if (input.storedHash !== input.tokenHash) return "invalid";
  if (input.status !== "open") return "invalid";
  if (input.usedAt) return "invalid";
  if (!input.expiresAt || isInviteExpired(input.expiresAt, input.now)) {
    return "invalid";
  }

  return "valid";
}

export function inviteAccessMessage(state: InviteAccessState): string {
  void state;
  return GENERIC_INVITE_MESSAGE;
}

export function shouldReplaceOpenInvite(existingOpen: boolean): boolean {
  return existingOpen;
}

export function hashInviteOrigin(
  origin: string,
  secret = process.env.WAITLIST_IP_HASH_SECRET,
): string | null {
  const trimmed = origin.trim();
  if (!trimmed || !secret) return null;

  return createHmac("sha256", secret).update(trimmed).digest("hex");
}

export function isInviteRateLimited(
  key: string,
  now: Date = new Date(),
): boolean {
  const entry = rateAttempts.get(key);

  if (!entry) return false;
  if (now.getTime() >= entry.resetAt) return false;
  return entry.count >= RATE_MAX_ATTEMPTS;
}

export function checkInviteRateLimit(
  key: string,
  now: Date = new Date(),
): boolean {
  const current = now.getTime();
  const entry = rateAttempts.get(key);

  if (!entry || current >= entry.resetAt) {
    rateAttempts.set(key, { count: 1, resetAt: current + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_MAX_ATTEMPTS) return false;

  entry.count += 1;
  rateAttempts.set(key, entry);
  return true;
}

export function inviteViewGuessKey(originKey: string): string {
  return `guess:view:${originKey}`;
}

export function resetInviteRateLimitForTests() {
  rateAttempts.clear();
}

export function buildAnamnesisInviteUrl(
  token: string,
  appUrl?: string,
): string {
  const base = (
    appUrl ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");

  return `${base}/anamnese/${token}`;
}

export function resolveAnamnesisInviteBaseUrl(input: {
  origin?: string | null;
  host?: string | null;
  proto?: string | null;
  fallback?: string | null;
}): string {
  const origin = input.origin?.trim();
  if (origin && /^https?:\/\//i.test(origin)) {
    return origin.replace(/\/$/, "");
  }

  const host = input.host?.trim();
  if (host) {
    const proto = input.proto === "https" ? "https" : "http";
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  return (
    input.fallback ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
