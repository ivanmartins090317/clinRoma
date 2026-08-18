"use client";

import { useMemo, useRef, useState, useTransition } from "react";

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

interface OdontogramMobileProps {
  patientId: string;
  findings: ToothFindingRecord[];
  canWrite: boolean;
}

function findingKey(toothNumber: number, surface: string): string {
  return `${toothNumber}:${surface}`;
}

export function OdontogramMobile({
  patientId,
  findings,
  canWrite,
}: OdontogramMobileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const findingMap = useMemo(() => {
    const map = new Map<string, ToothFindingRecord>();

    for (const finding of findings) {
      map.set(findingKey(finding.toothNumber, finding.toothSurface), finding);
    }

    return map;
  }, [findings]);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedSurface, setSelectedSurface] = useState("oclusal");
  const [selectedCondition, setSelectedCondition] =
    useState<ToothConditionCode>("healthy");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  function getToothColor(toothNumber: number): string {
    const match = TOOTH_SURFACES.map((surface) =>
      findingMap.get(findingKey(toothNumber, surface)),
    ).find(Boolean);

    if (!match) {
      return "#e5e7eb";
    }

    return (
      TOOTH_CONDITIONS[match.conditionCode as ToothConditionCode]?.color ??
      "#e5e7eb"
    );
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

  return (
    <div className="space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Odontograma</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 min-w-11"
            onClick={() => setScale((value) => Math.max(0.8, value - 0.1))}
          >
            -
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 min-w-11"
            onClick={() => setScale((value) => Math.min(2, value + 0.1))}
          >
            +
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl border border-border bg-card"
        onPointerDown={(event) => {
          dragRef.current = {
            x: event.clientX - offset.x,
            y: event.clientY - offset.y,
          };
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) {
            return;
          }

          setOffset({
            x: event.clientX - dragRef.current.x,
            y: event.clientY - dragRef.current.y,
          });
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onPointerLeave={() => {
          dragRef.current = null;
        }}
      >
        <div
          className="grid grid-cols-8 gap-2 p-4 touch-pan-y"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {FDI_TOOTH_NUMBERS.map((toothNumber) => (
            <button
              key={toothNumber}
              type="button"
              disabled={!canWrite}
              onClick={() => setSelectedTooth(toothNumber)}
              className={cn(
                "flex min-h-11 min-w-11 items-center justify-center rounded-md border text-xs font-medium",
                selectedTooth === toothNumber && "ring-2 ring-primary",
              )}
              style={{ backgroundColor: getToothColor(toothNumber) }}
            >
              {toothNumber}
            </button>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 space-y-3 rounded-xl border border-border bg-background p-4 shadow-lg">
        <p className="text-sm font-medium">
          {selectedTooth ? `Dente ${selectedTooth}` : "Toque em um dente"}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
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
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {canWrite ? (
          <Button
            type="button"
            disabled={!selectedTooth || isPending}
            onClick={handleConfirm}
            className="min-h-11 w-full"
          >
            {isPending ? "Salvando..." : "Confirmar achado"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
