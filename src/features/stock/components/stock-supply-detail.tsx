"use client";

import { useMemo, useState, useTransition } from "react";
import QRCode from "qrcode";

import { adminOverrideWithdrawAction } from "@/features/stock/actions";
import type { SupplyDetail, SupplyPackageItem } from "@/features/stock/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StockAdjustmentForm } from "@/features/stock/components/stock-adjustment-form";
import { StockLabelSheet } from "@/features/stock/components/stock-label-sheet";
import { StockPackageForm } from "@/features/stock/components/stock-package-form";
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAdjust, setShowAdjust] = useState(false);
  const [labelPackages, setLabelPackages] = useState<
    Array<SupplyPackageItem & { supplyName: string; unitLabel: string }>
  >([]);
  const [overridePackageId, setOverridePackageId] = useState<string | null>(
    null,
  );
  const [overrideQuantity, setOverrideQuantity] = useState("");
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [isOverridePending, startOverrideTransition] = useTransition();

  const selectedPackages = useMemo(
    () => supply.packages.filter((pkg) => selectedIds.includes(pkg.id)),
    [supply.packages, selectedIds],
  );

  function togglePackage(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function handlePackageCreated(
    packages: Array<{ id: string; qrCode: string; quantity: number }>,
  ) {
    onRefresh();
    const enriched = packages
      .map((created) => {
        const match = supply.packages.find((pkg) => pkg.id === created.id);
        return match
          ? { ...match, supplyName: supply.name, unitLabel: supply.unitLabel }
          : {
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
            };
      })
      .filter(Boolean) as Array<
      SupplyPackageItem & { supplyName: string; unitLabel: string }
    >;

    if (enriched.length > 0) {
      setLabelPackages(enriched);
    }
  }

  async function downloadPackageQr(pkg: SupplyPackageItem) {
    const dataUrl = await QRCode.toDataURL(pkg.qrCode, {
      margin: 1,
      width: 512,
    });
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `${pkg.qrCode}.png`;
    anchor.click();
  }

  function handleAdminOverride(pkg: SupplyPackageItem) {
    setOverridePackageId(pkg.id);
    setOverrideQuantity(String(pkg.remainingQuantity));
    setOverrideError(null);
  }

  function confirmAdminOverride(qrCode: string) {
    setOverrideError(null);
    startOverrideTransition(async () => {
      const result = await adminOverrideWithdrawAction({
        qrCode,
        quantity: overrideQuantity,
        notes: "Override admin no detalhe",
      });

      if (result.error) {
        setOverrideError(result.error);
        return;
      }

      setOverridePackageId(null);
      setOverrideQuantity("");
      onRefresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{supply.name}</h3>
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

      {canRegisterPackages ? (
        <StockPackageForm
          supplyId={supply.id}
          onCreated={handlePackageCreated}
        />
      ) : null}

      {canManage ? (
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => setShowAdjust((value) => !value)}
          >
            {showAdjust ? "Ocultar ajuste" : "Ajustar saldo"}
          </Button>
          {showAdjust ? (
            <StockAdjustmentForm
              supply={supply}
              onDone={() => {
                setShowAdjust(false);
                onRefresh();
              }}
            />
          ) : null}
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-medium">Pacotes</h4>
          <Button
            type="button"
            disabled={selectedPackages.length === 0}
            onClick={() =>
              setLabelPackages(
                selectedPackages.map((pkg) => ({
                  ...pkg,
                  supplyName: supply.name,
                  unitLabel: supply.unitLabel,
                })),
              )
            }
            className="min-h-11"
          >
            Imprimir etiquetas
          </Button>
        </div>

        {supply.packages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum pacote cadastrado.
          </p>
        ) : (
          <ul className="space-y-2">
            {supply.packages.map((pkg) => (
              <li
                key={pkg.id}
                className={cn(
                  "rounded-xl border px-4 py-3",
                  selectedIds.includes(pkg.id)
                    ? "border-neo-gold-500 bg-neo-gold-500/5"
                    : "border-border",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex min-h-11 items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(pkg.id)}
                      onChange={() => togglePackage(pkg.id)}
                    />
                    <div>
                      <p className="font-medium">{pkg.qrCode}</p>
                      <p className="text-sm text-muted-foreground">
                        Restante {pkg.remainingQuantity} de {pkg.quantity}
                        {pkg.lotNumber ? ` · Lote ${pkg.lotNumber}` : ""}
                        {pkg.expiresAt ? ` · Val. ${pkg.expiresAt}` : ""}
                      </p>
                    </div>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        pkg.status === "active" ? "success" : "destructive"
                      }
                    >
                      {pkg.statusLabel}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => downloadPackageQr(pkg)}
                    >
                      PNG
                    </Button>
                    {canManage && pkg.status !== "active" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive"
                        onClick={() => handleAdminOverride(pkg)}
                      >
                        Override retirada
                      </Button>
                    ) : null}
                  </div>
                </div>

                {overridePackageId === pkg.id ? (
                  <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
                    <div className="space-y-1">
                      <label
                        htmlFor={`override-${pkg.id}`}
                        className="text-sm font-medium"
                      >
                        Quantidade (override admin)
                      </label>
                      <Input
                        id={`override-${pkg.id}`}
                        type="number"
                        min={0}
                        step="any"
                        value={overrideQuantity}
                        onChange={(event) =>
                          setOverrideQuantity(event.target.value)
                        }
                        className="text-base"
                      />
                    </div>
                    <Button
                      type="button"
                      className="min-h-11"
                      disabled={isOverridePending}
                      onClick={() => confirmAdminOverride(pkg.qrCode)}
                    >
                      Confirmar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOverridePackageId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {overrideError ? (
          <p className="text-sm text-destructive">{overrideError}</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h4 className="font-medium">Movimentações recentes</h4>
        {supply.movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem movimentações.</p>
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
                  {movement.performerName ? ` · ${movement.performerName}` : ""}
                  {movement.packageQrCode ? ` · ${movement.packageQrCode}` : ""}
                </p>
                {movement.notes ? (
                  <p className="text-muted-foreground">{movement.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {labelPackages.length > 0 ? (
        <StockLabelSheet
          packages={labelPackages}
          onClose={() => setLabelPackages([])}
        />
      ) : null}
    </div>
  );
}
