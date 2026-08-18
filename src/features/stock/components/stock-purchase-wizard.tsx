"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  registerPurchaseAction,
  uploadSupplySheetAction,
} from "@/features/stock/actions";
import { StockLabelSheet } from "@/features/stock/components/stock-label-sheet";
import type { LabelPackageData } from "@/features/stock/components/stock-label-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SupplyType } from "@/types/clinroma";

interface PurchaseLine {
  key: string;
  mode: "existing" | "new";
  supplyId: string;
  newName: string;
  newUnit: SupplyType;
  newMinimum: string;
  quantityPerPackage: string;
  packageCount: string;
  lotNumber: string;
  expiresAt: string;
  bulkQuantity: string;
}

interface StockPurchaseWizardProps {
  existingSupplies: Array<{ id: string; name: string; unit: SupplyType }>;
  onClose: () => void;
}

function createEmptyLine(): PurchaseLine {
  return {
    key: crypto.randomUUID(),
    mode: "existing",
    supplyId: "",
    newName: "",
    newUnit: "unit",
    newMinimum: "0",
    quantityPerPackage: "",
    packageCount: "1",
    lotNumber: "",
    expiresAt: "",
    bulkQuantity: "",
  };
}

export function StockPurchaseWizard({
  existingSupplies,
  onClose,
}: StockPurchaseWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [sheetPath, setSheetPath] = useState<string | undefined>();
  const [sheetMeta, setSheetMeta] = useState<{
    mimeType: string;
    fileSizeBytes: number;
  } | null>(null);
  const [lines, setLines] = useState<PurchaseLine[]>([createEmptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [labelPackages, setLabelPackages] = useState<LabelPackageData[]>([]);
  const [isPending, startTransition] = useTransition();

  const review = useMemo(() => {
    const totalPackages = lines.reduce(
      (sum, line) => sum + Number(line.packageCount || 0),
      0,
    );
    const totalEntries = lines.reduce((sum, line) => {
      const perPackage = Number(line.quantityPerPackage || 0);
      const count = Number(line.packageCount || 0);
      const bulk = Number(line.bulkQuantity || 0);
      return sum + perPackage * count + bulk;
    }, 0);

    return { totalPackages, totalEntries };
  }, [lines]);

  function updateLine(key: string, patch: Partial<PurchaseLine>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadSupplySheetAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      setSheetPath(result.storagePath);
      setSheetMeta({
        mimeType: file.type,
        fileSizeBytes: file.size,
      });
      setError(null);
    });
  }

  function handleConfirm() {
    setError(null);

    startTransition(async () => {
      const result = await registerPurchaseAction({
        sheetStoragePath: sheetPath,
        sheetMimeType: sheetMeta?.mimeType,
        sheetFileSizeBytes: sheetMeta?.fileSizeBytes,
        items: lines.map((line) => ({
          supplyId: line.mode === "existing" ? line.supplyId : undefined,
          newSupply:
            line.mode === "new"
              ? {
                  name: line.newName,
                  unit: line.newUnit,
                  minimumQuantity: line.newMinimum,
                }
              : undefined,
          quantityPerPackage: line.quantityPerPackage,
          packageCount: line.packageCount,
          lotNumber: line.lotNumber || undefined,
          expiresAt: line.expiresAt || undefined,
          bulkQuantity: line.bulkQuantity ? line.bulkQuantity : undefined,
        })),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.packages?.length) {
        setLabelPackages(
          result.packages.map((pkg) => {
            const line = lines[0];
            const supply =
              line.mode === "existing"
                ? existingSupplies.find((item) => item.id === line.supplyId)
                : null;

            return {
              id: pkg.id,
              qrCode: pkg.qrCode,
              quantity: pkg.quantity,
              lotNumber: line.lotNumber || null,
              expiresAt: line.expiresAt || null,
              supplyName: supply?.name ?? line.newName,
              unitLabel: supply?.unit ?? line.newUnit,
            };
          }),
        );
      }

      router.refresh();
      setStep(4);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Registrar compra / planilha</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Digite os itens manualmente a partir da foto. Sem OCR.
        </p>
      </div>

      {step === 1 ? (
        <section className="space-y-3 rounded-xl border border-border p-4">
          <p className="font-medium">1. Foto da planilha (opcional)</p>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
          />
          {sheetPath ? (
            <p className="text-sm text-priority-green">Planilha enviada.</p>
          ) : null}
          <Button type="button" onClick={() => setStep(2)} className="min-h-11">
            Continuar
          </Button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <p className="font-medium">2. Itens digitados</p>
          {lines.map((line) => (
            <div
              key={line.key}
              className="space-y-3 rounded-xl border border-border p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={line.mode}
                    onValueChange={(value) =>
                      updateLine(line.key, {
                        mode: value as "existing" | "new",
                      })
                    }
                  >
                    <SelectTrigger className="text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="existing">Insumo existente</SelectItem>
                      <SelectItem value="new">Novo insumo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {line.mode === "existing" ? (
                  <div className="space-y-2">
                    <Label>Insumo</Label>
                    <Select
                      value={line.supplyId}
                      onValueChange={(value) =>
                        updateLine(line.key, { supplyId: value })
                      }
                    >
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingSupplies.map((supply) => (
                          <SelectItem key={supply.id} value={supply.id}>
                            {supply.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={line.newName}
                        onChange={(event) =>
                          updateLine(line.key, { newName: event.target.value })
                        }
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mínimo</Label>
                      <Input
                        type="number"
                        value={line.newMinimum}
                        onChange={(event) =>
                          updateLine(line.key, {
                            newMinimum: event.target.value,
                          })
                        }
                        className="text-base"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label>Qtd. por pacote</Label>
                  <Input
                    type="number"
                    value={line.quantityPerPackage}
                    onChange={(event) =>
                      updateLine(line.key, {
                        quantityPerPackage: event.target.value,
                      })
                    }
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pacotes iguais</Label>
                  <Input
                    type="number"
                    value={line.packageCount}
                    onChange={(event) =>
                      updateLine(line.key, { packageCount: event.target.value })
                    }
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lote</Label>
                  <Input
                    value={line.lotNumber}
                    onChange={(event) =>
                      updateLine(line.key, { lotNumber: event.target.value })
                    }
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Validade</Label>
                  <Input
                    type="date"
                    value={line.expiresAt}
                    onChange={(event) =>
                      updateLine(line.key, { expiresAt: event.target.value })
                    }
                    className="text-base"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setLines((current) => [...current, createEmptyLine()])
              }
            >
              Adicionar linha
            </Button>
            <Button
              type="button"
              onClick={() => setStep(3)}
              className="min-h-11"
            >
              Revisar
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4 rounded-xl border border-border p-4">
          <p className="font-medium">3. Revisão</p>
          <p className="text-sm text-muted-foreground">
            {review.totalPackages} pacote(s) · {review.totalEntries} unidades de
            entrada
          </p>
          <Button
            type="button"
            disabled={isPending}
            onClick={handleConfirm}
            className="min-h-11"
          >
            {isPending ? "Registrando..." : "Confirmar entrada"}
          </Button>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-3 rounded-xl border border-border p-4">
          <p className="font-medium text-priority-green">Compra registrada.</p>
          <Button type="button" onClick={onClose} className="min-h-11">
            Voltar ao estoque
          </Button>
        </section>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="button" variant="ghost" onClick={onClose}>
        Cancelar
      </Button>

      {labelPackages.length > 0 ? (
        <StockLabelSheet
          packages={labelPackages}
          onClose={() => setLabelPackages([])}
        />
      ) : null}
    </div>
  );
}
