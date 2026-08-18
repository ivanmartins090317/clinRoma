export const MAX_REMINDER_ATTEMPTS = 3;

export function getBackoffMinutesAfterAttempt(
  attemptCount: number,
): number | null {
  if (attemptCount >= MAX_REMINDER_ATTEMPTS) {
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

export function getNextAttemptAt(
  attemptCount: number,
  from: Date = new Date(),
): Date | null {
  const backoffMinutes = getBackoffMinutesAfterAttempt(attemptCount);

  if (backoffMinutes === null) {
    return null;
  }

  return new Date(from.getTime() + backoffMinutes * 60_000);
}

export function shouldMarkReminderFailed(attemptCount: number): boolean {
  return attemptCount >= MAX_REMINDER_ATTEMPTS;
}
