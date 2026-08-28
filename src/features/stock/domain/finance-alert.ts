export interface SupplyQuantitySnapshot {
  currentQuantity: number;
  minimumQuantity: number;
}

export type FinanceAlertStatus = "pending" | "sent" | "failed" | "cancelled";

export function needsReplenishment(input: SupplyQuantitySnapshot): boolean {
  return (
    input.minimumQuantity > 0 && input.currentQuantity < input.minimumQuantity
  );
}

export function didEnterReplenishment(
  before: SupplyQuantitySnapshot,
  after: SupplyQuantitySnapshot,
): boolean {
  return !needsReplenishment(before) && needsReplenishment(after);
}

export function didLeaveReplenishment(
  before: SupplyQuantitySnapshot,
  after: SupplyQuantitySnapshot,
): boolean {
  return needsReplenishment(before) && !needsReplenishment(after);
}

export function isValidFinanceAlertDestination(
  value: string | null | undefined,
): value is string {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function hasOpenEpisodeAlert(input: {
  status: FinanceAlertStatus;
  episodeClosedAt: string | null;
}): boolean {
  return input.episodeClosedAt === null && input.status !== "cancelled";
}

export function shouldEnqueueFinanceAlert(input: {
  enteredReplenishment: boolean;
  destinationValid: boolean;
  hasOpenEpisode: boolean;
}): boolean {
  return (
    input.enteredReplenishment &&
    input.destinationValid &&
    !input.hasOpenEpisode
  );
}

export function shouldCancelPendingFinanceAlert(input: {
  leftReplenishment: boolean;
  hasOpenPending: boolean;
}): boolean {
  return input.leftReplenishment && input.hasOpenPending;
}

export function shouldCreateAlertOnScan(input: {
  needsReplenishment: boolean;
  destinationValid: boolean;
  hasOpenEpisode: boolean;
}): boolean {
  return (
    input.needsReplenishment && input.destinationValid && !input.hasOpenEpisode
  );
}

export function shouldCallEmailProvider(destinationValid: boolean): boolean {
  return destinationValid;
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const separator = trimmed.indexOf("@");

  if (separator <= 0 || separator === trimmed.length - 1) {
    return "***";
  }

  const local = trimmed.slice(0, separator);
  const domain = trimmed.slice(separator + 1);

  return `${local.slice(0, 1)}***@${domain}`;
}

export function canProcessFinanceAlert(input: {
  status: FinanceAlertStatus;
  attemptCount: number;
  nextAttemptAt: Date;
  now?: Date;
}): boolean {
  if (input.status !== "pending") {
    return false;
  }

  if (input.attemptCount >= 3) {
    return false;
  }

  const now = input.now ?? new Date();
  return input.nextAttemptAt.getTime() <= now.getTime();
}
