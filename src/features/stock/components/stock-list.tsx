"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { searchSuppliesAction } from "@/features/stock/actions";
import type { SupplyListItem } from "@/features/stock/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StockListProps {
  initialSupplies: SupplyListItem[];
  canManage: boolean;
  canRegisterPurchase: boolean;
  canScan: boolean;
  selectedSupplyId?: string;
}

function statusVariant(
  status: SupplyListItem["status"],
): "success" | "warning" | "destructive" {
  if (status === "ok") return "success";
  if (status === "below_minimum") return "warning";
  return "destructive";
}

export function StockList({
  initialSupplies,
  canManage,
  canRegisterPurchase,
  canScan,
  selectedSupplyId,
}: StockListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [supplies, setSupplies] = useState(initialSupplies);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (query.trim()) return;
    setSupplies(initialSupplies);
  }, [initialSupplies, query]);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      startTransition(async () => {
        const results = await searchSuppliesAction(query);
        setSupplies(results);
      });
    }, 300);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar insumo por nome"
          className="text-base"
          aria-label="Buscar insumos"
        />
        <div className="flex flex-wrap gap-2">
          {canScan ? (
            <Button asChild className="min-h-11">
              <Link href="/estoque/scan">Scan QR · retirada</Link>
            </Button>
          ) : null}
          {canManage ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => router.push("/estoque?novo=1")}
            >
              Novo insumo
            </Button>
          ) : null}
          {canRegisterPurchase ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => router.push("/estoque?compra=1")}
            >
              Registrar compra
            </Button>
          ) : null}
        </div>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Buscando...</p>
      ) : null}

      {supplies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhum insumo encontrado
        </div>
      ) : (
        <>
          <ul className="space-y-2 md:hidden">
            {supplies.map((supply) => (
              <li key={supply.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/estoque?id=${supply.id}`)}
                  className={cn(
                    "flex w-full min-h-11 flex-col gap-2 rounded-xl border bg-card px-4 py-3 text-left",
                    selectedSupplyId === supply.id
                      ? "border-neo-gold-500"
                      : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{supply.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {supply.currentQuantity} {supply.unitLabel} · mín.{" "}
                        {supply.minimumQuantity}
                      </p>
                    </div>
                    <Badge variant={statusVariant(supply.status)}>
                      {supply.statusLabel}
                    </Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Insumo</th>
                  <th className="px-4 py-3 font-medium">Unidade</th>
                  <th className="px-4 py-3 font-medium">Saldo</th>
                  <th className="px-4 py-3 font-medium">Mínimo</th>
                  <th className="px-4 py-3 font-medium">Situação</th>
                </tr>
              </thead>
              <tbody>
                {supplies.map((supply) => (
                  <tr
                    key={supply.id}
                    className="cursor-pointer border-t border-border hover:bg-muted/20"
                    onClick={() => router.push(`/estoque?id=${supply.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">{supply.name}</td>
                    <td className="px-4 py-3">{supply.unitLabel}</td>
                    <td className="px-4 py-3">{supply.currentQuantity}</td>
                    <td className="px-4 py-3">{supply.minimumQuantity}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(supply.status)}>
                        {supply.statusLabel}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
