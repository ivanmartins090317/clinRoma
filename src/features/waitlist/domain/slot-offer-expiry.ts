export const SLOT_OFFER_VALIDITY_MINUTES = 40;

export function computeSlotOfferExpiresAt(
  createdAt: Date,
  validityMinutes = SLOT_OFFER_VALIDITY_MINUTES,
): Date {
  return new Date(createdAt.getTime() + validityMinutes * 60 * 1000);
}

export function isSlotOfferExpired(
  expiresAt: Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() >= expiresAt.getTime();
}

export function getSlotOfferRemainingMs(
  expiresAt: Date,
  now: Date = new Date(),
): number {
  return Math.max(0, expiresAt.getTime() - now.getTime());
}
