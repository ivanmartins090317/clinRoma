import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

import {
  PATIENT_MESSAGE_COPY,
  PATIENT_MESSAGE_PURPOSE,
  PATIENT_MESSAGE_STATUS,
  type PatientMessagePurpose,
  type PatientMessageStatus,
} from "@/features/records/domain/patient-message";

export const CLINIC_TIMEZONE = "America/Sao_Paulo";
export const POST_SURGERY_MAX_ATTEMPTS = 3;
export const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/;

export interface ScheduledMessageDueInput {
  purpose: PatientMessagePurpose | string;
  status: PatientMessageStatus | string;
  scheduledAt: Date | string | null;
  attemptCount: number;
  now?: Date;
}

export function parseClinicDateTimeLocal(value: string): Date | null {
  const match = DATETIME_LOCAL_PATTERN.exec(value.trim());
  if (!match) return null;

  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour > 23 || minute > 59) return null;

  const utc = fromZonedTime(
    `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00`,
    CLINIC_TIMEZONE,
  );

  if (Number.isNaN(utc.getTime())) return null;
  return utc;
}

export function validateScheduledAt(
  scheduledAt: Date,
  now: Date = new Date(),
): string | null {
  if (Number.isNaN(scheduledAt.getTime())) {
    return PATIENT_MESSAGE_COPY.invalidSchedule;
  }
  if (scheduledAt.getTime() <= now.getTime()) {
    return PATIENT_MESSAGE_COPY.pastSchedule;
  }
  return null;
}

export function validateScheduleInput(
  datetimeLocal: string,
  now: Date = new Date(),
): { error: string } | { scheduledAt: Date } {
  const trimmed = datetimeLocal.trim();
  if (!trimmed) {
    return { error: PATIENT_MESSAGE_COPY.missingSchedule };
  }

  const scheduledAt = parseClinicDateTimeLocal(trimmed);
  if (!scheduledAt) {
    return { error: PATIENT_MESSAGE_COPY.invalidSchedule };
  }

  const error = validateScheduledAt(scheduledAt, now);
  if (error) return { error };
  return { scheduledAt };
}

export const RETRYABLE_MESSAGE_PURPOSES = [
  PATIENT_MESSAGE_PURPOSE.postSurgery,
  PATIENT_MESSAGE_PURPOSE.slotOffer,
] as const;

export function isRetryableMessagePurpose(
  purpose: PatientMessagePurpose | string,
): boolean {
  return (
    purpose === PATIENT_MESSAGE_PURPOSE.postSurgery ||
    purpose === PATIENT_MESSAGE_PURPOSE.slotOffer
  );
}

export function isDueScheduledMessage(
  input: ScheduledMessageDueInput,
): boolean {
  if (!isRetryableMessagePurpose(input.purpose)) return false;
  if (input.status !== PATIENT_MESSAGE_STATUS.pending) return false;
  if (input.attemptCount >= POST_SURGERY_MAX_ATTEMPTS) return false;
  if (!input.scheduledAt) return false;

  const scheduled =
    input.scheduledAt instanceof Date
      ? input.scheduledAt
      : new Date(input.scheduledAt);
  if (Number.isNaN(scheduled.getTime())) return false;

  const now = input.now ?? new Date();
  return scheduled.getTime() <= now.getTime();
}

export function nextStatusAfterSendAttempt(input: {
  sent: boolean;
  attemptCount: number;
}): PatientMessageStatus {
  if (input.sent) return PATIENT_MESSAGE_STATUS.sent;
  if (input.attemptCount >= POST_SURGERY_MAX_ATTEMPTS) {
    return PATIENT_MESSAGE_STATUS.failed;
  }
  return PATIENT_MESSAGE_STATUS.pending;
}

export function canCancelScheduledMessage(
  status: PatientMessageStatus,
): boolean {
  return status === PATIENT_MESSAGE_STATUS.pending;
}

export function formatScheduledAtLabel(iso: string): string {
  return formatInTimeZone(new Date(iso), CLINIC_TIMEZONE, "dd/MM/yyyy, HH:mm");
}
