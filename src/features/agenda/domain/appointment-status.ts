import type { AppointmentStatus } from "@/types/clinroma";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em atendimento",
  completed: "Concluído",
  no_show: "Faltou",
  cancelled: "Cancelado",
  rescheduled: "Remarcado",
};

export const INACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "cancelled",
  "rescheduled",
];

export function isActiveAppointmentStatus(status: AppointmentStatus): boolean {
  return !INACTIVE_APPOINTMENT_STATUSES.includes(status);
}

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_LABELS[status];
}

export const WRITABLE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
];
