"use client";

import { useRouter } from "next/navigation";

import { StockList } from "@/features/stock/components/stock-list";
import { StockPurchaseWizard } from "@/features/stock/components/stock-purchase-wizard";
import { StockSupplyDetail } from "@/features/stock/components/stock-supply-detail";
import { StockSupplyForm } from "@/features/stock/components/stock-supply-form";
import type { SupplyDetail, SupplyListItem } from "@/features/stock/queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SupplyType } from "@/types/clinroma";

interface StockPageShellProps {
  supplies: SupplyListItem[];
  selectedSupply: SupplyDetail | null;
  supplyOptions: Array<{ id: string; name: string; unit: SupplyType }>;
  canManage: boolean;
  canRegisterPurchase: boolean;
  canScan: boolean;
  showNewForm: boolean;
  showPurchaseWizard: boolean;
}

export function StockPageShell({
  supplies,
  selectedSupply,
  supplyOptions,
  canManage,
  canRegisterPurchase,
  canScan,
  showNewForm,
  showPurchaseWizard,
}: StockPageShellProps) {
  const router = useRouter();

  function goToList() {
    router.push("/estoque");
    router.refresh();
  }

  return (
    <>
      {selectedSupply ? (
        <StockSupplyDetail
          supply={selectedSupply}
          canManage={canManage}
          canRegisterPackages={canRegisterPurchase}
          onRefresh={() => router.refresh()}
          onClose={goToList}
        />
      ) : (
        <StockList
          initialSupplies={supplies}
          canManage={canManage}
          canRegisterPurchase={canRegisterPurchase}
          canScan={canScan}
          selectedSupplyId={undefined}
        />
      )}

      <Dialog open={showNewForm} onOpenChange={(open) => !open && goToList()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo insumo</DialogTitle>
          </DialogHeader>
          <StockSupplyForm supply={undefined} onClose={goToList} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPurchaseWizard}
        onOpenChange={(open) => !open && goToList()}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <StockPurchaseWizard
            existingSupplies={supplyOptions}
            onClose={goToList}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
