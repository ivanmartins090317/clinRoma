import type { AppointmentStatus } from "@/types/clinroma";

export function shouldEnqueueReminder(status: AppointmentStatus): boolean {
  return status === "completed";
}

export function canProcessReminder(input: {
  status: "pending" | "sent" | "failed";
  attemptCount: number;
  nextAttemptAt: Date;
  now?: Date;
}): boolean {
  if (input.status === "sent") {
    return false;
  }

  if (input.status === "failed") {
    return false;
  }

  if (input.attemptCount >= 3) {
    return false;
  }

  const now = input.now ?? new Date();
  return input.nextAttemptAt.getTime() <= now.getTime();
}
