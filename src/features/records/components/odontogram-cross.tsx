"use client";

import {
  CROSS_LOWER_LEFT,
  CROSS_LOWER_RIGHT,
  CROSS_UPPER_LEFT,
  CROSS_UPPER_RIGHT,
  ODONTOGRAM_TOUCH_FACE_MIN_PX,
  resolveSurfaceColor,
  toothFindingKey,
} from "@/features/records/domain/odontogram-cross";
import {
  TOOTH_SURFACES,
  type ToothSurface,
} from "@/features/records/domain/tooth-fdi";
import { ToothViews } from "@/features/records/components/tooth-views";
import type { ToothFindingRecord } from "@/features/records/queries";
import { cn } from "@/lib/utils";

export type OdontogramCrossSize = "compact" | "touch";

const COLUMN_PX: Record<OdontogramCrossSize, number> = {
  compact: 52,
  touch: ODONTOGRAM_TOUCH_FACE_MIN_PX * 3,
};

interface OdontogramCrossProps {
  findings: ToothFindingRecord[];
  selectedTooth: number | null;
  selectedSurface: string | null;
  size: OdontogramCrossSize;
  onSelectTooth: (toothNumber: number) => void;
  onSelectSurface: (toothNumber: number, surface: ToothSurface) => void;
}

export function OdontogramCross({
  findings,
  selectedTooth,
  selectedSurface,
  size,
  onSelectTooth,
  onSelectSurface,
}: OdontogramCrossProps) {
  const columnPx = COLUMN_PX[size];
  const findingMap = new Map(
    findings.map((finding) => [
      toothFindingKey(finding.toothNumber, finding.toothSurface),
      finding,
    ]),
  );

  function colorsForTooth(
    toothNumber: number,
  ): Partial<Record<ToothSurface, string>> {
    const colors: Partial<Record<ToothSurface, string>> = {};

    for (const surface of TOOTH_SURFACES) {
      const finding = findingMap.get(toothFindingKey(toothNumber, surface));
      colors[surface] = resolveSurfaceColor(finding?.conditionCode);
    }

    return colors;
  }

  return (
    <div className="inline-flex flex-col items-center">
      <QuadrantRow
        leftTeeth={CROSS_UPPER_RIGHT}
        rightTeeth={CROSS_UPPER_LEFT}
        selectedTooth={selectedTooth}
        selectedSurface={selectedSurface}
        columnPx={columnPx}
        numberPlacement="below"
        colorsForTooth={colorsForTooth}
        onSelectTooth={onSelectTooth}
        onSelectSurface={onSelectSurface}
      />
      <div className="h-0.5 w-full bg-primary" aria-hidden />
      <QuadrantRow
        leftTeeth={CROSS_LOWER_RIGHT}
        rightTeeth={CROSS_LOWER_LEFT}
        selectedTooth={selectedTooth}
        selectedSurface={selectedSurface}
        columnPx={columnPx}
        numberPlacement="above"
        colorsForTooth={colorsForTooth}
        onSelectTooth={onSelectTooth}
        onSelectSurface={onSelectSurface}
      />
    </div>
  );
}

interface QuadrantRowProps {
  leftTeeth: readonly number[];
  rightTeeth: readonly number[];
  selectedTooth: number | null;
  selectedSurface: string | null;
  columnPx: number;
  numberPlacement: "above" | "below";
  colorsForTooth: (
    toothNumber: number,
  ) => Partial<Record<ToothSurface, string>>;
  onSelectTooth: (toothNumber: number) => void;
  onSelectSurface: (toothNumber: number, surface: ToothSurface) => void;
}

function QuadrantRow({
  leftTeeth,
  rightTeeth,
  selectedTooth,
  selectedSurface,
  columnPx,
  numberPlacement,
  colorsForTooth,
  onSelectTooth,
  onSelectSurface,
}: QuadrantRowProps) {
  return (
    <div className="flex items-stretch">
      {leftTeeth.map((toothNumber) => (
        <ToothColumn
          key={toothNumber}
          toothNumber={toothNumber}
          selected={selectedTooth === toothNumber}
          selectedSurface={
            selectedTooth === toothNumber ? selectedSurface : null
          }
          columnPx={columnPx}
          numberPlacement={numberPlacement}
          surfaceColors={colorsForTooth(toothNumber)}
          onSelectTooth={onSelectTooth}
          onSelectSurface={onSelectSurface}
        />
      ))}
      <div className="w-0.5 shrink-0 bg-primary" aria-hidden />
      {rightTeeth.map((toothNumber) => (
        <ToothColumn
          key={toothNumber}
          toothNumber={toothNumber}
          selected={selectedTooth === toothNumber}
          selectedSurface={
            selectedTooth === toothNumber ? selectedSurface : null
          }
          columnPx={columnPx}
          numberPlacement={numberPlacement}
          surfaceColors={colorsForTooth(toothNumber)}
          onSelectTooth={onSelectTooth}
          onSelectSurface={onSelectSurface}
        />
      ))}
    </div>
  );
}

interface ToothColumnProps {
  toothNumber: number;
  selected: boolean;
  selectedSurface: string | null;
  columnPx: number;
  numberPlacement: "above" | "below";
  surfaceColors: Partial<Record<ToothSurface, string>>;
  onSelectTooth: (toothNumber: number) => void;
  onSelectSurface: (toothNumber: number, surface: ToothSurface) => void;
}

function ToothColumn({
  toothNumber,
  selected,
  selectedSurface,
  columnPx,
  numberPlacement,
  surfaceColors,
  onSelectTooth,
  onSelectSurface,
}: ToothColumnProps) {
  const numberLabel = (
    <span
      className={cn(
        "flex h-5 items-center justify-center text-[10px] font-semibold tabular-nums",
        selected ? "text-primary" : "text-foreground",
      )}
    >
      {toothNumber}
    </span>
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-sm",
        selected && "ring-2 ring-neo-gold-500 ring-offset-1",
      )}
    >
      {numberPlacement === "above" ? numberLabel : null}
      <ToothViews
        toothNumber={toothNumber}
        surfaceColors={surfaceColors}
        selectedSurface={selectedSurface}
        columnPx={columnPx}
        onSelectTooth={onSelectTooth}
        onSelectSurface={onSelectSurface}
      />
      {numberPlacement === "below" ? numberLabel : null}
    </div>
  );
}
