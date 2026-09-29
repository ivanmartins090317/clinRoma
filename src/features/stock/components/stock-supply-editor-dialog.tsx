"use client";

import { StockSupplyForm } from "@/features/stock/components/stock-supply-form";
import type { SupplyDetail } from "@/features/stock/queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StockSupplyEditorDialogProps {
  supply: SupplyDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockSupplyEditorDialog({
  supply,
  open,
  onOpenChange,
}: StockSupplyEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar insumo</DialogTitle>
        </DialogHeader>
        {open ? (
          <StockSupplyForm
            supply={supply}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
