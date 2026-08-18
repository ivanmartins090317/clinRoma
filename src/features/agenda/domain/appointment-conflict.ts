import type { AppointmentStatus } from "@/types/clinroma";

import { isActiveAppointmentStatus } from "./appointment-status";

export interface AppointmentInterval {
  id: string;
  dentistId: string;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
}

export interface ConflictCheckInput {
  dentistId: string;
  startsAt: Date;
  endsAt: Date;
  excludeId?: string;
}

function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function hasAppointmentConflict(
  candidate: ConflictCheckInput,
  existing: AppointmentInterval[],
): boolean {
  return findConflictingAppointments(candidate, existing).length > 0;
}

export function findConflictingAppointments(
  candidate: ConflictCheckInput,
  existing: AppointmentInterval[],
): AppointmentInterval[] {
  if (candidate.endsAt <= candidate.startsAt) {
    return [];
  }

  return existing.filter((appointment) => {
    if (appointment.id === candidate.excludeId) {
      return false;
    }

    if (appointment.dentistId !== candidate.dentistId) {
      return false;
    }

    if (!isActiveAppointmentStatus(appointment.status)) {
      return false;
    }

    return intervalsOverlap(
      candidate.startsAt,
      candidate.endsAt,
      appointment.startsAt,
      appointment.endsAt,
    );
  });
}

export function formatConflictMessage(dentistName: string): string {
  return `Horário indisponível para ${dentistName}`;
}
