export const MAX_FINANCE_ALERT_ATTEMPTS = 3;

export function getFinanceAlertBackoffMinutesAfterAttempt(
  attemptCount: number,
): number | null {
  if (attemptCount >= MAX_FINANCE_ALERT_ATTEMPTS) {
    return null;
  }

  if (attemptCount === 1) {
    return 5;
  }

  if (attemptCount === 2) {
    return 15;
  }

  return 0;
}

export function getFinanceAlertNextAttemptAt(
  attemptCount: number,
  from: Date = new Date(),
): Date | null {
  const backoffMinutes =
    getFinanceAlertBackoffMinutesAfterAttempt(attemptCount);

  if (backoffMinutes === null) {
    return null;
  }

  return new Date(from.getTime() + backoffMinutes * 60_000);
}

export function shouldMarkFinanceAlertFailed(attemptCount: number): boolean {
  return attemptCount >= MAX_FINANCE_ALERT_ATTEMPTS;
}
