"use client";

import { useState, useTransition } from "react";

import { addPackageAction } from "@/features/stock/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StockPackageFormProps {
  supplyId: string;
  onCreated: (
    packages: Array<{ id: string; qrCode: string; quantity: number }>,
  ) => void;
}

export function StockPackageForm({
  supplyId,
  onCreated,
}: StockPackageFormProps) {
  const [quantity, setQuantity] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await addPackageAction({
        supplyId,
        quantity,
        lotNumber: lotNumber || undefined,
        expiresAt: expiresAt || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.packages) {
        onCreated(result.packages);
      }

      setQuantity("");
      setLotNumber("");
      setExpiresAt("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-border p-4"
    >
      <p className="font-medium">Adicionar pacote</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="pkg-quantity">Quantidade</Label>
          <Input
            id="pkg-quantity"
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="text-base"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pkg-lot">Lote</Label>
          <Input
            id="pkg-lot"
            value={lotNumber}
            onChange={(event) => setLotNumber(event.target.value)}
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pkg-expires">Validade</Label>
          <Input
            id="pkg-expires"
            type="date"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            className="text-base"
          />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending} className="min-h-11">
        {isPending ? "Gerando..." : "Gerar pacote e QR"}
      </Button>
    </form>
  );
}
