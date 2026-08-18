import { formatInTimeZone } from "date-fns-tz";

const CLINIC_TIMEZONE = "America/Sao_Paulo";

export function getClinicTodayDate(reference = new Date()): string {
  return formatInTimeZone(reference, CLINIC_TIMEZONE, "yyyy-MM-dd");
}

export const SUPPLY_UNIT_LABELS: Record<
  "unit" | "box" | "roll" | "bottle",
  string
> = {
  unit: "unitário",
  box: "caixa",
  roll: "rolo",
  bottle: "frasco",
};
