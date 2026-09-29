import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  CLINIC_TIMEZONE,
  clinicDayBounds,
  formatClinicDate,
  groupAppointmentsByDentist,
  parseClinicDateParam,
  type AgendaAppointment,
  type AgendaDayGroup,
  type AgendaDentist,
} from "@/features/agenda/types";

export const AGENDA_RANGE_MAX_DAYS = 31;

export interface AgendaDateRange {
  from: string;
  to: string;
  isExplicit: boolean;
  wasClamped: boolean;
}

export interface AgendaRangeDay {
  date: string;
  label: string;
  groups: AgendaDayGroup[];
}

interface AgendaHrefOptions {
  date?: string;
  from?: string;
  to?: string;
  dentistId?: string;
}

function isClinicDateParam(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = parseISO(`${value}T12:00:00`);

  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
}

function calendarDate(value: string): Date {
  return parseISO(`${value}T12:00:00`);
}

export function resolveAgendaDateRange(
  fromParam: string | undefined,
  toParam: string | undefined,
  fallbackDate: string,
): AgendaDateRange {
  const fromValid = isClinicDateParam(fromParam) ? fromParam : null;
  const toValid = isClinicDateParam(toParam) ? toParam : null;
  let from = fromValid ?? toValid ?? fallbackDate;
  let to = toValid ?? fromValid ?? fallbackDate;

  if (from > to) {
    const swapped = from;
    from = to;
    to = swapped;
  }

  const span =
    differenceInCalendarDays(calendarDate(to), calendarDate(from)) + 1;

  if (span > AGENDA_RANGE_MAX_DAYS) {
    return {
      from,
      to: format(
        addDays(calendarDate(from), AGENDA_RANGE_MAX_DAYS - 1),
        "yyyy-MM-dd",
      ),
      isExplicit: true,
      wasClamped: true,
    };
  }

  return {
    from,
    to,
    isExplicit: Boolean(fromValid || toValid),
    wasClamped: false,
  };
}

export function clinicRangeBounds(
  from: string,
  to: string,
): { start: string; end: string } {
  return {
    start: clinicDayBounds(parseClinicDateParam(from)).start,
    end: clinicDayBounds(parseClinicDateParam(to)).end,
  };
}

export function formatAgendaDayLabel(date: string): string {
  const formatted = formatInTimeZone(
    fromZonedTime(`${date}T12:00:00`, CLINIC_TIMEZONE),
    CLINIC_TIMEZONE,
    "EEEE, d 'de' MMMM",
    { locale: ptBR },
  );

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function groupAppointmentsByClinicDay(
  appointments: AgendaAppointment[],
  dentists: AgendaDentist[],
): AgendaRangeDay[] {
  const byDate = new Map<string, AgendaAppointment[]>();

  for (const appointment of appointments) {
    const date = formatClinicDate(parseISO(appointment.startsAt));
    const list = byDate.get(date) ?? [];
    list.push(appointment);
    byDate.set(date, list);
  }

  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dayAppointments]) => ({
      date,
      label: formatAgendaDayLabel(date),
      groups: groupAppointmentsByDentist(dayAppointments, dentists),
    }));
}

export function buildAgendaHref(options: AgendaHrefOptions): string {
  const params = new URLSearchParams();

  if (options.date) {
    params.set("date", options.date);
  }

  if (options.from) {
    params.set("from", options.from);
  }

  if (options.to) {
    params.set("to", options.to);
  }

  if (options.dentistId && options.dentistId !== "all") {
    params.set("dentist", options.dentistId);
  }

  const query = params.toString();

  return query ? `/agenda?${query}` : "/agenda";
}
