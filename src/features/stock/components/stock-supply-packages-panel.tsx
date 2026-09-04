"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";

import {
  adminOverrideWithdrawAction,
  deletePackageAction,
} from "@/features/stock/actions";
import type { SupplyDetail, SupplyPackageItem } from "@/features/stock/queries";
import { StockQrPreviewDialog } from "@/features/stock/components/stock-qr-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StockSupplyPackagesPanelProps {
  supply: SupplyDetail;
  canManage: boolean;
  canDeletePackages: boolean;
  onPrintLabels: (packages: SupplyPackageItem[]) => void;
  onRefresh: () => void;
}

export function StockSupplyPackagesPanel({
  supply,
  canManage,
  canDeletePackages,
  onPrintLabels,
  onRefresh,
}: StockSupplyPackagesPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewPackage, setPreviewPackage] =
    useState<SupplyPackageItem | null>(null);
  const [packageToDelete, setPackageToDelete] =
    useState<SupplyPackageItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [forceWithdrawPackageId, setForceWithdrawPackageId] = useState<
    string | null
  >(null);
  const [forceWithdrawQuantity, setForceWithdrawQuantity] = useState("");
  const [forceWithdrawError, setForceWithdrawError] = useState<string | null>(
    null,
  );
  const [isForceWithdrawPending, startForceWithdrawTransition] =
    useTransition();
  const [showHistory, setShowHistory] = useState(false);

  const activePackages = useMemo(
    () => supply.packages.filter((pkg) => pkg.status === "active"),
    [supply.packages],
  );
  const historyPackages = useMemo(
    () => supply.packages.filter((pkg) => pkg.status !== "active"),
    [supply.packages],
  );

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

  function confirmForceWithdraw(qrCode: string) {
    setForceWithdrawError(null);
    startForceWithdrawTransition(async () => {
      const result = await adminOverrideWithdrawAction({
        qrCode,
        quantity: forceWithdrawQuantity,
        notes: "Retirada forçada pelo administrador no detalhe",
      });

      if (result.error) {
        setForceWithdrawError(result.error);
        return;
      }

      setForceWithdrawPackageId(null);
      setForceWithdrawQuantity("");
      onRefresh();
    });
  }

  function confirmDeletePackage() {
    if (!packageToDelete) return;

    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deletePackageAction({
        packageId: packageToDelete.id,
      });

      if (result.error) {
        setDeleteError(result.error);
        return;
      }

      setPackageToDelete(null);
      setSelectedIds((current) =>
        current.filter((id) => id !== packageToDelete.id),
      );
      onRefresh();
    });
  }

  function renderPackageRow(pkg: SupplyPackageItem) {
    return (
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
              variant={pkg.status === "active" ? "success" : "destructive"}
            >
              {pkg.statusLabel}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => setPreviewPackage(pkg)}
            >
              Ver / baixar QR
            </Button>
            {canManage && pkg.status !== "active" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 border-destructive text-destructive"
                onClick={() => {
                  setForceWithdrawPackageId(pkg.id);
                  setForceWithdrawQuantity(String(pkg.remainingQuantity));
                  setForceWithdrawError(null);
                }}
              >
                Forçar retirada
              </Button>
            ) : null}
            {canDeletePackages ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 border-destructive text-destructive"
                onClick={() => {
                  setDeleteError(null);
                  setPackageToDelete(pkg);
                }}
              >
                Deletar
              </Button>
            ) : null}
          </div>
        </div>

        {forceWithdrawPackageId === pkg.id ? (
          <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
            <div className="space-y-1">
              <label
                htmlFor={`force-withdraw-${pkg.id}`}
                className="text-sm font-medium"
              >
                Quantidade (retirada forçada)
              </label>
              <Input
                id={`force-withdraw-${pkg.id}`}
                type="number"
                min={0}
                step="any"
                value={forceWithdrawQuantity}
                onChange={(event) =>
                  setForceWithdrawQuantity(event.target.value)
                }
                className="text-base"
              />
            </div>
            <Button
              type="button"
              className="min-h-11"
              disabled={isForceWithdrawPending}
              onClick={() => confirmForceWithdraw(pkg.qrCode)}
            >
              Confirmar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setForceWithdrawPackageId(null)}
            >
              Cancelar
            </Button>
          </div>
        ) : null}
      </li>
    );
  }

  const deleteDialogDescription = packageToDelete
    ? packageToDelete.remainingQuantity > 0
      ? `O pacote ${packageToDelete.qrCode} será removido da lista. O restante (${packageToDelete.remainingQuantity} ${supply.unitLabel}) também será baixado do saldo do produto. Esta ação não pode ser desfeita.`
      : `O pacote ${packageToDelete.qrCode} será removido do histórico e não poderá ser recuperado. O saldo do produto não muda (já estava esgotado).`
    : "";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <p>
          Aqui você consulta as embalagens já etiquetadas. Para retirar
          unidades, use{" "}
          <Link
            href="/estoque/scan"
            className="font-medium text-foreground underline"
          >
            Scan QR
          </Link>
          . Para material novo, abra a aba Nova entrada.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-medium">Pacotes ativos</h4>
          <p className="text-sm text-muted-foreground">
            Selecione e imprima, ou toque em Ver / baixar QR para ver o código na
            tela.
          </p>
        </div>
        <Button
          type="button"
          disabled={selectedPackages.length === 0}
          onClick={() => onPrintLabels(selectedPackages)}
          className="min-h-11"
        >
          Imprimir selecionados
        </Button>
      </div>

      {activePackages.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum pacote ativo. Se o material chegou agora, use a aba Nova
          entrada para gerar a etiqueta.
        </p>
      ) : (
        <ul className="space-y-2">{activePackages.map(renderPackageRow)}</ul>
      )}

      {historyPackages.length > 0 ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 px-0"
            onClick={() => setShowHistory((value) => !value)}
          >
            {showHistory
              ? "Ocultar pacotes esgotados ou vencidos"
              : `Ver pacotes esgotados ou vencidos (${historyPackages.length})`}
          </Button>
          {showHistory ? (
            <ul className="space-y-2">
              {historyPackages.map(renderPackageRow)}
            </ul>
          ) : null}
        </div>
      ) : null}

      {forceWithdrawError ? (
        <p className="text-sm text-destructive">{forceWithdrawError}</p>
      ) : null}

      {previewPackage ? (
        <StockQrPreviewDialog
          open
          qrCode={previewPackage.qrCode}
          supplyName={supply.name}
          remainingLabel={`Restante ${previewPackage.remainingQuantity} de ${previewPackage.quantity} ${supply.unitLabel}`}
          onOpenChange={(open) => {
            if (!open) setPreviewPackage(null);
          }}
        />
      ) : null}

      <Dialog
        open={packageToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletePending) {
            setPackageToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deletar pacote?</DialogTitle>
            <DialogDescription>{deleteDialogDescription}</DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={isDeletePending}
              onClick={() => {
                setPackageToDelete(null);
                setDeleteError(null);
              }}
            >
              Não, manter
            </Button>
            <Button
              type="button"
              className="min-h-11 bg-priority-red text-white hover:bg-priority-red/90"
              disabled={isDeletePending}
              onClick={confirmDeletePackage}
            >
              {isDeletePending ? "Deletando..." : "Sim, deletar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
