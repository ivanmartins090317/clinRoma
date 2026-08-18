"use client";

import { useState, useTransition } from "react";

import { adjustSupplyAction } from "@/features/stock/actions";
import type { SupplyDetail } from "@/features/stock/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StockAdjustmentFormProps {
  supply: SupplyDetail;
  onDone: () => void;
}

export function StockAdjustmentForm({
  supply,
  onDone,
}: StockAdjustmentFormProps) {
  const [quantity, setQuantity] = useState("");
  const [direction, setDirection] = useState<"increase" | "decrease">(
    "decrease",
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await adjustSupplyAction({
        supplyId: supply.id,
        quantity,
        direction,
        notes,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      onDone();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-border p-4"
    >
      <p className="font-medium">Ajustar saldo</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="adjust-quantity">Quantidade</Label>
          <Input
            id="adjust-quantity"
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
          <Label htmlFor="adjust-direction">Direção</Label>
          <select
            id="adjust-direction"
            value={direction}
            onChange={(event) =>
              setDirection(event.target.value as "increase" | "decrease")
            }
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base"
          >
            <option value="increase">Entrada (+)</option>
            <option value="decrease">Saída (-)</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="adjust-notes">Observação</Label>
        <textarea
          id="adjust-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
          required
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending} className="min-h-11">
        {isPending ? "Aplicando..." : "Confirmar ajuste"}
      </Button>
    </form>
  );
}
