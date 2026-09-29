import Link from "next/link";

import { getWaitlistSummary } from "@/features/waitlist/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WAITLIST_COLORS } from "@/types/clinroma";

import { BlocoEntrada, LugarFalha } from "./lugar-reservado";

export async function FilaAguardando({ ordem }: { ordem: number }) {
  const waitlistSummary = await getWaitlistSummary().catch(() => null);

  if (!waitlistSummary) {
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
              Fila · aguardando
            </h3>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">
              {waitlistSummary.totalWaiting === 0
                ? "Nenhum paciente aguardando encaixe"
                : `${waitlistSummary.totalWaiting} paciente(s) na fila`}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm" className="min-h-11">
            <Link href="/fila">Abrir fila</Link>
          </Button>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {Object.entries(WAITLIST_COLORS).map(([key, color]) => {
            const count =
              waitlistSummary.waitingByPriority[
                key as keyof typeof waitlistSummary.waitingByPriority
              ];
            const badgeVariant =
              key === "red"
                ? "destructive"
                : key === "yellow"
                  ? "warning"
                  : "success";

            return (
              <Badge key={key} variant={badgeVariant} dot>
                {count} {color.label.toLowerCase()}
              </Badge>
            );
          })}
        </div>

        {waitlistSummary.expiringSoon.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {waitlistSummary.expiringSoon.map((item) => (
              <li
                key={item.entryId}
                className="rounded-[9px] border border-[#ecd9a8] bg-[#fdf6e4] px-3.5 py-2.5 text-sm text-[#5f430e]"
              >
                Oferta de {item.patientName} expira em {item.minutesLeft} min
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </BlocoEntrada>
  );
}
