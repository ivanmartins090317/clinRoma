export const FDI_TOOTH_NUMBERS = [
  11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33,
  34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48,
] as const;

export type FdiToothNumber = (typeof FDI_TOOTH_NUMBERS)[number];

export const TOOTH_SURFACES = [
  "vestibular",
  "lingual",
  "palatina",
  "mesial",
  "distal",
  "oclusal",
  "incisal",
] as const;

export type ToothSurface = (typeof TOOTH_SURFACES)[number];

export const TOOTH_CONDITIONS = {
  healthy: { label: "Saudável", color: "#22c55e" },
  caries: { label: "Cárie", color: "#ef4444" },
  restoration: { label: "Restauração", color: "#3b82f6" },
  missing: { label: "Ausente", color: "#6b7280" },
  treatment_needed: { label: "Tratamento indicado", color: "#f59e0b" },
} as const;

export type ToothConditionCode = keyof typeof TOOTH_CONDITIONS;

export function isValidFdiToothNumber(value: number): value is FdiToothNumber {
  return FDI_TOOTH_NUMBERS.includes(value as FdiToothNumber);
}

export function isValidToothSurface(value: string): value is ToothSurface {
  return (TOOTH_SURFACES as readonly string[]).includes(value);
}

export function isValidToothCondition(
  value: string,
): value is ToothConditionCode {
  return value in TOOTH_CONDITIONS;
}

export function validateToothFinding(input: {
  toothNumber: number;
  toothSurface: string;
  conditionCode: string;
}): string | null {
  if (!isValidFdiToothNumber(input.toothNumber)) {
    return "Dente inválido. Use numeração FDI (11 a 48).";
  }

  if (!isValidToothSurface(input.toothSurface)) {
    return "Face dentária inválida.";
  }

  if (!isValidToothCondition(input.conditionCode)) {
    return "Condição clínica inválida.";
  }

  return null;
}
