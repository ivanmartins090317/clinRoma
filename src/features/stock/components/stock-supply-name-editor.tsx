"use client";

import { useState, useTransition } from "react";

import { updateSupplyAction } from "@/features/stock/actions";
import type { SupplyDetail } from "@/features/stock/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StockSupplyNameEditorProps {
  supply: SupplyDetail;
  canEdit: boolean;
  onSaved: () => void;
}

export function StockSupplyNameEditor({
  supply,
  canEdit,
  onSaved,
}: StockSupplyNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(supply.name);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit() {
    setName(supply.name);
    setError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setName(supply.name);
    setError(null);
    setIsEditing(false);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateSupplyAction({
        id: supply.id,
        name,
        unit: supply.unit,
        minimumQuantity: supply.minimumQuantity,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setIsEditing(false);
      onSaved();
    });
  }

  if (!isEditing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-semibold">{supply.name}</h3>
        {canEdit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startEdit}
          >
            Editar nome
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Label htmlFor="supply-name-edit">Nome do insumo</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="supply-name-edit"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="max-w-md text-base"
          required
          autoFocus
        />
        <Button type="submit" disabled={isPending} className="min-h-11">
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={cancelEdit}
          className="min-h-11"
        >
          Cancelar
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
