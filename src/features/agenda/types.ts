import type { AppointmentStatus } from "@/types/clinroma";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import {
  addDays,
  endOfDay,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";

export interface AgendaDentist {
  id: string;
  fullName: string;
  calendarColor: string;
}

export interface AgendaPatientOption {
  id: string;
  fullName: string;
  cpf: string | null;
}

export interface AgendaAppointment {
  id: string;
  patientId: string;
  patientName: string;
  dentistId: string;
  dentistName: string;
  dentistColor: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  procedureName: string | null;
  notes: string | null;
}

export interface AgendaCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  dentistColor: string;
  status: AppointmentStatus;
  patientName: string;
  procedureName: string | null;
}

export interface AgendaDayGroup {
  dentist: AgendaDentist;
  appointments: AgendaAppointment[];
}

export const CLINIC_TIMEZONE = "America/Sao_Paulo";

export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60;

export function parseClinicDateParam(dateParam: string | undefined): Date {
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return toZonedTime(`${dateParam}T12:00:00`, CLINIC_TIMEZONE);
  }

  return toZonedTime(new Date(), CLINIC_TIMEZONE);
}

export function formatClinicDate(date: Date): string {
  return format(toZonedTime(date, CLINIC_TIMEZONE), "yyyy-MM-dd");
}

export function clinicDayBounds(date: Date): { start: string; end: string } {
  const zoned = toZonedTime(date, CLINIC_TIMEZONE);
  const dayStart = startOfDay(zoned);
  const dayEnd = endOfDay(zoned);

  return {
    start: fromZonedTime(dayStart, CLINIC_TIMEZONE).toISOString(),
    end: fromZonedTime(dayEnd, CLINIC_TIMEZONE).toISOString(),
  };
}

export function clinicWeekBounds(date: Date): { start: string; end: string } {
  const zoned = toZonedTime(date, CLINIC_TIMEZONE);
  const weekStart = startOfWeek(zoned, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(zoned, { weekStartsOn: 0 });

  return {
    start: fromZonedTime(weekStart, CLINIC_TIMEZONE).toISOString(),
    end: fromZonedTime(weekEnd, CLINIC_TIMEZONE).toISOString(),
  };
}

export function clinicDateNavigation(date: Date): {
  previous: string;
  current: string;
  next: string;
} {
  const zoned = toZonedTime(date, CLINIC_TIMEZONE);

  return {
    previous: formatClinicDate(addDays(zoned, -1)),
    current: formatClinicDate(zoned),
    next: formatClinicDate(addDays(zoned, 1)),
  };
}

export function toClinicIso(date: string, time: string): string {
  return fromZonedTime(`${date}T${time}:00`, CLINIC_TIMEZONE).toISOString();
}

export function formatClinicTime(isoDate: string): string {
  return format(toZonedTime(parseISO(isoDate), CLINIC_TIMEZONE), "HH:mm");
}

export function formatClinicDateTime(isoDate: string): string {
  return format(
    toZonedTime(parseISO(isoDate), CLINIC_TIMEZONE),
    "dd/MM/yyyy HH:mm",
  );
}

export function splitClinicDateTime(isoDate: string): {
  date: string;
  time: string;
} {
  const zoned = toZonedTime(parseISO(isoDate), CLINIC_TIMEZONE);

  return {
    date: format(zoned, "yyyy-MM-dd"),
    time: format(zoned, "HH:mm"),
  };
}

export function toCalendarEvents(
  appointments: AgendaAppointment[],
): AgendaCalendarEvent[] {
  return appointments.map((appointment) => ({
    id: appointment.id,
    title: appointment.patientName,
    start: new Date(appointment.startsAt),
    end: new Date(appointment.endsAt),
    resourceId: appointment.dentistId,
    dentistColor: appointment.dentistColor,
    status: appointment.status,
    patientName: appointment.patientName,
    procedureName: appointment.procedureName,
  }));
}

export function groupAppointmentsByDentist(
  appointments: AgendaAppointment[],
  dentists: AgendaDentist[],
): AgendaDayGroup[] {
  const grouped = new Map<string, AgendaAppointment[]>();

  for (const appointment of appointments) {
    const list = grouped.get(appointment.dentistId) ?? [];
    list.push(appointment);
    grouped.set(appointment.dentistId, list);
  }

  return dentists
    .filter((dentist) => grouped.has(dentist.id))
    .map((dentist) => ({
      dentist,
      appointments: (grouped.get(dentist.id) ?? []).sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    }));
}
