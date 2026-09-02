import {
  addDays,
  addMinutes,
  format,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { CLINIC_TIMEZONE, toClinicIso } from "@/features/agenda/types";

export const PAST_SLOT_MESSAGE = "Não é possível marcar horário no passado";

export function isClinicDateTimeInThePast(
  date: string,
  time: string,
  now: Date = new Date(),
): boolean {
  return new Date(toClinicIso(date, time)).getTime() <= now.getTime();
}

export function isInstantInThePast(
  isoDate: string,
  now: Date = new Date(),
): boolean {
  return new Date(isoDate).getTime() <= now.getTime();
}

export function nextAvailableClinicSlot(
  durationMinutes = 30,
  now: Date = new Date(),
): { date: string; startTime: string; endTime: string } {
  const zoned = setMilliseconds(
    setSeconds(toZonedTime(now, CLINIC_TIMEZONE), 0),
    0,
  );
  const remainder = zoned.getMinutes() % 30;
  let start = addMinutes(zoned, remainder === 0 ? 30 : 30 - remainder);
  let end = addMinutes(start, durationMinutes);

  if (format(end, "yyyy-MM-dd") !== format(start, "yyyy-MM-dd")) {
    start = setHours(setMinutes(addDays(start, 1), 0), 8);
    end = addMinutes(start, durationMinutes);
  }

  return {
    date: format(start, "yyyy-MM-dd"),
    startTime: format(start, "HH:mm"),
    endTime: format(end, "HH:mm"),
  };
}
