"use client";

import { useState } from "react";
import Link from "next/link";

import { StockAdjustmentForm } from "@/features/stock/components/stock-adjustment-form";
import { StockLabelSheet } from "@/features/stock/components/stock-label-sheet";
import { StockPackageForm } from "@/features/stock/components/stock-package-form";
import { StockSupplyNameEditor } from "@/features/stock/components/stock-supply-name-editor";
import { StockSupplyPackagesPanel } from "@/features/stock/components/stock-supply-packages-panel";
import type { SupplyDetail, SupplyPackageItem } from "@/features/stock/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface StockSupplyDetailProps {
  supply: SupplyDetail;
  canManage: boolean;
  canRegisterPackages: boolean;
  onRefresh: () => void;
  onClose: () => void;
}

function statusVariant(
  status: SupplyDetail["status"],
): "success" | "warning" | "destructive" {
  if (status === "ok") return "success";
  if (status === "below_minimum") return "warning";
  return "destructive";
}

export function StockSupplyDetail({
  supply,
  canManage,
  canRegisterPackages,
  onRefresh,
  onClose,
}: StockSupplyDetailProps) {
  const [activeTab, setActiveTab] = useState("packages");
  const [labelPackages, setLabelPackages] = useState<
    Array<SupplyPackageItem & { supplyName: string; unitLabel: string }>
  >([]);

  function openLabelSheet(packages: SupplyPackageItem[]) {
    setLabelPackages(
      packages.map((pkg) => ({
        ...pkg,
        supplyName: supply.name,
        unitLabel: supply.unitLabel,
      })),
    );
  }

  function handlePackageCreated(
    packages: Array<{ id: string; qrCode: string; quantity: number }>,
  ) {
    onRefresh();
    setActiveTab("packages");

    const enriched = packages.map((created) => ({
      id: created.id,
      qrCode: created.qrCode,
      quantity: created.quantity,
      remainingQuantity: created.quantity,
      lotNumber: null,
      expiresAt: null,
      status: "active" as const,
      statusLabel: "Ativo",
      supplyName: supply.name,
      unitLabel: supply.unitLabel,
    }));

    if (enriched.length > 0) {
      setLabelPackages(enriched);
    }
  }

  const tabCount =
    1 + (canRegisterPackages ? 1 : 0) + (canManage ? 1 : 0);

  const stockTabTriggerClass =
    "h-auto min-h-11 w-full flex-col gap-0.5 whitespace-normal px-1.5 py-2 text-center text-xs leading-tight sm:px-3 sm:text-sm";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <StockSupplyNameEditor
            supply={supply}
            canEdit={canManage}
            onSaved={onRefresh}
          />
          <p className="mt-1 text-sm text-muted-foreground">
            Saldo {supply.currentQuantity} {supply.unitLabel} · mínimo{" "}
            {supply.minimumQuantity}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={statusVariant(supply.status)}>
            {supply.statusLabel}
          </Badge>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="min-h-11"
          >
            Voltar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0">
        <TabsList
          className={cn(
            "grid w-full",
            tabCount === 1 && "grid-cols-1",
            tabCount === 2 && "grid-cols-2",
            tabCount >= 3 && "grid-cols-3",
          )}
        >
          <TabsTrigger value="packages" className={stockTabTriggerClass}>
            <span className="font-medium">Pacotes</span>
            <span className="hidden font-normal text-muted-foreground sm:inline">
              e etiquetas
            </span>
          </TabsTrigger>
          {canRegisterPackages ? (
            <TabsTrigger value="entry" className={stockTabTriggerClass}>
              <span className="font-medium">Entrada</span>
              <span className="hidden font-normal text-muted-foreground sm:inline">
                de material
              </span>
            </TabsTrigger>
          ) : null}
          {canManage ? (
            <TabsTrigger value="adjust" className={stockTabTriggerClass}>
              <span className="font-medium">Ajuste</span>
              <span className="hidden font-normal text-muted-foreground sm:inline">
                de saldo
              </span>
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="packages" className="space-y-6">
          <StockSupplyPackagesPanel
            supply={supply}
            canManage={canManage}
            canDeletePackages={canRegisterPackages}
            onPrintLabels={openLabelSheet}
            onRefresh={onRefresh}
          />

          <section className="space-y-3">
            <h4 className="font-medium">Movimentações recentes</h4>
            {supply.movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem movimentações.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {supply.movements.map((movement) => (
                  <li
                    key={movement.id}
                    className="rounded-lg border border-border px-3 py-2"
                  >
                    <p className="font-medium">
                      {movement.movementType === "in"
                        ? "Entrada"
                        : movement.movementType === "out"
                          ? "Saída"
                          : "Ajuste"}{" "}
                      · {movement.quantity}
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(movement.createdAt).toLocaleString("pt-BR")}
                      {movement.performerName
                        ? ` · ${movement.performerName}`
                        : ""}
                      {movement.packageQrCode
                        ? ` · ${movement.packageQrCode}`
                        : ""}
                    </p>
                    {movement.notes ? (
                      <p className="text-muted-foreground">{movement.notes}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>

        {canRegisterPackages ? (
          <TabsContent value="entry" className="space-y-4">
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">
                Use só quando o material chegou na clínica
              </p>
              <p className="mt-1 text-muted-foreground">
                Isso cria um QR novo, aumenta o saldo e representa uma embalagem
                física. Para ver ou reimprimir uma etiqueta existente, volte à
                aba Pacotes e etiquetas. Para retirar unidades, use{" "}
                <Link
                  href="/estoque/scan"
                  className="font-medium text-foreground underline"
                >
                  Scan QR
                </Link>
                .
              </p>
            </div>
            <StockPackageForm
              supplyId={supply.id}
              onCreated={handlePackageCreated}
            />
          </TabsContent>
        ) : null}

        {canManage ? (
          <TabsContent value="adjust" className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <p>
                Correção manual do número do saldo (contagem, quebra, diferença).
                Não gera QR e não substitui a retirada por scan.
              </p>
            </div>
            <StockAdjustmentForm
              supply={supply}
              onDone={() => {
                setActiveTab("packages");
                onRefresh();
              }}
            />
          </TabsContent>
        ) : null}
      </Tabs>

      {labelPackages.length > 0 ? (
        <StockLabelSheet
          packages={labelPackages}
          onClose={() => setLabelPackages([])}
        />
      ) : null}
    </div>
  );
}
