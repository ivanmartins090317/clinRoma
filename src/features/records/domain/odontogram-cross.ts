import {
  TOOTH_CONDITIONS,
  type FdiToothNumber,
  type ToothConditionCode,
  type ToothSurface,
} from "@/features/records/domain/tooth-fdi";

export const CROSS_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11] as const;
export const CROSS_UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28] as const;
export const CROSS_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41] as const;
export const CROSS_LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38] as const;

export const CROSS_UPPER_ROW = [
  ...CROSS_UPPER_RIGHT,
  ...CROSS_UPPER_LEFT,
] as const;

export const CROSS_LOWER_ROW = [
  ...CROSS_LOWER_RIGHT,
  ...CROSS_LOWER_LEFT,
] as const;

export const NEUTRAL_SURFACE_COLOR = "#e5e7eb";
export const ODONTOGRAM_TOUCH_FACE_MIN_PX = 44;

export const TOOTH_SURFACE_LABELS: Record<ToothSurface, string> = {
  vestibular: "Vestibular",
  lingual: "Lingual",
  palatina: "Palatina",
  mesial: "Mesial",
  distal: "Distal",
  oclusal: "Oclusal",
  incisal: "Incisal",
};

export type ArchPosition = "upper" | "lower";
export type PatientSide = "right" | "left";
export type ScreenSide = "left" | "right";
export type PermanentToothKind = "incisor" | "canine" | "premolar" | "molar";
export type ToothViewKind = "root" | "crown" | "occlusal";
export type BitingSurface = Extract<ToothSurface, "oclusal" | "incisal">;
export type TongueSideSurface = Extract<ToothSurface, "palatina" | "lingual">;

export interface OcclusalFaceLayout {
  center: BitingSurface;
  top: ToothSurface;
  bottom: ToothSurface;
  left: ToothSurface;
  right: ToothSurface;
}

export function toothFindingKey(toothNumber: number, surface: string): string {
  return `${toothNumber}:${surface}`;
}

export function getFdiQuadrant(toothNumber: number): 1 | 2 | 3 | 4 {
  return Math.floor(toothNumber / 10) as 1 | 2 | 3 | 4;
}

export function getArchPosition(toothNumber: number): ArchPosition {
  const quadrant = getFdiQuadrant(toothNumber);
  return quadrant === 1 || quadrant === 2 ? "upper" : "lower";
}

export function getPatientSide(toothNumber: number): PatientSide {
  const quadrant = getFdiQuadrant(toothNumber);
  return quadrant === 1 || quadrant === 4 ? "right" : "left";
}

export function getScreenSide(toothNumber: number): ScreenSide {
  return getPatientSide(toothNumber) === "right" ? "left" : "right";
}

export function isAnteriorTooth(toothNumber: number): boolean {
  const position = toothNumber % 10;
  return position >= 1 && position <= 3;
}

export function getBitingSurface(toothNumber: number): BitingSurface {
  return isAnteriorTooth(toothNumber) ? "incisal" : "oclusal";
}

export function getTongueSideSurface(toothNumber: number): TongueSideSurface {
  return getArchPosition(toothNumber) === "upper" ? "palatina" : "lingual";
}

export function getPermanentToothKind(toothNumber: number): PermanentToothKind {
  const position = toothNumber % 10;

  if (position === 1 || position === 2) {
    return "incisor";
  }

  if (position === 3) {
    return "canine";
  }

  if (position === 4 || position === 5) {
    return "premolar";
  }

  return "molar";
}

export function getRootCount(toothNumber: number): 1 | 2 | 3 {
  const kind = getPermanentToothKind(toothNumber);
  const isUpper = getArchPosition(toothNumber) === "upper";
  const position = toothNumber % 10;

  if (kind === "molar") {
    return isUpper ? 3 : 2;
  }

  if (kind === "premolar" && isUpper && position === 4) {
    return 2;
  }

  return 1;
}

export function getViewStack(toothNumber: number): ToothViewKind[] {
  return getArchPosition(toothNumber) === "upper"
    ? ["root", "crown", "occlusal"]
    : ["occlusal", "crown", "root"];
}

export function getRootDirection(toothNumber: number): "up" | "down" {
  return getArchPosition(toothNumber) === "upper" ? "up" : "down";
}

export function getOcclusalFaceLayout(toothNumber: number): OcclusalFaceLayout {
  const isUpper = getArchPosition(toothNumber) === "upper";
  const isPatientRight = getPatientSide(toothNumber) === "right";
  const tongueSide = getTongueSideSurface(toothNumber);

  return {
    center: getBitingSurface(toothNumber),
    top: isUpper ? "vestibular" : tongueSide,
    bottom: isUpper ? tongueSide : "vestibular",
    left: isPatientRight ? "distal" : "mesial",
    right: isPatientRight ? "mesial" : "distal",
  };
}

export function resolveSurfaceColor(
  conditionCode: string | null | undefined,
): string {
  if (!conditionCode) {
    return NEUTRAL_SURFACE_COLOR;
  }

  return (
    TOOTH_CONDITIONS[conditionCode as ToothConditionCode]?.color ??
    NEUTRAL_SURFACE_COLOR
  );
}

export function isCrossToothNumber(value: number): value is FdiToothNumber {
  return (
    CROSS_UPPER_ROW.includes(value as (typeof CROSS_UPPER_ROW)[number]) ||
    CROSS_LOWER_ROW.includes(value as (typeof CROSS_LOWER_ROW)[number])
  );
}
