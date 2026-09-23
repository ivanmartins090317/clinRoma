"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  registerPurchaseAction,
  uploadSupplySheetAction,
} from "@/features/stock/actions";
import { StockLabelSheet } from "@/features/stock/components/stock-label-sheet";
import type { LabelPackageData } from "@/features/stock/components/stock-label-sheet";
import { SuggestPurchaseItems } from "@/features/stock/components/suggest-purchase-items";
import { purchasePhotoInputAttrs } from "@/features/stock/domain/purchase-photo-capture";
import type {
  PurchaseSuggestionTrace,
  SuggestedPurchaseLine,
} from "@/features/stock/schemas";
import { SUPPLY_UNIT_LABELS } from "@/features/stock/lib/clinic-date";
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
  newUnit: SupplyType | "";
  newMinimum: string;
  quantityPerPackage: string;
  packageCount: string;
  lotNumber: string;
  expiresAt: string;
  bulkQuantity: string;
}

interface SuggestionBaseline {
  key: string;
  fingerprint: string;
}

interface SuggestionSession {
  suggestedLineCount: number;
  visionModel: string;
  baselines: SuggestionBaseline[];
}

interface StockPurchaseWizardProps {
  existingSupplies: Array<{ id: string; name: string; unit: SupplyType }>;
  canCreateSupply: boolean;
  onClose: () => void;
}

const UNIT_OPTIONS = Object.entries(SUPPLY_UNIT_LABELS) as Array<
  [SupplyType, string]
>;

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

function lineFingerprint(line: PurchaseLine): string {
  return [
    line.mode,
    line.supplyId,
    line.newName.trim(),
    line.newUnit,
    line.quantityPerPackage.trim(),
    line.packageCount.trim(),
    line.lotNumber.trim(),
    line.expiresAt.trim(),
  ].join("|");
}

function mapSuggestedToLine(
  suggested: SuggestedPurchaseLine,
  canCreateSupply: boolean,
): PurchaseLine {
  const useExisting =
    suggested.mode === "existing" && Boolean(suggested.supplyId);
  const mode: "existing" | "new" =
    canCreateSupply && !useExisting ? "new" : "existing";

  return {
    key: crypto.randomUUID(),
    mode,
    supplyId: useExisting ? (suggested.supplyId ?? "") : "",
    newName: suggested.name,
    newUnit: suggested.unit ?? "",
    newMinimum: "0",
    quantityPerPackage:
      suggested.quantityPerPackage !== null
        ? String(suggested.quantityPerPackage)
        : "",
    packageCount:
      suggested.packageCount !== null ? String(suggested.packageCount) : "1",
    lotNumber: suggested.lotNumber ?? "",
    expiresAt: suggested.expiresAt ?? "",
    bulkQuantity: "",
  };
}

function buildSuggestionTrace(
  session: SuggestionSession | null,
  lines: PurchaseLine[],
): PurchaseSuggestionTrace | undefined {
  if (!session) return undefined;

  const currentByKey = new Map(lines.map((line) => [line.key, line]));
  let keptCount = 0;
  let editedCount = 0;
  let discardedCount = 0;

  for (const baseline of session.baselines) {
    const current = currentByKey.get(baseline.key);
    if (!current) {
      discardedCount += 1;
      continue;
    }

    if (lineFingerprint(current) === baseline.fingerprint) {
      keptCount += 1;
    } else {
      editedCount += 1;
    }
  }

  const baselineKeys = new Set(session.baselines.map((item) => item.key));
  const manualCount = lines.filter(
    (line) => !baselineKeys.has(line.key),
  ).length;

  return {
    suggestedLineCount: session.suggestedLineCount,
    keptCount,
    editedCount,
    discardedCount,
    manualCount,
    visionModel: session.visionModel,
  };
}

