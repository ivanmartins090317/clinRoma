"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createSupplyAction,
  updateSupplyAction,
} from "@/features/stock/actions";
import type { SupplyDetail } from "@/features/stock/queries";
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

interface StockSupplyFormProps {
  supply?: SupplyDetail;
  onClose: () => void;
}

const UNIT_OPTIONS: Array<{ value: SupplyType; label: string }> = [
  { value: "unit", label: "Unitário" },
  { value: "box", label: "Caixa" },
  { value: "roll", label: "Rolo" },
  { value: "bottle", label: "Frasco" },
];

export function StockSupplyForm({ supply, onClose }: StockSupplyFormProps) {
  const router = useRouter();
  const [name, setName] = useState(supply?.name ?? "");
  const [unit, setUnit] = useState<SupplyType>(supply?.unit ?? "unit");
  const [minimumQuantity, setMinimumQuantity] = useState(
    String(supply?.minimumQuantity ?? 0),
  );
  const [initialQuantity, setInitialQuantity] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = supply
        ? await updateSupplyAction({
            id: supply.id,
            name,
            unit,
            minimumQuantity,
          })
        : await createSupplyAction({
            name,
            unit,
            minimumQuantity,
            initialQuantity,
          });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push(`/estoque?id=${result.supplyId ?? supply?.id}`);
      router.refresh();
      onClose();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="supply-name">Nome</Label>
        <Input
          id="supply-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="text-base"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Unidade</Label>
        <Select
          value={unit}
          onValueChange={(value) => setUnit(value as SupplyType)}
        >
          <SelectTrigger className="text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNIT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supply-minimum">Estoque mínimo</Label>
        <Input
          id="supply-minimum"
          type="number"
          min={0}
          step="any"
          value={minimumQuantity}
          onChange={(event) => setMinimumQuantity(event.target.value)}
          className="text-base"
        />
      </div>

      {!supply ? (
        <div className="space-y-2">
          <Label htmlFor="supply-initial">Saldo inicial (opcional)</Label>
          <Input
            id="supply-initial"
            type="number"
            min={0}
            step="any"
            value={initialQuantity}
            onChange={(event) => setInitialQuantity(event.target.value)}
            className="text-base"
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending} className="min-h-11">
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="min-h-11"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
