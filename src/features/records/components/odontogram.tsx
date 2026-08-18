"use client";

import { useMemo, useState, useTransition } from "react";

import { upsertToothFindingAction } from "@/features/records/actions";
import {
  FDI_TOOTH_NUMBERS,
  TOOTH_CONDITIONS,
  TOOTH_SURFACES,
  type ToothConditionCode,
} from "@/features/records/domain/tooth-fdi";
import type { ToothFindingRecord } from "@/features/records/queries";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

interface OdontogramProps {
  patientId: string;
  findings: ToothFindingRecord[];
  canWrite: boolean;
}

function findingKey(toothNumber: number, surface: string): string {
  return `${toothNumber}:${surface}`;
}

export function Odontogram({ patientId, findings, canWrite }: OdontogramProps) {
  const findingMap = useMemo(() => {
    const map = new Map<string, ToothFindingRecord>();

    for (const finding of findings) {
      map.set(findingKey(finding.toothNumber, finding.toothSurface), finding);
    }

    return map;
  }, [findings]);

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<string>("oclusal");
  const [selectedCondition, setSelectedCondition] =
    useState<ToothConditionCode>("healthy");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function getToothColor(toothNumber: number): string {
    const surfaces = TOOTH_SURFACES.map((surface) =>
      findingMap.get(findingKey(toothNumber, surface)),
    ).filter(Boolean);

    if (surfaces.length === 0) {
      return "#e5e7eb";
    }

    const code = surfaces[0]!.conditionCode as ToothConditionCode;
    return TOOTH_CONDITIONS[code]?.color ?? "#e5e7eb";
  }

  function handleConfirm() {
    if (!selectedTooth || !canWrite) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await upsertToothFindingAction({
        patientId,
        toothNumber: selectedTooth,
        toothSurface: selectedSurface,
        conditionCode: selectedCondition,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      toast("Achado odontológico salvo");
    });
  }

  const quadrants = [
    FDI_TOOTH_NUMBERS.slice(0, 8),
    FDI_TOOTH_NUMBERS.slice(8, 16),
    FDI_TOOTH_NUMBERS.slice(16, 24),
    FDI_TOOTH_NUMBERS.slice(24, 32),
  ];

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold">Odontograma FDI</h3>

      <div className="space-y-3">
        {quadrants.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap justify-center gap-2">
            {row.map((toothNumber) => (
              <button
                key={toothNumber}
                type="button"
                disabled={!canWrite}
                onClick={() => setSelectedTooth(toothNumber)}
                className={cn(
                  "flex size-11 items-center justify-center rounded-md border text-xs font-medium",
                  selectedTooth === toothNumber && "ring-2 ring-primary",
                )}
                style={{ backgroundColor: getToothColor(toothNumber) }}
              >
                {toothNumber}
              </button>
            ))}
          </div>
        ))}
      </div>

      {selectedTooth ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Dente selecionado</Label>
            <p className="text-sm font-medium">{selectedTooth}</p>
          </div>
          <div className="space-y-2">
            <Label>Face</Label>
            <Select value={selectedSurface} onValueChange={setSelectedSurface}>
              <SelectTrigger className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOOTH_SURFACES.map((surface) => (
                  <SelectItem key={surface} value={surface}>
                    {surface}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Condição</Label>
            <Select
              value={selectedCondition}
              onValueChange={(value) =>
                setSelectedCondition(value as ToothConditionCode)
              }
            >
              <SelectTrigger className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TOOTH_CONDITIONS).map(([code, meta]) => (
                  <SelectItem key={code} value={code}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Selecione um dente para registrar achado.
        </p>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {canWrite ? (
        <Button
          type="button"
          disabled={!selectedTooth || isPending}
          onClick={handleConfirm}
          className="min-h-11"
        >
          {isPending ? "Salvando..." : "Confirmar achado"}
        </Button>
      ) : null}
    </div>
  );
}
