"use client";

import { useState, useTransition } from "react";

import { deleteSupplyAction } from "@/features/stock/actions";
import type { SupplyDetail } from "@/features/stock/queries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StockSupplyDeleteDialogProps {
  supply: SupplyDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function StockSupplyDeleteDialog({
  supply,
  open,
  onOpenChange,
  onDeleted,
}: StockSupplyDeleteDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeDialog() {
    if (isPending) return;
    setError(null);
    onOpenChange(false);
  }

  function confirmDelete() {
    setError(null);

    startTransition(async () => {
      const result = await deleteSupplyAction({ id: supply.id });

      if (result.error) {
        setError(result.error);
        return;
      }

      onDeleted();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeDialog();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deletar insumo?</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              Apagar {supply.name} remove o item, as etiquetas QR e o histórico
              de entradas e saídas. Essa ação não volta atrás.
            </span>
            <span className="block">
              Se a ideia é só parar o alerta de reposição, cancele e use Editar
              insumo para colocar o estoque mínimo em 0.
            </span>
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={isPending}
            onClick={closeDialog}
          >
            Não, manter
          </Button>
          <Button
            type="button"
            className="min-h-11 bg-priority-red text-white hover:bg-priority-red/90"
            disabled={isPending}
            onClick={confirmDelete}
          >
            {isPending ? "Deletando..." : "Sim, deletar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