export function StockPurchaseWizard({
  existingSupplies,
  canCreateSupply,
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
  const [suggestionSession, setSuggestionSession] =
    useState<SuggestionSession | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
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

  function removeLine(key: string) {
    setLines((current) => {
      if (current.length <= 1) return current;
      return current.filter((line) => line.key !== key);
    });
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

  function handleSuggested(result: {
    lines: SuggestedPurchaseLine[];
    visionModel: string;
    truncated: boolean;
  }) {
    const mapped = result.lines.map((line) =>
      mapSuggestedToLine(line, canCreateSupply),
    );

    setLines(mapped);
    setSuggestionSession({
      suggestedLineCount: mapped.length,
      visionModel: result.visionModel,
      baselines: mapped.map((line) => ({
        key: line.key,
        fingerprint: lineFingerprint(line),
      })),
    });
    setError(null);
    setInfoMessage(
      result.truncated
        ? "Mostrei as 40 primeiras linhas. Digite o restante manualmente."
        : "Revise as linhas sugeridas antes de confirmar a entrada.",
    );
    setStep(2);
  }

  function handleConfirm() {
    setError(null);

    if (!canCreateSupply) {
      const hasUnresolvedNew = lines.some(
        (line) => line.mode === "new" || !line.supplyId,
      );
      if (hasUnresolvedNew) {
        setError(
          "Selecione um insumo existente em cada linha ou remova a linha.",
        );
        return;
      }
    } else {
      const missingUnit = lines.some(
        (line) => line.mode === "new" && !line.newUnit,
      );
      if (missingUnit) {
        setError("Selecione a unidade de cada insumo novo.");
        return;
      }
    }

    startTransition(async () => {
      const result = await registerPurchaseAction({
        sheetStoragePath: sheetPath,
        sheetMimeType: sheetMeta?.mimeType,
        sheetFileSizeBytes: sheetMeta?.fileSizeBytes,
        suggestionTrace: buildSuggestionTrace(suggestionSession, lines),
        items: lines.map((line) => {
          const mode = canCreateSupply ? line.mode : "existing";
          return {
            supplyId: mode === "existing" ? line.supplyId : undefined,
            newSupply:
              canCreateSupply && mode === "new"
                ? {
                    name: line.newName,
                    unit: line.newUnit || "unit",
                    minimumQuantity: line.newMinimum,
                  }
                : undefined,
            quantityPerPackage: line.quantityPerPackage,
            packageCount: line.packageCount,
            lotNumber: line.lotNumber || undefined,
            expiresAt: line.expiresAt || undefined,
            bulkQuantity: line.bulkQuantity ? line.bulkQuantity : undefined,
          };
        }),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.packages?.length) {
        setLabelPackages(
          result.packages.map((pkg) => {
            const line = lines[0];
            const supply = existingSupplies.find(
              (item) => item.id === line.supplyId,
            );

            return {
              id: pkg.id,
              qrCode: pkg.qrCode,
              quantity: pkg.quantity,
              lotNumber: line.lotNumber || null,
              expiresAt: line.expiresAt || null,
              supplyName: supply?.name ?? line.newName,
              unitLabel: supply?.unit ?? (line.newUnit || "unit"),
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
          {canCreateSupply
            ? "Sugira itens pela foto ou digite à mão. A entrada só grava depois da confirmação."
            : "Sugira itens pela foto ou selecione insumos já cadastrados. A entrada só grava depois da confirmação."}
        </p>
      </div>

      {step === 1 ? (
        <section className="space-y-3 rounded-xl border border-border p-4">
          <p className="font-medium">1. Foto da planilha (opcional)</p>
          <p className="text-sm text-muted-foreground">
            No celular, fotografe a planilha agora ou escolha um arquivo.
            Guarda só como referência histórica. Não preenche as linhas. Para
            sugerir itens, use o passo seguinte.
          </p>
          <Input {...purchasePhotoInputAttrs()} onChange={handleUpload} />
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
          <p className="font-medium">2. Itens</p>

          <SuggestPurchaseItems
            onSuggested={handleSuggested}
            onError={(message) => {
              setInfoMessage(null);
              setError(message);
            }}
          />

          {infoMessage ? (
            <p className="text-sm text-muted-foreground">{infoMessage}</p>
          ) : null}

          {lines.map((line) => (
            <div
              key={line.key}
              className="space-y-3 rounded-xl border border-border p-4"
            >
              {!canCreateSupply && line.newName ? (
                <p className="text-sm text-muted-foreground">
                  Lido na foto: {line.newName}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                {canCreateSupply ? (
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
                        <SelectItem value="existing">
                          Insumo existente
                        </SelectItem>
                        <SelectItem value="new">Novo insumo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {!canCreateSupply || line.mode === "existing" ? (
                  <div className="space-y-2">
                    <Label>Insumo</Label>
                    <Select
                      value={line.supplyId}
                      onValueChange={(value) =>
                        updateLine(line.key, {
                          mode: "existing",
                          supplyId: value,
                        })
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
                      <Label>Unidade</Label>
                      <Select
                        value={line.newUnit || undefined}
                        onValueChange={(value) =>
                          updateLine(line.key, {
                            newUnit: value as SupplyType,
                          })
                        }
                      >
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

              {lines.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeLine(line.key)}
                  className="min-h-11"
                >
                  Remover linha
                </Button>
              ) : null}
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setLines((current) => [...current, createEmptyLine()])
              }
              className="min-h-11"
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
            {review.totalPackages} pacote(s) e {review.totalPackages}{" "}
            etiqueta(s) · {review.totalEntries} unidades de entrada
          </p>
          <Button
            type="button"
            disabled={isPending}
            onClick={handleConfirm}
            className="min-h-11"
          >
            {isPending ? "Registrando..." : "Confirmar entrada"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(2)}
            className="min-h-11"
          >
            Voltar aos itens
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
