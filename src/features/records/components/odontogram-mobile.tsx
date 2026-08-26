"use client";

import { useMemo, useRef, useState, useTransition } from "react";

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

interface OdontogramMobileProps {
  patientId: string;
  findings: ToothFindingRecord[];
  canWrite: boolean;
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
      map.set(
        toothFindingKey(finding.toothNumber, finding.toothSurface),
        finding,
      );
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

  function isInteractiveTarget(target: EventTarget | null): boolean {
    return (
      target instanceof Element &&
      Boolean(target.closest("button, [role='button']"))
    );
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
            onClick={() => setScale((value) => Math.max(0.25, value - 0.1))}
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
          if (isInteractiveTarget(event.target)) {
            return;
          }

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
          className="flex min-h-64 justify-center p-4"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <OdontogramCross
            findings={findings}
            selectedTooth={selectedTooth}
            selectedSurface={selectedSurface}
            size="touch"
            onSelectTooth={handleSelectTooth}
            onSelectSurface={handleSelectSurface}
          />
        </div>
      </div>

      <div className="sticky bottom-0 space-y-3 rounded-xl border border-border bg-background p-4 shadow-lg">
        {selectedTooth ? (
          <p className="text-sm font-medium">
            Dente selecionado {selectedTooth}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Toque um dente ou uma face para registrar o achado.
          </p>
        )}
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
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {canWrite ? (
          <Button
            type="button"
            disabled={!selectedTooth || !selectedSurface || isPending}
            onClick={handleConfirm}
            className="min-h-11 min-w-11 w-full"
          >
            {isPending ? "Salvando..." : "Confirmar achado"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
