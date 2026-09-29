import Link from "next/link";

import { SUPPLY_UNIT_LABELS } from "@/features/stock/lib/clinic-date";
import { getStockAlerts } from "@/features/stock/queries";
import { Button } from "@/components/ui/button";

import { BlocoEntrada, LugarFalha } from "./lugar-reservado";

export async function EstoqueAbaixoDoMinimo({ ordem }: { ordem: number }) {
  const stockAlerts = await getStockAlerts().catch(() => null);

  if (!stockAlerts) {
    return (
      <BlocoEntrada ordem={ordem}>
        <LugarFalha variante="cartao" />
      </BlocoEntrada>
    );
  }

  return (
    <BlocoEntrada ordem={ordem}>
      <section className="rounded-(--radius) border border-[#f0e3db] bg-neo-white p-5 shadow-neo md:p-5.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-[17px] font-bold text-foreground">
              Estoque · abaixo do mínimo
            </h3>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">
              {stockAlerts.length === 0
                ? "Nenhum insumo abaixo do mínimo"
                : `${stockAlerts.length} insumo(s) precisam de reposição`}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm" className="min-h-11">
            <Link href="/estoque">Abrir estoque</Link>
          </Button>
        </div>

        {stockAlerts.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {stockAlerts.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-col gap-2.5 rounded-[9px] border border-[#ecd9a8] bg-[#fdf6e4] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-[#5f430e]">
                    {alert.name}
                  </p>
                  <p className="text-xs font-semibold text-priority-yellow">
                    {alert.currentQuantity} de {alert.minimumQuantity}{" "}
                    {SUPPLY_UNIT_LABELS[alert.unit]}
                  </p>
                </div>
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="min-h-11 w-full sm:w-auto"
                >
                  <Link href="/estoque">Ver insumo</Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-neo-ink-3">
            Nenhum insumo abaixo do mínimo.
          </p>
        )}
      </section>
    </BlocoEntrada>
  );
}
