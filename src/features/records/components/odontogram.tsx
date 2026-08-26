"use client";

import { useMemo, useState, useTransition } from "react";

import { upsertToothFindingAction } from "@/features/records/actions";
import { OdontogramCross } from "@/features/records/components/odontogram-cross";
import {
  getBitingSurface,
  toothFindingKey,
  TOOTH_SURFACE_LABELS,
} from "@/features/records/domain/odontogram-cross";
import {
  isValidToothCondition,
  TOOTH_CONDITIONS,
  TOOTH_SURFACES,
  type ToothConditionCode,
  type ToothSurface,
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

interface OdontogramProps {
  patientId: string;
  findings: ToothFindingRecord[];
  canWrite: boolean;
}

export function Odontogram({ patientId, findings, canWrite }: OdontogramProps) {
  const findingMap = useMemo(() => {
    const map = new Map<string, ToothFindingRecord>();

    for (const finding of findings) {
      map.set(
        toothFindingKey(finding.toothNumber, finding.toothSurface),
        finding,
      );
    }

    return map;
  }, [findings]);

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<string>("oclusal");
  const [selectedCondition, setSelectedCondition] =
    useState<ToothConditionCode>("healthy");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function syncConditionFromFinding(toothNumber: number, surface: string) {
    const existing = findingMap.get(toothFindingKey(toothNumber, surface));

    if (existing && isValidToothCondition(existing.conditionCode)) {
      setSelectedCondition(existing.conditionCode);
    }
  }

  function handleSelectTooth(toothNumber: number) {
    setSelectedTooth(toothNumber);
    const nextSurface =
      selectedTooth === toothNumber
        ? selectedSurface
        : getBitingSurface(toothNumber);
    setSelectedSurface(nextSurface);
    syncConditionFromFinding(toothNumber, nextSurface);
  }

  function handleSelectSurface(toothNumber: number, surface: ToothSurface) {
    setSelectedTooth(toothNumber);
    setSelectedSurface(surface);
    syncConditionFromFinding(toothNumber, surface);
  }

  function handleConfirm() {
    if (!selectedTooth || !selectedSurface || !canWrite) {
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

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold">Odontograma</h3>

      <div className="overflow-x-auto">
        <OdontogramCross
          findings={findings}
          selectedTooth={selectedTooth}
          selectedSurface={selectedSurface}
          size="compact"
          onSelectTooth={handleSelectTooth}
          onSelectSurface={handleSelectSurface}
        />
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
                    {TOOTH_SURFACE_LABELS[surface]}
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
          Toque um dente ou uma face para registrar o achado.
        </p>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {canWrite ? (
        <Button
          type="button"
          disabled={!selectedTooth || !selectedSurface || isPending}
          onClick={handleConfirm}
          className="min-h-11 min-w-11"
        >
          {isPending ? "Salvando..." : "Confirmar achado"}
        </Button>
      ) : null}
    </div>
  );
}
